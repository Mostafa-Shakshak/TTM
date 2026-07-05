import { ArrowLeft, ArrowRight, KeyRound, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import { authService } from '../../services/auth.service'
import { getErrorMessage } from '../../utils/errors'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function requestCode(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const result = await authService.requestReset(form.email)
      setMessage(result.message)
      setStep(2)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally { setBusy(false) }
  }

  async function resetPassword(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      await authService.resetPassword(form)
      navigate('/login', { replace: true, state: { reset: true } })
    } catch (resetError) {
      setError(getErrorMessage(resetError))
    } finally { setBusy(false) }
  }

  return (
    <main className="standalone-auth">
      <Logo />
      <section className="standalone-auth__card">
        <span className="standalone-auth__icon"><KeyRound size={25} /></span>
        <span className="auth-kicker">Account recovery</span>
        <h1>{step === 1 ? 'Reset your password' : 'Check your inbox'}</h1>
        <p>{step === 1 ? 'Enter your email and we’ll send a six-digit code that expires in one minute.' : message}</p>
        <form onSubmit={step === 1 ? requestCode : resetPassword}>
          {error && <div className="form-error">{error}</div>}
          <label className="field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required disabled={step === 2} /></label>
          {step === 2 && <><label className="field"><span>Six-digit code</span><input value={form.otp} onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))} inputMode="numeric" pattern="[0-9]{6}" required /></label><label className="field"><span>New password</span><input type="password" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} minLength={8} required /></label></>}
          <button className="button button--primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <>{step === 1 ? 'Send code' : 'Reset password'}<ArrowRight size={18} /></>}</button>
        </form>
        <Link to="/login" className="back-link"><ArrowLeft size={16} />Back to sign in</Link>
      </section>
    </main>
  )
}
