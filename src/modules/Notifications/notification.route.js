const router = require('express').Router()

const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('./notification.controller')

const authMiddleware =
  require('../../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/read-all', markAllNotificationsAsRead)
router.patch('/:id/read', markNotificationAsRead)

module.exports = router
