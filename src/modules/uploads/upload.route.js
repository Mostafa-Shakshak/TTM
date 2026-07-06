const router = require('express').Router()

const {
  uploadImage
} = require('./upload.controller')

const authMiddleware =
  require('../../middlewares/auth.middleware')

const uploadMiddleware =
  require('./upload.middleware')

router.post(
  '/:type',
  authMiddleware,
  uploadMiddleware,
  uploadImage
)

module.exports = router
