const router = require('express').Router()

const {
  createPost,
  sharePost,
  updatePost,
  deletePost,
  getAllPosts,
  getSinglePost,
  searchPosts
} = require('./posts.controller')

const authMiddleware= require('../../middlewares/auth.middleware.js')


    router.post (
        '/',authMiddleware,createPost
    )

    router.post(
        '/:id/share',authMiddleware,sharePost
    )

    router.patch (
        '/:id',authMiddleware,updatePost
    )

    router.delete (
        '/:id',authMiddleware,deletePost
    )
 router.get(
  '/',
  authMiddleware,
  getAllPosts
)
router.get(
  '/search',
  authMiddleware,
  searchPosts
)
router.get(
  '/:id',
  authMiddleware,
  getSinglePost
)

    module.exports = router
