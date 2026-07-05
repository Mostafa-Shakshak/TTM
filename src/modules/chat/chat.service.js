const prisma = require('../../config/prisma')
const {
  getBlockRelationshipService
} = require('../users/users.service')
const {
  getFollowStatusService
} = require('../follows/follow.service')
const {
  deleteUploadedFileService
} = require('../uploads/upload.service')

const safeUserSelect = {
  id: true,
  name: true,
  username: true,
  bio: true,
  profileImage: true,
  coverImage: true,
  isPrivate: true,
  createdAt: true
}

async function canMessageUser(
  senderId,
  receiverId
) {

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: {
      id: true,
      isPrivate: true
    }
  })

  if (!receiver) {
    throw new Error('User not found')
  }

  const block = await getBlockRelationshipService(
    senderId,
    receiverId
  )

  if (block) {
    throw new Error('Unable to message this user')
  }

  if (receiver.isPrivate) {
    const follow = await getFollowStatusService(
      senderId,
      receiverId
    )

    if (!follow || follow.status !== 'Accepted') {
      throw new Error(
        'You must follow this private account before messaging'
      )
    }
  }

  return receiver
}

async function createPrivateChat(senderId, recieverId) {

  if (!recieverId || senderId === recieverId) {
    throw new Error('Unauthorized action')
  }

  await canMessageUser(senderId, recieverId)

  const chats = await prisma.conversation.findMany({
    where: {
      type: 'Private',
      conversation: {
        some: {
          userId: senderId
        }
      }
    },
    include: {
      conversation: true
    }
  })

  const existing = chats.find(chat => {
    const members = chat.conversation.map(
      member => member.userId
    )
    return (
      members.length === 2 &&
      members.includes(senderId) &&
      members.includes(recieverId)
    )
  })

  if (existing) {
    await prisma.conversationMember.updateMany({
      where: {
        conversationId: existing.id,
        userId: {
          in: [senderId, recieverId]
        }
      },
      data: {
        deletedAt: null,
        leftAt: null,
        removedAt: null
      }
    })

    return getSingleChat(senderId, existing.id)
  }

  const conversation = await prisma.$transaction(
    async trx => {
      const newConversation =
        await trx.conversation.create({
          data: {
            type: 'Private'
          }
        })

      await trx.conversationMember.createMany({
        data: [
          {
            userId: senderId,
            conversationId: newConversation.id
          },
          {
            userId: recieverId,
            conversationId: newConversation.id
          }
        ]
      })

      return newConversation
    }
  )

  return getSingleChat(senderId, conversation.id)
}

async function createGroupChat(
  senderId,
  name,
  members
) {

  if (!name || !name.trim()) {
    throw new Error('Group Name Is Required')
  }

  const uniqueMembers = [...new Set(members || [])]

  if (!uniqueMembers.length) {
    throw new Error(
      'Group must contain at least one member'
    )
  }

  if (uniqueMembers.includes(senderId)) {
    throw new Error(
      'Creator cannot be added to members'
    )
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: uniqueMembers }
    },
    select: { id: true }
  })

  if (users.length !== uniqueMembers.length) {
    throw new Error('One or more users not found')
  }

  for (const memberId of uniqueMembers) {
    const block = await getBlockRelationshipService(
      senderId,
      memberId
    )
    if (block) {
      throw new Error(
        'Blocked users cannot be added to a group'
      )
    }
  }

  const group = await prisma.$transaction(
    async trx => {
      const newGroup = await trx.conversation.create({
        data: {
          type: 'Group',
          name: name.trim()
        }
      })

      await trx.conversationMember.createMany({
        data: [
          {
            userId: senderId,
            conversationId: newGroup.id,
            role: 'Admin'
          },
          ...uniqueMembers.map(memberId => ({
            userId: memberId,
            conversationId: newGroup.id,
            role: 'Member'
          }))
        ]
      })

      return newGroup
    }
  )

  return getSingleChat(senderId, group.id)
}

