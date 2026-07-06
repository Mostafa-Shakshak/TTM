const router = require('express').Router()

const {
  followUser,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,getFollowRequests,getFollowStatus,
  getFollowers,
  getFollowing,
  getFollowCounts,
  removeFollower,
  removeFollowing
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
router.get(
  '/:userId/followers',
  authMiddleware,
  getFollowers
)
router.get(
  '/:userId/following',
  authMiddleware,
  getFollowing
)
router.get(
  '/:userId/counts',
  authMiddleware,
  getFollowCounts
)
router.delete(
  '/followers/:followerUserId',
  authMiddleware,
  removeFollower
)
router.delete(
  '/following/:followingUserId',
  authMiddleware,
  removeFollowing
)

module.exports = router
