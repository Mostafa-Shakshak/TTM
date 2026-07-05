const nodemailer = require('nodemailer')
function getTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS
  } = process.env
  if ( !SMTP_HOST ||!SMTP_PORT ||!SMTP_USER ||!SMTP_PASS) {
    throw new Error('Email service is not configured')
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  })
}
async function sendPasswordResetEmail(
  email,
  name,
  otp
) {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your TTM password reset code',
    text: `Your TTM password reset code is ${otp}. It expires in one minute.`,
    html: `
      <div style="background:#f5f5f0;padding:40px 16px;font-family:Arial,sans-serif;color:#191b18">
        <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e5e5de">
          <div style="display:inline-block;background:#191b18;color:#dffd69;padding:10px 14px;border-radius:12px;font-weight:700">TTM</div>

          <h1 style="font-size:25px;margin:28px 0 10px">
            Reset your password
          </h1>

          <p style="color:#65685f;line-height:1.6">
            Hi ${name}, use this one-time code to reset your TTM password.
          </p>

          <div style="font-size:34px;font-weight:700;letter-spacing:10px;background:#f1f4e5;padding:20px;text-align:center;border-radius:14px;margin:24px 0">
            ${otp}
          </div>

          <p style="color:#65685f;line-height:1.6">
            This code expires in exactly one minute. If you did not request it, you can safely ignore this email.
          </p>

          <p style="color:#989b92;font-size:12px;margin-top:28px">
            TTM — Talk To Me
          </p>
        </div>
      </div>
    `
  })
}
module.exports = {
  sendPasswordResetEmail
}