async function getUserChats(
  senderId,
  archived = false
) {

  return prisma.conversationMember.findMany({
    where: {
      userId: senderId,
      leftAt: null,
      removedAt: null,
      deletedAt: null,
      archivedAt: archived ? { not: null } : null
    },
    include: {
      conversation: {
        include: {
          conversation: {
            where: {
              leftAt: null,
              removedAt: null
            },
            include: {
              user: {
                select: safeUserSelect
              }
            }
          },
          message: {
            where: {
              deletedAt: null
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            select: {
              id: true,
              content: true,
              image: true,
              senderId: true,
              createdAt: true
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
}

async function getSingleChat(senderId, conversationId) {

  await validateConversationMember(
    senderId,
    conversationId
  )

  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      conversation: {
        where: {
          leftAt: null,
          removedAt: null
        },
        include: {
          user: {
            select: safeUserSelect
          }
        }
      }
    }
  })
}

async function validateConversationMember(
  userId,
  conversationId
) {

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  })

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const member = await prisma.conversationMember.findFirst({
    where: {
      userId,
      conversationId,
      leftAt: null,
      removedAt: null,
      deletedAt: null
    }
  })

  if (!member) {
    throw new Error('Unauthorized action')
  }

  return {
    conversation,
    member
  }
}

async function requireAdmin(senderId, conversationId) {

  const { conversation } =
    await validateConversationMember(
      senderId,
      conversationId
    )

  if (conversation.type !== 'Group') {
    throw new Error(
      'This action is only allowed for groups'
    )
  }

  const admin = await prisma.conversationMember.findFirst({
    where: {
      userId: senderId,
      conversationId,
      role: 'Admin',
      leftAt: null,
      removedAt: null
    }
  })

  if (!admin) {
    throw new Error('Only admins can perform this action')
  }

  return conversation
}

async function updateGroup(
  senderId,
  conversationId,
  name,
  image
) {

  const conversation = await requireAdmin(
    senderId,
    conversationId
  )

  if (name === undefined && image === undefined) {
    throw new Error('Group name or image is required')
  }

  if (name !== undefined && !name.trim()) {
    throw new Error('Group name cannot be empty')
  }

  const group = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      name: name?.trim(),
      image
    }
  })

  if (
    image !== undefined &&
    conversation.image &&
    conversation.image !== image
  ) {
    await deleteUploadedFileService(
      conversation.image
    )
  }

  return group
}
async function addMembers(
  senderId,
  conversationId,
  members
) {

  await requireAdmin(
    senderId,
    conversationId
  )

  const uniqueMembers =
    [...new Set(members ?? [])]

  if (!uniqueMembers.length) {
    throw new Error('Members are required')
  }

  if (uniqueMembers.includes(senderId)) {
    throw new Error('Creator cannot be added')
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueMembers
      }
    },
    select: {
      id: true
    }
  })

  if (users.length !== uniqueMembers.length) {
    throw new Error(
      'One or more users not found'
    )
  }

  await prisma.$transaction(async trx => {

    await Promise.all(
      uniqueMembers.map(async memberId => {

        const block =
          await getBlockRelationshipService(
            senderId,
            memberId
          )

        if (block) {
          throw new Error(
            'Blocked users cannot be added to a group'
          )
        }

        await trx.conversationMember.upsert({
          where: {
            userId_conversationId: {
              userId: memberId,
              conversationId
            }
          },
          update: {
            leftAt: null,
            removedAt: null,
            deletedAt: null,
            role: 'Member',
            joinedAt: new Date()
          },
          create: {
            userId: memberId,
            conversationId,
            role: 'Member'
          }
        })

      })
    )

  })

  return {
    message: 'Members added successfully'
  }
}

async function removeMember(
  senderId,
  conversationId,
  memberId
) {

  await requireAdmin(senderId, conversationId)

  if (senderId === memberId) {
    throw new Error('Use leaveGroup instead')
  }

  const member = await prisma.conversationMember.findFirst({
    where: {
      userId: memberId,
      conversationId,
      leftAt: null,
      removedAt: null
    }
  })

  if (!member) {
    throw new Error('Member not found')
  }

  await prisma.conversationMember.update({
    where: { id: member.id },
    data: { removedAt: new Date() }
  })

  return {
    message: 'Member removed successfully'
  }
}

