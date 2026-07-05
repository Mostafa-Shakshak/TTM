const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

const ACCESS_SECRET = process.env.ACCESS_SECRET

async function authMiddleware(req, res, next) {

  try {

    const authHeader = req.headers.authorization

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        message: 'Token is required'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      ACCESS_SECRET
    )

    if (
      decoded.type !== 'access' ||
      !decoded.sessionId
    ) {
      return res.status(401).json({
        message: 'Invalid token'
      })
    }

    const session = await prisma.authSession.findFirst({
      where: {
        id: decoded.sessionId,
        userId: decoded.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true
      }
    })

    if (!session) {
      return res.status(401).json({
        message: 'Invalid token'
      })
    }

    req.user = decoded
    next()

  } catch (err) {

    return res.status(401).json({
      message: 'Invalid token'
    })

  }
}

module.exports = authMiddleware
