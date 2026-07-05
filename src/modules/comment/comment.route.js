const router = require('express').Router()
const{createComment,
  updateComment,
  deleteComment} = require('./comment.controller')

  const authMiddleware= require('../../middlewares/auth.middleware.js')

  router.post('/',authMiddleware,createComment)
  router.patch('/:id',authMiddleware,updateComment)
  router.delete('/:id',authMiddleware,deleteComment) 

      module.exports = router