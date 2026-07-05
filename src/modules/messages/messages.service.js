const prisma = require('../../config/prisma')
const {
  createPrivateChat,
  validateConversationMember,
  canMessageUser
} = require('../chat/chat.service')
const {
  deleteUploadedFileService
} = require('../uploads/upload.service')

const senderSelect = {
  id: true,
  name: true,
  username: true,
  profileImage: true
}

async function enforcePrivateMessageRules(
  senderId,
  conversationId
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      conversation: {
        where: { leftAt: null, removedAt: null }
      }
    }
  })

  if (conversation?.type !== 'Private') return

  const receiver = conversation.conversation.find(
    member => member.userId !== senderId
  )

  if (!receiver) throw new Error('Receiver not found')

  await canMessageUser(senderId, receiver.userId)
}
async function sendMessages(
  senderId,
  content,
  conversationId,
  receiverId,
  replyToId,
  image
) {
  if (!content?.trim() && !image) {
    throw new Error('Message cannot be empty')
  }

  if (conversationId) {
    await validateConversationMember(senderId, conversationId)
    await enforcePrivateMessageRules(senderId, conversationId)
  } else {
    if (!receiverId) {
      throw new Error('Receiver is required')
    }

    const conversation = await createPrivateChat(
      senderId,
      receiverId
    )

    conversationId = conversation.id
  }

  if (replyToId) {
    const replyMessage = await prisma.mesaage.findFirst({
      where: {
        id: replyToId,
        convId: conversationId,
        deletedAt: null
      }
    })

    if (!replyMessage) {
      throw new Error('Reply message not found')
    }
  }

  const message = await prisma.$transaction(async trx => {

    const newMessage = await trx.mesaage.create({
      data: {
        content: content?.trim() || null,
        image: image || null,
        senderId,
        convId: conversationId,
        replyToId
      }
    })

    // Show the conversation again for users who previously deleted it.
    // Do NOT reset messagesClearedAt so old messages remain hidden.
    await trx.conversationMember.updateMany({
      where: {
        conversationId,
        deletedAt: {
          not: null
        }
      },
      data: {
        deletedAt: null
      }
    })

    const members = await trx.conversationMember.findMany({
      where: {
        conversationId,
        leftAt: null,
        removedAt: null
      }
    })

    await trx.messageReciept.createMany({
      data: members.map(member => ({
        messageId: newMessage.id,
        userId: member.userId,
        status: member.userId === senderId ? 'Seen' : 'Sent',
        seenAt: member.userId === senderId ? new Date() : null
      }))
    })

    return newMessage
  })

  return getMessageById(message.id)
}

function getMessageById(messageId) {
  return prisma.mesaage.findUnique({
    where: { id: messageId },
    include: {
      sender: { select: senderSelect },
      replyTo: {
        select: {
          id: true,
          content: true,
          image: true,
          senderId: true
        }
      },
      reciept: true
    }
  })
}

async function getMessages(senderId, conversationId) {

  const { member } =
    await validateConversationMember(
      senderId,
      conversationId
    )

  const where = {
    convId: conversationId,
    deletedAt: null
  }

  if (member.messagesClearedAt) {
    where.createdAt = {
      gt: member.messagesClearedAt
    }
  }

  return prisma.mesaage.findMany({
    where,
    include: {
      sender: {
        select: senderSelect
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          image: true,
          senderId: true
        }
      },
      reciept: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
}

async function searchMessages(senderId, query) {
  if (!query || !query.trim()) return []

  return prisma.mesaage.findMany({
    where: {
      content: { contains: query.trim(), mode: 'insensitive' },
      deletedAt: null,
      conversation: {
        conversation: {
          some: {
            userId: senderId,
            leftAt: null,
            removedAt: null,
            deletedAt: null
          }
        }
      }
    },
    include: {
      sender: { select: senderSelect },
      conversation: {
        select: { id: true, type: true, name: true, image: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
}

async function editMessage(senderId, messageId, content) {
  if (!content || !content.trim()) {
    throw new Error('Message cannot be empty')
  }

  const message = await prisma.mesaage.findUnique({
    where: { id: messageId }
  })

  if (!message) throw new Error('Message not found')
  if (message.deletedAt) throw new Error('Message has been deleted')
  if (message.senderId !== senderId) throw new Error('Unauthorized action')

  await prisma.mesaage.update({
    where: { id: messageId },
    data: { content: content.trim(), editedAt: new Date() }
  })

  return getMessageById(messageId)
}

async function deleteMessage(senderId, messageId) {
  const message = await prisma.mesaage.findUnique({
    where: { id: messageId }
  })

  if (!message) throw new Error('Message not found')
  if (message.deletedAt) throw new Error('Message already deleted')
  if (message.senderId !== senderId) throw new Error('Unauthorized action')

  const deletedMessage = await prisma.mesaage.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
      content: null,
      image: null,
      attachment: null
    }
  })

  await deleteUploadedFileService(message.image)
  return deletedMessage
}

async function deliveredMessage(userId, messageId) {
  const receipt = await prisma.messageReciept.findFirst({
    where: { userId, messageId },
    include: { message: { select: { convId: true } } }
  })

  if (!receipt) throw new Error('Receipt not found')
  if (receipt.status === 'Seen') return receipt

  return prisma.messageReciept.update({
    where: { id: receipt.id },
    data: {
      status: 'Delivered',
      deliveredAt: receipt.deliveredAt || new Date()
    },
    include: { message: { select: { convId: true } } }
  })
}

async function seenMessage(userId, messageId) {
  const receipt = await prisma.messageReciept.findFirst({
    where: { userId, messageId },
    include: { message: { select: { convId: true } } }
  })

  if (!receipt) throw new Error('Receipt not found')
  if (receipt.status === 'Seen') return receipt

  return prisma.messageReciept.update({
    where: { id: receipt.id },
    data: {
      status: 'Seen',
      deliveredAt: receipt.deliveredAt || new Date(),
      seenAt: new Date()
    },
    include: { message: { select: { convId: true } } }
  })
}

module.exports = {
  sendMessages,
  getMessages,
  searchMessages,
  editMessage,
  deleteMessage,
  deliveredMessage,
  seenMessage
}
