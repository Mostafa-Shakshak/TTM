const router = require('express').Router()

const {
  createPrivateChatController,
  createGroupChatController,
  getUserChatsController,
  getSingleChatController,
  updateGroupController,
  addMembersController,
  removeMemberController,
  leaveGroupController,
  promoteMemberController,
  demoteMemberController,
  deleteConversationController,
  muteConversationController,
  archiveConversationController,
  unarchiveConversationController,
  searchChatsController
} = require('./chat.controller')

const verifyToken =
  require('../../middlewares/auth.middleware')

router.use(verifyToken)

router.post('/private', createPrivateChatController)
router.post('/group', createGroupChatController)
router.get('/search', searchChatsController)
router.get('/', getUserChatsController)
router.get('/:conversationId', getSingleChatController)
router.patch('/:conversationId', updateGroupController)
router.delete('/:conversationId', deleteConversationController)

router.post(
  '/:conversationId/members',
  addMembersController
)
router.patch(
  '/:conversationId/remove',
  removeMemberController
)
router.patch(
  '/:conversationId/leave',
  leaveGroupController
)
router.patch(
  '/:conversationId/promote',
  promoteMemberController
)
router.patch(
  '/:conversationId/demote',
  demoteMemberController
)
router.patch(
  '/:conversationId/mute',
  muteConversationController
)
router.patch(
  '/:conversationId/archive',
  archiveConversationController
)
router.patch(
  '/:conversationId/unarchive',
  unarchiveConversationController
)

module.exports = router
