import { Check, LoaderCircle, Search } from 'lucide-react'
import { useState } from 'react'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import { usersService } from '../../services/users.service'
import { chatService } from '../../services/chat.service'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errors'

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)

  async function search(value) {
    setQuery(value)
    setResults(value.trim() ? await usersService.search(value) : [])
  }

  async function create(event) {
    event.preventDefault(); setBusy(true)
    try {
      const group = await chatService.createGroup({ name, members: selected.map((user) => user.id) })
      onCreated(group); onClose(); setName(''); setSelected([]); setResults([]); setQuery('')
      showToast('Group created.')
    } catch (error) { showToast(getErrorMessage(error), 'error') } finally { setBusy(false) }
  }

  return <Modal open={open} onClose={onClose} title="Create a group"><form className="group-form" onSubmit={create}><label className="field"><span>Group name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label><div className="chat-list__search"><Search size={17} /><input value={query} onChange={(event) => search(event.target.value)} placeholder="Find people" /></div><div className="member-picker">{results.map((user) => { const active = selected.some((item) => item.id === user.id); return <button type="button" key={user.id} className={active ? 'is-active' : ''} onClick={() => setSelected((current) => active ? current.filter((item) => item.id !== user.id) : [...current, user])}><Avatar user={user} size="sm" /><span><strong>{user.name}</strong><small>@{user.username}</small></span>{active && <Check size={17} />}</button> })}</div><div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={busy || !name.trim() || !selected.length}>{busy && <LoaderCircle className="spin" size={17} />}Create group</button></div></form></Modal>
}
