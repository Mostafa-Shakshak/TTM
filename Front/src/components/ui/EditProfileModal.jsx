import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import Modal from '../common/Modal'
import ImagePicker from './ImagePicker'
import { usersService } from '../../services/users.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errors'

export default function EditProfileModal({ open, onClose, profile, onSaved }) {
  const { updateUser } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)

  useEffect(() => setForm(profile), [profile])

  if (!form) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const updated = await usersService.updateProfile({
        name: form.name,
        bio: form.bio,
        profileImage: form.profileImage,
        coverImage: form.coverImage,
        isPrivate: form.isPrivate
      })
      const hydrated = { ...profile, ...updated, _count: profile._count }
      updateUser(hydrated)
      onSaved(hydrated)
      onClose()
      showToast('Profile updated.')
    } catch (error) {
      showToast(getErrorMessage(error, 'Profile update failed.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <div className="edit-profile-form__images">
          <label><span>Profile image</span><ImagePicker type="profile" value={form.profileImage} onChange={(profileImage) => setForm((current) => ({ ...current, profileImage }))} /></label>
          <label><span>Cover image</span><ImagePicker type="cover" value={form.coverImage} onChange={(coverImage) => setForm((current) => ({ ...current, coverImage }))} /></label>
        </div>
        <label className="field"><span>Name</span><input value={form.name || ''} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
        <label className="field"><span>Bio</span><textarea value={form.bio || ''} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} rows={4} maxLength={300} /></label>
        <label className="privacy-toggle">
          <span><strong>Private account</strong><small>Only accepted followers can see your posts or message you.</small></span>
          <input type="checkbox" checked={Boolean(form.isPrivate)} onChange={(event) => setForm((current) => ({ ...current, isPrivate: event.target.checked }))} />
        </label>
        <div className="modal-actions">
          <button type="button" className="button button--quiet" onClick={onClose}>Cancel</button>
          <button className="button button--primary" disabled={saving}>{saving && <LoaderCircle className="spin" size={17} />}Save profile</button>
        </div>
      </form>
    </Modal>
  )
}
