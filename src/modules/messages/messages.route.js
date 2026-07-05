const router = require('express').Router()

const {
  sendMessagesController,
  getMessagesController,
  searchMessagesController,
  editMessageController,
  deleteMessageController
} = require('./messages.controller')

const verifyToken =
  require('../../middlewares/auth.middleware.js')

router.use(verifyToken)

router.get('/search', searchMessagesController)
router.post('/:conversationId', sendMessagesController)
router.get('/:conversationId', getMessagesController)
router.patch('/:messageId', editMessageController)
router.delete('/:messageId', deleteMessageController)

module.exports = router
