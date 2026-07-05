import { ArrowRight, Eye, EyeOff, LoaderCircle, MessageCircleMore, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../utils/errors'

export default function LoginPage() {
  const { login, startDemo, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(form)
      navigate(location.state?.from || '/', { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError, submitError.message || 'We could not sign you in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDemo() {
    startDemo()
    navigate('/')
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Logo light />
        <div className="auth-visual__content">
          <span className="eyebrow eyebrow--light"><Sparkles size={15} /> A more human social space</span>
          <h1>There’s always more<br />to the story.</h1>
          <p>Share the thought. Find your people. Make room for conversations worth having.</p>
        </div>
        <div className="auth-visual__conversation">
          <div className="conversation-card conversation-card--back">
            <span>Jon</span>
            <p>What changed your mind lately?</p>
          </div>
          <div className="conversation-card">
            <MessageCircleMore size={21} />
            <p>“A quiet place for loud thoughts.”</p>
            <span>— Maya, on TTM</span>
          </div>
        </div>
        <footer>TTM · Talk openly. Listen kindly.</footer>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__mobile-logo"><Logo /></div>
        <div className="auth-card">
          <header>
            <span className="auth-kicker">Welcome back</span>
            <h2>Let’s pick up the conversation.</h2>
            <p>Sign in to see what your people have been talking about.</p>
          </header>

          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span className="field__heading">Password <Link to="/reset-password">Forgot password?</Link></span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button className="button button--primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <>Sign in <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <button className="button button--demo" onClick={handleDemo}>
            Explore the demo
            <span>No account needed</span>
          </button>
          <p className="auth-switch">New to TTM? <Link to="/register">Create your account</Link></p>
        </div>
      </section>
    </main>
  )
}
