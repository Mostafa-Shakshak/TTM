import { KeyRound, LoaderCircle, LogOut, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { authService } from '../../services/auth.service'
import { getErrorMessage } from '../../utils/errors'

export default function SettingsPage() {
  const { logoutAll } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [busy, setBusy] = useState(false)

  async function changePassword(event) {
    event.preventDefault(); setBusy(true)
    try {
      await authService.changePassword(form)
      showToast('Password changed. Please sign in again.')
      window.dispatchEvent(new CustomEvent('ttm:unauthorized'))
      navigate('/login', { replace: true })
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally { setBusy(false) }
  }

  async function handleLogoutAll() {
    setBusy(true)
    try {
      await logoutAll()
      navigate('/login', { replace: true })
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally { setBusy(false) }
  }

  return (
    <div className="settings-page page-column">
      <header className="page-heading page-heading--compact"><div><span className="eyebrow">Account controls</span><h1>Settings</h1><p>Security and session controls for your TTM account.</p></div><span className="page-heading__mark"><ShieldCheck size={20} /></span></header>
      <section className="settings-card"><header><KeyRound size={20} /><div><h2>Change password</h2><p>Changing your password signs out every active session.</p></div></header><form onSubmit={changePassword}><label className="field"><span>Current password</span><input type="password" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} required /></label><label className="field"><span>New password</span><input type="password" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} minLength={8} required /></label><button className="button button--primary" disabled={busy}>{busy && <LoaderCircle className="spin" size={17} />}Update password</button></form></section>
      <section className="settings-card settings-card--danger"><header><LogOut size={20} /><div><h2>Active sessions</h2><p>Sign out this account on every browser and device.</p></div></header><button className="button button--danger" onClick={handleLogoutAll} disabled={busy}>Log out everywhere</button></section>
    </div>
  )
}
