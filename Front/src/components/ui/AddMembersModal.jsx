import { Check, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import { usersService } from '../../services/users.service'
import { chatService } from '../../services/chat.service'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errors'

export default function AddMembersModal({ open, onClose, conversationId, members = [], onAdded }) {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)

  const existingMembers = useMemo(() => new Set(members.map((member) => member.userId)), [members])

  function reset() {
    setQuery('')
    setResults([])
    setSelected([])
    setBusy(false)
  }

  useEffect(() => {
    if (open) return
    reset()
  }, [open])

  async function search(value) {
    setQuery(value)
    if (!value.trim()) {
      setResults([])
      return
    }

    try {
      const users = await usersService.search(value)
      setResults(users.filter((user) => !existingMembers.has(user.id)))
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      setResults([])
    }
  }

  async function addMembers(event) {
    event.preventDefault()
    if (!selected.length) return
    setBusy(true)
    try {
      await chatService.addMembers(conversationId, selected.map((user) => user.id))
      await onAdded?.()
      showToast(selected.length === 1 ? 'Member added.' : 'Members added.')
      onClose()
      reset()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  return <Modal open={open} onClose={onClose} title="Add members"><form className="group-form" onSubmit={addMembers}><div className="chat-list__search"><Search size={17} /><input value={query} onChange={(event) => search(event.target.value)} placeholder="Find people to add" autoFocus /></div><div className="member-picker">{results.length ? results.map((user) => { const active = selected.some((item) => item.id === user.id); return <button type="button" key={user.id} className={active ? 'is-active' : ''} onClick={() => setSelected((current) => active ? current.filter((item) => item.id !== user.id) : [...current, user])}><Avatar user={user} size="sm" /><span><strong>{user.name}</strong><small>@{user.username}</small></span>{active && <Check size={17} />}</button> }) : <p className="member-picker__empty">{query.trim() ? 'No eligible people found.' : 'Search for people who are not already in this group.'}</p>}</div><div className="modal-actions"><span className="member-picker__count">{selected.length ? `${selected.length} selected` : 'Select at least one person'}</span><button type="button" className="button button--quiet" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={busy || !selected.length}>{busy && <LoaderCircle className="spin" size={17} />}Add members</button></div></form></Modal>
}
