const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

const chatSocket = require('./chat')
const presenceSocket = require('./presence')
const usersSocket = require('./users')
const {
  notificationSocket
} = require('./notification')

function initializeSocket(server) {

  const io = new Server(server, {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        'http://localhost:5173',
      credentials: true
    }
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Unauthorized'))
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_SECRET
      )

      if (
        decoded.type !== 'access' ||
        !decoded.sessionId
      ) {
        return next(new Error('Invalid Token'))
      }

      const session = await prisma.authSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.id,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        select: { id: true }
      })

      if (!session) {
        return next(new Error('Invalid Token'))
      }

      socket.user = decoded
      next()

    } catch (error) {
      return next(new Error('Invalid Token'))
    }
  })

  io.on('connection', socket => {
    usersSocket(io, socket)
    chatSocket(io, socket)
    presenceSocket(io, socket)
    notificationSocket(io, socket)
  })

  return io
}

module.exports = initializeSocket
