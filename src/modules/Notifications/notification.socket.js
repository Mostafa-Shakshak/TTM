const {
  getUnreadCountService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
} = require('./notification.service')

const {
  getUserRoom
} = require('../../socket/rooms')

function emitNotification(io, notification) {

  if (!notification) {
    return
  }

  io.to(
    getUserRoom(notification.recipientId)
  ).emit('notification:new', notification)
}

function notificationSocket(io, socket) {

  socket.on(
    'notification:getUnreadCount',
    async () => {
      try {
        const count = await getUnreadCountService(
          socket.user.id
        )
        socket.emit('notification:unreadCount', {
          count
        })
      } catch (err) {
        socket.emit('error', {
          message: 'Unable to load unread count'
        })
      }
    }
  )

  socket.on(
    'notification:markRead',
    async notificationId => {
      try {
        const notification =
          await markNotificationAsReadService(
            notificationId,
            socket.user.id
          )
        socket.emit(
          'notification:updated',
          notification
        )
      } catch (err) {
        socket.emit('error', {
          message: err.message
        })
      }
    }
  )

  socket.on(
    'notification:markAllRead',
    async () => {
      try {
        await markAllNotificationsAsReadService(
          socket.user.id
        )
        socket.emit('notification:allRead')
      } catch (err) {
        socket.emit('error', {
          message: 'Unable to update notifications'
        })
      }
    }
  )
}

module.exports = {
  notificationSocket,
  emitNotification
}
