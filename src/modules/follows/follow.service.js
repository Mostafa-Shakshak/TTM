const prisma = require('../../config/prisma')
const {
  getBlockRelationshipService
} = require('../users/users.service')
const {
  createNotificationService,
  deleteNotificationService
} = require('../Notifications/notification.service')

const userListSelect = {
  id: true,
  name: true,
  username: true,
  profileImage: true,
  bio: true,
  isPrivate: true
}

async function getViewerRelationship(currentUserId, targetUserId) {
  if (!currentUserId || currentUserId === targetUserId) return null

  return prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    },
    select: {
      id: true,
      status: true,
      followerId: true,
      followingId: true,
      createdAt: true
    }
  })
}

async function formatFollowListItem(follow, listType, currentUserId) {
  const user = listType === 'followers'
    ? follow.follower
    : follow.following

  return {
    id: follow.id,
    status: follow.status,
    createdAt: follow.createdAt,
    user,
    viewerFollow: await getViewerRelationship(currentUserId, user.id)
  }
}

async function followUserService(targetUserId, currentUserId){

    if(targetUserId==currentUserId){
        throw new Error ('invalid action ')
    }
      const targetUser = await prisma.user.findUnique({
    where: {
      id: targetUserId
    }
  })

  if (!targetUser) {
    throw new Error('User Not Found')
  }

  const block = await getBlockRelationshipService(
    currentUserId,
    targetUserId
  )

  if (block) {
    throw new Error('Unable to follow this user')
  }

  const existingFollow = await prisma.follow.findUnique({
    where : {
        followerId_followingId  :{
            followerId : currentUserId,
            followingId : targetUserId
        }
    }
  })
  if (existingFollow) {
    if (existingFollow.status !== 'Rejected') {
      return {
        follow: existingFollow,
        notification: null
      }
    }

    const follow = await prisma.follow.update({
      where: {
        id: existingFollow.id
      },
      data: {
        status: targetUser.isPrivate
          ? 'Pending'
          : 'Accepted'
      }
    })

    const notification =
      await createNotificationService({
        type: targetUser.isPrivate
          ? 'FollowRequest'
          : 'FollowAccepted',
        recipientId: targetUserId,
        actorId: currentUserId,
        followId: follow.id
      })

    return {
      follow,
      notification
    }
  }
const follow = await prisma.follow.create({
    data: {
      followerId: currentUserId,
      followingId: targetUserId,

      status : targetUser.isPrivate 
      ? 'Pending'
      : 'Accepted'
    }
  })
  const notification =
    await createNotificationService({
      type: targetUser.isPrivate
        ? 'FollowRequest'
        : 'FollowAccepted',
      recipientId: targetUserId,
      actorId: currentUserId,
      followId: follow.id
    })

  return {
    follow,
    notification
  }
}
async function acceptFollowRequestService(
  followId,
  currentUserId
) {

  const follow = await prisma.follow.findUnique({
    where: {
      id: followId
    }
  })

  if (!follow) {
    throw new Error('Follow Request Not Found')
  }

  if (follow.followingId !== currentUserId) {
    throw new Error('Unauthorized Action')
  }

  const acceptedFollow =
    await prisma.follow.update({
      where: {
        id: followId
      },
      data: {
        status: 'Accepted'
      }
    })

  await deleteNotificationService({
    type: 'FollowRequest',
    followId
  })

  const notification =
    await createNotificationService({
      type: 'FollowAccepted',
      recipientId: follow.followerId,
      actorId: currentUserId,
      followId: acceptedFollow.id
    })

  return {
    follow: acceptedFollow,
    notification
  }
}
async function rejectFollowRequestService(
  followId,
  currentUserId
) {

  const follow = await prisma.follow.findUnique({
    where: {
      id: followId
    }
  })

  if (!follow) {
    throw new Error('Follow Request Not Found')
  }

  if (follow.followingId !== currentUserId) {
    throw new Error('Unauthorized Action')
  }

  const rejectedFollow =
    await prisma.follow.update({
      where: {
        id: followId
      },
      data: {
        status: 'Rejected'
      }
    })

  await deleteNotificationService({
    type: 'FollowRequest',
    followId
  })

  return rejectedFollow
}
async function unfollowUserService(
  followId,
  currentUserId
) {

  const follow = await prisma.follow.findUnique({
    where: {
      id: followId
    }
  })

  if (!follow) {
    throw new Error('Follow Not Found')
  }

  if (follow.followerId !== currentUserId) {
    throw new Error('Unauthorized Action')
  }

  await prisma.follow.delete({
    where: {
      id: followId
    }
  })

  await deleteNotificationService({
    followId
  })

  return {
    message: 'Unfollowed successfully'
  }
}
async function getFollowStatusService(
  currentUserId,
  targetUserId
) {

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    }
  })

  return follow
}
async function getFollowRequestsService(
  currentUserId
) {

  const requests = await prisma.follow.findMany({
    where: {
      followingId: currentUserId,
      status: 'Pending'
    },

    include: {
      follower: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true
        }
      }
    }
  })

  return requests
}

