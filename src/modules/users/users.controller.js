const {
  getUserProfileService,
  getUserPostsService,
  searchUsersService,
  updateProfileService,
  blockUserService,
  unblockUserService,
  getBlockedUsersService
} = require('./users.service')

async function getUserProfile(req, res) {
  try {
    const user = await getUserProfileService(
      req.params.id,
      req.user.id
    )
    return res.status(200).json({ user })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function getUserPosts(req, res) {
  try {
    const posts = await getUserPostsService(
      req.params.id,
      req.user.id
    )
    return res.status(200).json({ posts })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function searchUsers(req, res) {
  try {
    const users = await searchUsersService(
      req.query.q,
      req.user.id
    )
    return res.status(200).json({ users })
  } catch (err) {
    return res.status(400).json({
      message: 'Unable to search users'
    })
  }
}

async function updateProfile(req, res) {
  try {
    const user = await updateProfileService(
      req.user.id,
      req.body
    )
    return res.status(200).json({
      message: 'Profile updated successfully',
      user
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function getBlockedUsers(req, res) {
  try {
    const blocks = await getBlockedUsersService(
      req.user.id
    )

    return res.status(200).json({
      blockedUsers: blocks
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function blockUser(req, res) {
  try {
    const block = await blockUserService(
      req.user.id,
      req.params.id
    )
    return res.status(201).json({
      message: 'User blocked successfully',
      block
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function unblockUser(req, res) {
  try {
    const result = await unblockUserService(
      req.user.id,
      req.params.id
    )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

module.exports = {
  getUserProfile,
  getUserPosts,
  searchUsers,
  updateProfile,
  getBlockedUsers,
  blockUser,
  unblockUser
}
