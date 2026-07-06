const {
  followUserService,
  acceptFollowRequestService,
  rejectFollowRequestService,
  unfollowUserService,
  getFollowRequestsService,
  getFollowStatusService,
  getFollowersService,
  getFollowingService,
  getFollowCountsService,
  removeFollowerService,
  removeFollowingService
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

    if (result.notification) {
      emitNotification(
        req.app.get('io'),
        result.notification
      )
    }

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

async function getFollowers(req, res) {
  try {

    const followers = await getFollowersService(
      req.params.userId,
      req.user.id
    )

    return res.status(200).json({
      followers
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function getFollowing(req, res) {
  try {

    const following = await getFollowingService(
      req.params.userId,
      req.user.id
    )

    return res.status(200).json({
      following
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function getFollowCounts(req, res) {
  try {

    const counts = await getFollowCountsService(
      req.params.userId
    )

    return res.status(200).json({
      counts
    })

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function removeFollower(req, res) {
  try {

    const result = await removeFollowerService(
      req.user.id,
      req.params.followerUserId
    )

    return res.status(200).json(result)

  } catch (err) {

    return res.status(400).json({
      message: err.message
    })

  }
}

async function removeFollowing(req, res) {
  try {

    const result = await removeFollowingService(
      req.user.id,
      req.params.followingUserId
    )

    return res.status(200).json(result)

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
  getFollowStatus,
  getFollowers,
  getFollowing,
  getFollowCounts,
  removeFollower,
  removeFollowing
}
