const prisma = require('../../config/prisma')
const {
  getAccessiblePostService
} = require('../posts/posts.service')
const {
  createNotificationService,
  deleteNotificationService
} = require('../Notifications/notification.service')

async function createLikeService(postId, userId) {

  const post = await getAccessiblePostService(
    postId,
    userId
  )

  const existingLike = await prisma.like.findUnique({
    where: {
      likedById_likedPostedId: {
        likedById: userId,
        likedPostedId: postId
      }
    }
  })

  if (existingLike) {
    throw new Error('Post already liked')
  }

  const like = await prisma.like.create({
    data: {
      likedById: userId,
      likedPostedId: postId
    }
  })

  const notification =
    await createNotificationService({
      type: 'Like',
      recipientId: post.authorId,
      actorId: userId,
      postId
    })

  return {
    like,
    notification
  }
}

async function deleteLikeService(likeId, userId) {

  const like = await prisma.like.findUnique({
    where: {
      id: likeId
    }
  })

  if (!like) {
    throw new Error('Like Not Found')
  }

  if (like.likedById !== userId) {
    throw new Error('Unauthorized Action')
  }

  await prisma.like.delete({
    where: {
      id: likeId
    }
  })

  await deleteNotificationService({
    type: 'Like',
    actorId: userId,
    postId: like.likedPostedId
  })

  return {
    message: 'Like removed successfully'
  }
}

module.exports = {
  createLikeService,
  deleteLikeService
}
