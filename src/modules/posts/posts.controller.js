const {
  createPostService,
  sharePostService,
  updatePostService,
  deletePostService,
  getAllPostsService,
  getSinglePostService,
  searchPostsService
} = require('./posts.service')
const {
  emitNotification
} = require('../Notifications/notification.socket')

async function createPost(req, res) {
  try {
    const post = await createPostService(
      req.body,
      req.user.id
    )

    return res.status(201).json({
      message: 'Post created successfully',
      post
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function sharePost(req, res) {
  try {
    const result = await sharePostService(
      req.params.id,
      req.user.id,
      req.body.content
    )

    emitNotification(
      req.app.get('io'),
      result.notification
    )

    return res.status(201).json({
      message: 'Post shared successfully',
      post: result.post
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function updatePost(req, res) {
  try {
    const updatedPost = await updatePostService(
      req.params.id,
      req.user.id,
      req.body
    )

    return res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function deletePost(req, res) {
  try {
    const result = await deletePostService(
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

async function getAllPosts(req, res) {
  try {
    const posts = await getAllPostsService(
      req.user.id
    )

    return res.status(200).json({
      posts
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function getSinglePost(req, res) {
  try {
    const post = await getSinglePostService(
      req.params.id,
      req.user.id
    )

    return res.status(200).json({
      post
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function searchPosts(req, res) {
  try {
    const posts = await searchPostsService(
      req.query.q,
      req.user.id
    )

    return res.status(200).json({
      posts
    })
  } catch (err) {
    return res.status(400).json({
      message: 'Unable to search posts'
    })
  }
}

module.exports = {
  createPost,
  sharePost,
  updatePost,
  deletePost,
  getAllPosts,
  getSinglePost,
  searchPosts
}
