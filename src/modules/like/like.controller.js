const {
  createLikeService,
  deleteLikeService
} = require('./like.service')
const {
  emitNotification
} = require('../Notifications/notification.socket')

async function createLike(req, res) {
  try {

    const result = await createLikeService(
      req.body.postId,
      req.user.id
    )

    emitNotification(
      req.app.get('io'),
      result.notification
    )

    return res.status(201).json({
      message: 'Post liked successfully',
      like: result.like
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function deleteLike(req, res) {
  try {

    const result = await deleteLikeService(
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
  createLike,
  deleteLike
}