async function getFollowersService(
  userId,
  currentUserId
) {

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })

  if (!user) {
    throw new Error('User Not Found')
  }

  const followers = await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: 'Accepted',
      follower: {
        blockedUsers: {
          none: {
            blockedId: currentUserId
          }
        },
        blockedBy: {
          none: {
            blockerId: currentUserId
          }
        }
      }
    },
    include: {
      follower: {
        select: userListSelect
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return Promise.all(
    followers.map(follow =>
      formatFollowListItem(
        follow,
        'followers',
        currentUserId
      )
    )
  )
}

async function getFollowingService(
  userId,
  currentUserId
) {

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })

  if (!user) {
    throw new Error('User Not Found')
  }

  const following = await prisma.follow.findMany({
    where: {
      followerId: userId,
      status: 'Accepted',
      following: {
        blockedUsers: {
          none: {
            blockedId: currentUserId
          }
        },
        blockedBy: {
          none: {
            blockerId: currentUserId
          }
        }
      }
    },
    include: {
      following: {
        select: userListSelect
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return Promise.all(
    following.map(follow =>
      formatFollowListItem(
        follow,
        'following',
        currentUserId
      )
    )
  )
}

async function getFollowersCountService(userId) {
  return prisma.follow.count({
    where: {
      followingId: userId,
      status: 'Accepted'
    }
  })
}

async function getFollowingCountService(userId) {
  return prisma.follow.count({
    where: {
      followerId: userId,
      status: 'Accepted'
    }
  })
}

async function getFollowCountsService(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })

  if (!user) {
    throw new Error('User Not Found')
  }

  const [followers, following] = await Promise.all([
    getFollowersCountService(userId),
    getFollowingCountService(userId)
  ])

  return {
    followers,
    following
  }
}

async function isFollowingService(
  currentUserId,
  targetUserId
) {
  const follow = await getFollowStatusService(
    currentUserId,
    targetUserId
  )

  return Boolean(
    follow &&
    follow.status === 'Accepted'
  )
}

async function removeFollowerService(
  currentUserId,
  followerUserId
) {

  if (currentUserId === followerUserId) {
    throw new Error('Invalid action')
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: followerUserId,
        followingId: currentUserId
      }
    }
  })

  if (!follow || follow.status !== 'Accepted') {
    throw new Error('Follower not found')
  }

  await prisma.follow.delete({
    where: {
      id: follow.id
    }
  })

  await deleteNotificationService({
    followId: follow.id
  })

  return {
    message: 'Follower removed successfully'
  }
}

async function removeFollowingService(
  currentUserId,
  followingUserId
) {

  if (currentUserId === followingUserId) {
    throw new Error('Invalid action')
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: followingUserId
      }
    }
  })

  if (!follow) {
    throw new Error('Follow not found')
  }

  await prisma.follow.delete({
    where: {
      id: follow.id
    }
  })

  await deleteNotificationService({
    followId: follow.id
  })

  return {
    message: 'Unfollowed successfully'
  }
}
module.exports = {
  followUserService,
  acceptFollowRequestService,
  rejectFollowRequestService,
  unfollowUserService,getFollowRequestsService,
  getFollowStatusService,
  getFollowersService,
  getFollowingService,
  getFollowersCountService,
  getFollowingCountService,
  getFollowCountsService,
  isFollowingService,
  removeFollowerService,
  removeFollowingService

}
