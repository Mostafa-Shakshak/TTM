const {
  followUserService,
  acceptFollowRequestService,
  rejectFollowRequestService,
  unfollowUserService,
  getFollowRequestsService,
  getFollowStatusService
} = require('./follow.service')
const {
  emitNotification
} = require('../Notifications/notification.socket')

async function followUser(req, res) {
  try {

    const result = await followUserService(
      req.params.userId,
      req.user.id
    )

    emitNotification(
      req.app.get('io'),
      result.notification
    )

    return res.status(201).json({
      message: 'Follow request sent successfully',
      follow: result.follow
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function acceptFollowRequest(req, res) {
  try {

    const result = await acceptFollowRequestService(
      req.params.followId,
      req.user.id
    )

    emitNotification(
      req.app.get('io'),
      result.notification
    )

    return res.status(200).json({
      message: 'Follow request accepted',
      follow: result.follow
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function rejectFollowRequest(req, res) {
  try {

    const follow = await rejectFollowRequestService(
      req.params.followId,
      req.user.id
    )

    return res.status(200).json({
      message: 'Follow request rejected',
      follow
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function unfollowUser(req, res) {
  try {

    const result = await unfollowUserService(
      req.params.followId,
      req.user.id
    )

    return res.status(200).json(result)

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function getFollowRequests(req, res) {
  try {

    const requests = await getFollowRequestsService(
      req.user.id
    )

    return res.status(200).json({
      requests
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function getFollowStatus(req, res) {
  try {

    const follow = await getFollowStatusService(
      req.user.id,
      req.params.userId
    )

    return res.status(200).json({
      follow
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

module.exports = {
  followUser,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,
  getFollowRequests,
  getFollowStatus
}
