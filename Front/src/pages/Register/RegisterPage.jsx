import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../utils/errors'

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordChecks = useMemo(() => ({
    length: form.password.length >= 8,
    mixed: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password)
  }), [form.password])

  if (isAuthenticated) return <Navigate to="/" replace />

  function updateField(field) {
    return (event) => setForm((value) => ({ ...value, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await register({
        ...form,
        username: form.username.replace(/^@/, '').trim()
      })
      navigate('/')
    } catch (submitError) {
      setError(getErrorMessage(submitError, submitError.message || 'We could not create your account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page auth-page--register">
      <section className="auth-visual auth-visual--register">
        <Logo light />
        <div className="auth-visual__content">
          <span className="eyebrow eyebrow--light"><Sparkles size={15} /> Your corner of the internet</span>
          <h1>Come as you are.<br />Say what you mean.</h1>
          <p>TTM is built for the half-formed idea, the honest update, and the reply that starts something good.</p>
        </div>
        <div className="auth-manifesto">
          <span>01</span><p>Fewer metrics. More meaning.</p>
          <span>02</span><p>Your people, at your pace.</p>
          <span>03</span><p>Private when you want it.</p>
        </div>
        <footer>TTM · Talk To Me</footer>
      </section>

      <section className="auth-panel auth-panel--register">
        <div className="auth-panel__mobile-logo"><Logo /></div>
        <div className="auth-card">
          <header>
            <span className="auth-kicker">Join TTM</span>
            <h2>Make yourself at home.</h2>
            <p>A few details and your side of the conversation is ready.</p>
          </header>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="field-row">
              <label className="field">
                <span>Full name</span>
                <input value={form.name} onChange={updateField('name')} placeholder="Alex Morgan" required />
              </label>
              <label className="field">
                <span>Username</span>
                <div className="username-field">
                  <i>@</i>
                  <input value={form.username} onChange={updateField('username')} placeholder="alexm" required />
                </div>
              </label>
            </div>
            <label className="field">
              <span>Email address</span>
              <input type="email" value={form.email} onChange={updateField('email')} placeholder="you@example.com" required />
            </label>
            <label className="field">
              <span>Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={updateField('password')}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <div className="password-checks">
              <span className={passwordChecks.length ? 'is-valid' : ''}><Check size={13} /> 8+ characters</span>
              <span className={passwordChecks.mixed ? 'is-valid' : ''}><Check size={13} /> Upper & lowercase</span>
              <span className={passwordChecks.number ? 'is-valid' : ''}><Check size={13} /> Number</span>
              <span className={passwordChecks.special ? 'is-valid' : ''}><Check size={13} /> Special character</span>
            </div>
            <button className="button button--primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <>Create account <ArrowRight size={18} /></>}
            </button>
          </form>
          <p className="terms">By joining, you agree to treat people like people. That’s the important bit.</p>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}
