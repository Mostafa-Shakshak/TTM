const prisma = require('../../config/prisma')
const {
  getBlockRelationshipService
} = require('../users/users.service')
const {
  createNotificationService,
  deleteNotificationService
} = require('../Notifications/notification.service')

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
    throw new Error('Follow request already exists')
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
module.exports = {
  followUserService,
  acceptFollowRequestService,
  rejectFollowRequestService,
  unfollowUserService,getFollowRequestsService,
  getFollowStatusService

}
