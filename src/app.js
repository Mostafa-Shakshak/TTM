const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./modules/auth/auth.routes')
const postRoutes = require('./modules/posts/posts.route')
const commentRoutes = require('./modules/comment/comment.route')
const likeRoutes = require('./modules/like/like.route')
const followRoutes = require('./modules/follows/follow.route')
const userRoutes = require('./modules/users/users.route')
const chatRoutes = require('./modules/chat/chat.route')
const messageRoutes = require('./modules/messages/messages.route')
const notificationRoutes =
  require('./modules/Notifications/notification.route')
const uploadRoutes =
  require('./modules/uploads/upload.route')

const app = express()

app.use(cors({
  origin:
    process.env.CLIENT_URL ||
    'http://localhost:5173',
  credentials: true
}))

app.use(express.json({ limit: '1mb' }))

app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'))
)

app.use('/auth', authRoutes)
app.use('/posts', postRoutes)
app.use('/comments', commentRoutes)
app.use('/likes', likeRoutes)
app.use('/follow', followRoutes)
app.use('/users', userRoutes)
app.use('/chat', chatRoutes)
app.use('/messages', messageRoutes)
app.use('/notifications', notificationRoutes)
app.use('/uploads', uploadRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  return res.status(500).json({
    message: 'Internal server error'
  })
})

module.exports = app
