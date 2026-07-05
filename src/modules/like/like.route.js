const router = require('express').Router()

const {
  createLike,
  deleteLike
} = require('./like.controller')

const authMiddleware =
require('../../middlewares/auth.middleware')

router.post(
  '/',
  authMiddleware,
  createLike
)

router.delete(
  '/:id',
  authMiddleware,
  deleteLike
)

module.exports = router