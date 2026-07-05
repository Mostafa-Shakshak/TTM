const prisma = require('../../config/prisma')
const {
  getAccessiblePostService
} = require('../posts/posts.service')
const {
  createNotificationService
} = require('../Notifications/notification.service')

async function createCommentService(data, userId) {

  const { content, image, postedId } = data

  if (!content && !image) {
    throw new Error("You can't create empty comment")
  }

  const post = await getAccessiblePostService(
    postedId,
    userId
  )

  const comment = await prisma.comment.create({
    data: {
      content,
      image,
      authorId: userId,
      postedId
    }
  })

  const notification =
    await createNotificationService({
      type: 'Comment',
      recipientId: post.authorId,
      actorId: userId,
      postId: postedId,
      commentId: comment.id
    })

  return {
    comment,
    notification
  }
}

async function updateCommentService(commentId, userId, data) {

  const { content, image } = data

  if (!content && !image) {
    throw new Error("You can't update comment to be empty")
  }

  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId
    }
  })

  if (!comment) {
    throw new Error('Comment Not Found')
  }

  if (comment.authorId !== userId) {
    throw new Error('Unauthorized Action')
  }

  const updatedComment = await prisma.comment.update({
    where: {
      id: commentId
    },
    data: {
      content,
      image
    }
  })

  return updatedComment
}

async function deleteCommentService(commentId, userId) {

  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId
    }
  })

  if (!comment) {
    throw new Error('Comment Not Found')
  }

  if (comment.authorId !== userId) {
    throw new Error('Unauthorized Action')
  }

  await prisma.comment.delete({
    where: {
      id: commentId
    }
  })

  return {
    message: 'Comment deleted successfully'
  }
}

module.exports = {
  createCommentService,
  updateCommentService,
  deleteCommentService
}
