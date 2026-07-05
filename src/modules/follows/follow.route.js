const router = require('express').Router()

const {
  followUser,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,getFollowRequests,getFollowStatus
} = require('./follow.controller')

const authMiddleware =
  require('../../middlewares/auth.middleware')

router.post(
  '/:userId',
  authMiddleware,
  followUser
)

router.patch(
  '/:followId/accept',
  authMiddleware,
  acceptFollowRequest
)

router.patch(
  '/:followId/reject',
  authMiddleware,
  rejectFollowRequest
)
router.delete(
  '/:followId',
  authMiddleware,
  unfollowUser
)
router.get(
  '/status/:userId',
  authMiddleware,
  getFollowStatus
)
router.get(
  '/requests',
  authMiddleware,
  getFollowRequests
)

module.exports = router