async function leaveGroup(senderId, conversationId) {

  const { conversation, member } =
    await validateConversationMember(
      senderId,
      conversationId
    )

  if (conversation.type !== 'Group') {
    throw new Error('You cannot leave a private chat')
  }

  await prisma.$transaction(async trx => {
    if (member.role === 'Admin') {
      const admins =
        await trx.conversationMember.count({
          where: {
            conversationId,
            role: 'Admin',
            leftAt: null,
            removedAt: null
          }
        })

      if (admins === 1) {
        const newAdmin =
          await trx.conversationMember.findFirst({
            where: {
              conversationId,
              userId: { not: senderId },
              leftAt: null,
              removedAt: null
            }
          })

        if (newAdmin) {
          await trx.conversationMember.update({
            where: { id: newAdmin.id },
            data: { role: 'Admin' }
          })
        }
      }
    }

    await trx.conversationMember.update({
      where: { id: member.id },
      data: { leftAt: new Date() }
    })
  })

  return {
    message: 'You left the group successfully'
  }
}

async function updateMemberRole(
  senderId,
  conversationId,
  memberId,
  role
) {

  await requireAdmin(senderId, conversationId)

  if (!['Admin', 'Member'].includes(role)) {
    throw new Error('Invalid role')
  }

  const member = await prisma.conversationMember.findFirst({
    where: {
      userId: memberId,
      conversationId,
      leftAt: null,
      removedAt: null
    }
  })

  if (!member) {
    throw new Error('Member not found')
  }

  if (role === 'Member' && member.role === 'Admin') {
    const adminCount =
      await prisma.conversationMember.count({
        where: {
          conversationId,
          role: 'Admin',
          leftAt: null,
          removedAt: null
        }
      })

    if (adminCount === 1) {
      throw new Error('A group must have an admin')
    }
  }

  return prisma.conversationMember.update({
    where: { id: member.id },
    data: { role }
  })
}

async function deleteConversation(senderId, conversationId) {

  const { member } = await validateConversationMember(
    senderId,
    conversationId
  )

  const now = new Date()

  await prisma.conversationMember.update({
    where: {
      id: member.id
    },
    data: {
      deletedAt: now,
      messagesClearedAt: now
    }
  })

  return {
    message: 'Conversation deleted successfully'
  }
}

async function muteConversation(
  senderId,
  conversationId,
  mutedUntil
) {

  const { member } = await validateConversationMember(
    senderId,
    conversationId
  )

  const date = mutedUntil
    ? new Date(mutedUntil)
    : null

  if (date && Number.isNaN(date.getTime())) {
    throw new Error('Invalid mute date')
  }

  return prisma.conversationMember.update({
    where: { id: member.id },
    data: { mutedUntil: date }
  })
}

async function archiveConversation(
  senderId,
  conversationId,
  archived
) {

  const { member } = await validateConversationMember(
    senderId,
    conversationId
  )

  return prisma.conversationMember.update({
    where: { id: member.id },
    data: {
      archivedAt: archived ? new Date() : null
    }
  })
}
async function unarchiveConversation(
  senderId,
  conversationId
) {

  const { member } =
    await validateConversationMember(
      senderId,
      conversationId
    )

  await prisma.conversationMember.update({
    where: {
      id: member.id
    },
    data: {
      archivedAt: null
    }
  })

  return {
    message: 'Conversation unarchived successfully'
  }
}
async function searchChats(senderId, query) {

  if (!query || !query.trim()) {
    return []
  }

  const chats = await getUserChats(senderId, false)
  const search = query.trim().toLowerCase()

  return chats.filter(item => {
    const conversation = item.conversation
    if (conversation.name?.toLowerCase().includes(search)) {
      return true
    }
    return conversation.conversation.some(member =>
      member.user.id !== senderId &&
      (
        member.user.name.toLowerCase().includes(search) ||
        member.user.username.toLowerCase().includes(search)
      )
    )
  })
}

module.exports = {
  createPrivateChat,
  createGroupChat,
  getUserChats,
  getSingleChat,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
  updateMemberRole,
  deleteConversation,
  muteConversation,
  archiveConversation,
  searchChats,
  validateConversationMember,
  canMessageUser,unarchiveConversation
}
