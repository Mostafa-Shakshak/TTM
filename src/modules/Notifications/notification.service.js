const prisma = require('../../config/prisma')

const notificationInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true
    }
  },
  post: {
    select: {
      id: true,
      content: true,
      image: true
    }
  }
}

async function createNotificationService(data) {

  const {
    type,
    recipientId,
    actorId,
    postId,
    commentId,
    followId
  } = data

  if (recipientId === actorId) {
    return null
  }

  return prisma.notification.create({
    data: {
      type,
      recipientId,
      actorId,
      postId,
      commentId,
      followId
    },
    include: notificationInclude
  })
}

async function deleteNotificationService(where) {

  await prisma.notification.deleteMany({
    where
  })
}

async function getNotificationsService(
  userId,
  page = 1,
  limit = 20
) {

  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    50
  )

  const [notifications, total] =
    await prisma.$transaction([
      prisma.notification.findMany({
        where: {
          recipientId: userId
        },
        include: notificationInclude,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit
      }),
      prisma.notification.count({
        where: {
          recipientId: userId
        }
      })
    ])

  return {
    notifications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  }
}

async function getUnreadCountService(userId) {

  return prisma.notification.count({
    where: {
      recipientId: userId,
      isRead: false
    }
  })
}

async function markNotificationAsReadService(
  notificationId,
  userId
) {

  const notification =
    await prisma.notification.findUnique({
      where: {
        id: notificationId
      }
    })

  if (!notification) {
    throw new Error('Notification not found')
  }

  if (notification.recipientId !== userId) {
    throw new Error('Unauthorized action')
  }

  return prisma.notification.update({
    where: {
      id: notificationId
    },
    data: {
      isRead: true,
      readAt: notification.readAt || new Date()
    },
    include: notificationInclude
  })
}

async function markAllNotificationsAsReadService(
  userId
) {

  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })

  return {
    message: 'All notifications marked as read'
  }
}

module.exports = {
  createNotificationService,
  deleteNotificationService,
  getNotificationsService,
  getUnreadCountService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
}
