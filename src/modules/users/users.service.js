const prisma = require('../../config/prisma')

async function getBlockRelationshipService(
  firstUserId,
  secondUserId
) {

  return prisma.block.findFirst({
    where: {
      OR: [
        {
          blockerId: firstUserId,
          blockedId: secondUserId
        },
        {
          blockerId: secondUserId,
          blockedId: firstUserId
        }
      ]
    }
  })
}

async function getUserProfileService(
  userId,
  currentUserId
) {

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      profileImage: true,
      coverImage: true,
      isPrivate: true,
      _count: {
        select: {
          post: true,
          followers: {
            where: {
              status: 'Accepted'
            }
          },
          following: {
            where: {
              status: 'Accepted'
            }
          }
        }
      }
    }
  })

  if (!user) {
    throw new Error('User Not Found')
  }

  if (userId === currentUserId) {
    return {
      ...user,
      blockedByMe: false,
      blockedMe: false
    }
  }

  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          blockerId: currentUserId,
          blockedId: userId
        },
        {
          blockerId: userId,
          blockedId: currentUserId
        }
      ]
    }
  })

  const blockedByMe = blocks.some(
    block => block.blockerId === currentUserId
  )

  const blockedMe = blocks.some(
    block => block.blockerId === userId
  )

  if (blockedMe) {
    throw new Error('User Not Found')
  }

  return {
    ...user,
    blockedByMe,
    blockedMe
  }
}

async function getUserPostsService(
  profileOwnerId,
  currentUserId
) {

  const profileOwner = await prisma.user.findUnique({
    where: {
      id: profileOwnerId
    }
  })

  if (!profileOwner) {
    throw new Error('User Not Found')
  }

  const block = await getBlockRelationshipService(
    profileOwnerId,
    currentUserId
  )

  if (block) {
    throw new Error('User Not Found')
  }

  if (
    profileOwner.id !== currentUserId &&
    profileOwner.isPrivate
  ) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: profileOwnerId
        }
      }
    })

    if (!follow || follow.status !== 'Accepted') {
      throw new Error('This account is private')
    }
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: profileOwnerId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true
        }
      },
      likes: {
        where: {
          likedById: currentUserId
        },
        select: {
          id: true
        }
      },
      _count: {
        select: {
          comments: true,
          likes: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return posts.map(post => ({
    ...post,
    likedByMe: post.likes.length > 0,
    likeId: post.likes[0]?.id || null
  }))
}

async function searchUsersService(
  query,
  currentUserId
) {

  if (!query || !query.trim()) {
    return []
  }

  return prisma.user.findMany({
    where: {
      id: {
        not: currentUserId
      },
      AND: [
        {
          OR: [
            {
              username: {
                contains: query.trim(),
                mode: 'insensitive'
              }
            },
            {
              name: {
                contains: query.trim(),
                mode: 'insensitive'
              }
            }
          ]
        },
        {
          blockedUsers: {
            none: {
              blockedId: currentUserId
            }
          }
        },
        {
          blockedBy: {
            none: {
              blockerId: currentUserId
            }
          }
        }
      ]
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      profileImage: true,
      isPrivate: true
    },
    take: 20
  })
}
async function updateProfileService(userId, data) {

  const {
    name,
    bio,
    profileImage,
    coverImage,
    isPrivate
  } = data

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Name is required')
  }

  const updateData = {
    name: name.trim(),

    bio:
      bio == null
        ? null
        : bio.trim(),

    isPrivate:
      typeof isPrivate === 'boolean'
        ? isPrivate
        : undefined
  }

  if (profileImage !== undefined) {
    updateData.profileImage = profileImage
  }

  if (coverImage !== undefined) {
    updateData.coverImage = coverImage
  }

  const user = await prisma.user.update({
    where: {
      id: userId
    },
    data: updateData,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      profileImage: true,
      coverImage: true,
      isPrivate: true
    }
  })

  return user
}

async function blockUserService(
  currentUserId,
  targetUserId
) {

  if (currentUserId === targetUserId) {
    throw new Error('Invalid action')
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true }
  })

  if (!targetUser) {
    throw new Error('User Not Found')
  }

  const block = await prisma.$transaction(async trx => {

    const createdBlock = await trx.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId
        }
      },
      update: {},
      create: {
        blockerId: currentUserId,
        blockedId: targetUserId
      }
    })

    await trx.follow.deleteMany({
      where: {
        OR: [
          {
            followerId: currentUserId,
            followingId: targetUserId
          },
          {
            followerId: targetUserId,
            followingId: currentUserId
          }
        ]
      }
    })

    return createdBlock
  })

  return block
}

async function unblockUserService(
  currentUserId,
  targetUserId
) {

  const result = await prisma.block.deleteMany({
    where: {
      blockerId: currentUserId,
      blockedId: targetUserId
    }
  })

  if (!result.count) {
    throw new Error('Block not found')
  }

  return {
    message: 'User unblocked successfully'
  }
}

module.exports = {
  getUserProfileService,
  getUserPostsService,
  searchUsersService,
  updateProfileService,
  blockUserService,
  unblockUserService,
  getBlockRelationshipService
}
