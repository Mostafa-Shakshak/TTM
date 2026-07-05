const router = require('express').Router()

const {
  getUserProfile,
  getUserPosts,
  searchUsers,
  updateProfile,
  blockUser,
  unblockUser
} = require('./users.controller')

const authMiddleware =
  require('../../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/search', searchUsers)
router.patch('/profile', updateProfile)

router.post('/:id/block', blockUser)
router.delete('/:id/block', unblockUser)

router.get('/:id/posts', getUserPosts)
router.get('/:id', getUserProfile)

module.exports = router
