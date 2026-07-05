const {
  getNotificationsService,
  getUnreadCountService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
} = require('./notification.service')

async function getNotifications(req, res) {
  try {
    const result = await getNotificationsService(
      req.user.id,
      req.query.page,
      req.query.limit
    )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({
      message: 'Unable to load notifications'
    })
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await getUnreadCountService(
      req.user.id
    )
    return res.status(200).json({ count })
  } catch (err) {
    return res.status(400).json({
      message: 'Unable to load unread count'
    })
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const notification =
      await markNotificationAsReadService(
        req.params.id,
        req.user.id
      )
    return res.status(200).json({ notification })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function markAllNotificationsAsRead(req, res) {
  try {
    const result =
      await markAllNotificationsAsReadService(
        req.user.id
      )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({
      message: 'Unable to update notifications'
    })
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
}
