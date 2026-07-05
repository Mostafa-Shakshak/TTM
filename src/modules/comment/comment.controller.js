const {createCommentService,
  updateCommentService,
  deleteCommentService} = require('./comment.service')
const {
  emitNotification
} = require('../Notifications/notification.socket')

async function createComment(req,res) {

    try{
        const result = await createCommentService(req.body,req.user.id)

        emitNotification(
          req.app.get('io'),
          result.notification
        )

        return res.status(201).json({
            message : "Comment created successfully",
            comment: result.comment
        })
    }

    catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}
async function updateComment(req, res) {
  try {

    const updatedComment = await updateCommentService(
      req.params.id,
      req.user.id,
      req.body
    )

    return res.status(200).json({
      message: 'Comment updated successfully',
      comment: updatedComment
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function deleteComment(req, res) {
  try {

    const result = await deleteCommentService(
      req.params.id,
      req.user.id
    )

    return res.status(200).json(result)

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

module.exports = {
  createComment,
  updateComment,
  deleteComment
}


