import { Check, Clock3, LoaderCircle, UserPlus, UserRoundX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { followService } from '../../services/follow.service'
import { getErrorMessage } from '../../utils/errors'
import { normalizeStatus } from '../../utils/formatters'

export default function FollowButton({ profileId, isPrivate = false, initialFollow = null, onChange, disabled = false }) {
  const { isDemo } = useAuth()
  const { showToast } = useToast()
  const [follow, setFollow] = useState(initialFollow)
  const [busy, setBusy] = useState(false)

  useEffect(() => setFollow(initialFollow), [initialFollow])
  const status = normalizeStatus(follow?.status)

  async function handleClick() {
    if (busy || status === 'rejected' || disabled) return
    setBusy(true)
    try {
      if (status === 'following' || status === 'pending') {
        if (!isDemo) await followService.unfollow(follow.id)
        setFollow(null); onChange?.('idle', null)
        showToast(status === 'pending' ? 'Follow request canceled.' : 'You unfollowed this account.')
      } else {
        const nextFollow = isDemo ? { id: crypto.randomUUID(), status: isPrivate ? 'Pending' : 'Accepted' } : await followService.follow(profileId)
        setFollow(nextFollow); onChange?.(normalizeStatus(nextFollow.status), nextFollow)
        showToast(normalizeStatus(nextFollow.status) === 'pending' ? 'Follow request sent.' : 'You are now following this account.')
      }
    } catch (error) { showToast(getErrorMessage(error, 'The follow request could not be updated.'), 'error') } finally { setBusy(false) }
  }

  const states = { idle: { label: 'Follow', Icon: UserPlus, className: 'button--primary' }, following: { label: 'Following', Icon: Check, className: 'button--secondary' }, pending: { label: 'Requested', Icon: Clock3, className: 'button--secondary' }, rejected: { label: 'Request declined', Icon: UserRoundX, className: 'button--quiet' } }
  const current = states[status] || states.idle
  return <button className={`button ${current.className} follow-button`} onClick={handleClick} disabled={busy || disabled}>{busy ? <LoaderCircle className="spin" size={17} /> : <current.Icon size={17} />}{current.label}</button>
}
