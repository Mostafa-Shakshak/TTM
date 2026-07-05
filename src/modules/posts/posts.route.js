const router = require('express').Router()

const {
  createPost,
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
