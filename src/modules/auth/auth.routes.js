const router = require('express').Router()
const { rateLimit } = require('express-rate-limit')

const {
  signup,
  login,
  refreshToken,
  logout,
  logoutAll,
  changePassword,
  requestPasswordReset,
  resetPassword
} = require('./auth.controller')

const authMiddleware =
  require('../../middlewares/auth.middleware')

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      'If an account exists for this email, a reset code has been sent'
  }
})

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many attempts. Please try again later'
  }
})

router.post('/signup', signup)
router.post('/login', login)
router.post('/refresh', refreshToken)

router.post(
  '/forgot-password',
  otpRequestLimiter,
  requestPasswordReset
)

router.post(
  '/reset-password',
  otpVerifyLimiter,
  resetPassword
)

router.post('/logout', authMiddleware, logout)
router.post('/logout-all', authMiddleware, logoutAll)

router.patch(
  '/change-password',
  authMiddleware,
  changePassword
)

module.exports = router
