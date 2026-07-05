const {
  signupService,
  loginService,
  refreshTokenService,
  logoutService,
  logoutAllService,
  changePasswordService,
  requestPasswordResetService,
  resetPasswordService
} = require('./auth.service')

async function signup(req, res) {
  try {
    const user = await signupService(req.body)
    return res.status(201).json({
      message: 'User created successfully',
      user
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message || 'Unable to create account'
    })
  }
}

async function login(req, res) {
  try {
    const tokens = await loginService(req.body)
    return res.status(200).json({
      message: 'Login successful',
      ...tokens
    })
  } catch (err) {
    return res.status(401).json({
      message: err.message || 'Invalid credentials'
    })
  }
}

async function refreshToken(req, res) {
  try {
    const tokens = await refreshTokenService(
      req.body.refreshToken
    )
    return res.status(200).json(tokens)
  } catch (err) {
    return res.status(401).json({
      message: err.message
    })
  }
}

async function logout(req, res) {
  try {
    const result = await logoutService(
      req.user.id,
      req.user.sessionId
    )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({
      message: 'Unable to log out'
    })
  }
}

async function logoutAll(req, res) {
  try {
    const result = await logoutAllService(
      req.user.id
    )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({
      message: 'Unable to log out from all devices'
    })
  }
}

async function changePassword(req, res) {
  try {
    const result = await changePasswordService(
      req.user.id,
      req.body
    )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

async function requestPasswordReset(req, res) {
  try {
    const result =
      await requestPasswordResetService(
        req.body.email
      )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(200).json({
      message:
        'If an account exists for this email, a reset code has been sent'
    })
  }
}

async function resetPassword(req, res) {
  try {
    const result = await resetPasswordService(
      req.body
    )
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({
      message: err.message
    })
  }
}

module.exports = {
  signup,
  login,
  refreshToken,
  logout,
  logoutAll,
  changePassword,
  requestPasswordReset,
  resetPassword
}
