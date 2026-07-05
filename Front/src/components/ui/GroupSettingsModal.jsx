import { Archive, Crown, LoaderCircle, LogOut, Trash2, UserMinus } from 'lucide-react'
import { useState } from 'react'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import ImagePicker from './ImagePicker'
import { chatService } from '../../services/chat.service'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errors'

export default function GroupSettingsModal({ open, onClose, chat, currentUserId, onChanged, onRemoved }) {
  const { showToast } = useToast()
  const [name, setName] = useState(chat?.name || '')
  const [image, setImage] = useState(chat?.image || '')
  const [busy, setBusy] = useState(false)
  if (!chat) return null
  const membership = chat.conversation?.find((item) => item.userId === currentUserId)
  const admin = membership?.role === 'Admin'

  async function action(callback, success) {
    setBusy(true)
    try { await callback(); showToast(success); onChanged?.() } catch (error) { showToast(getErrorMessage(error), 'error') } finally { setBusy(false) }
  }

  return <Modal open={open} onClose={onClose} title="Conversation settings"><div className="group-settings">{chat.type === 'Group' && <><ImagePicker type="group" value={image} onChange={setImage} label="Upload group image" /><label className="field"><span>Group name</span><input value={name} onChange={(event) => setName(event.target.value)} disabled={!admin} /></label>{admin && <button className="button button--primary" disabled={busy} onClick={() => action(async () => { await chatService.update(chat.id, { name, image }) }, 'Group updated.')}>{busy && <LoaderCircle className="spin" size={17} />}Save group</button>}<div className="group-members"><h3>Members</h3>{chat.conversation?.map((member) => <div key={member.id}><Avatar user={member.user} size="sm" /><span><strong>{member.user.name}</strong><small>{member.role}</small></span>{admin && member.userId !== currentUserId && <div>{member.role === 'Admin' ? <button onClick={() => action(() => chatService.demote(chat.id, member.userId), 'Admin demoted.')} aria-label="Demote admin"><Crown size={15} /></button> : <button onClick={() => action(() => chatService.promote(chat.id, member.userId), 'Member promoted.')} aria-label="Promote member"><Crown size={15} /></button>}<button onClick={() => action(() => chatService.removeMember(chat.id, member.userId), 'Member removed.')} aria-label="Remove member"><UserMinus size={15} /></button></div>}</div>)}</div></>}
      <div className="group-settings__actions"><button onClick={() => action(() => chatService.archive(chat.id, true), 'Conversation archived.')}><Archive size={17} />Archive</button>{chat.type === 'Group' && <button onClick={() => action(() => chatService.leave(chat.id), 'You left the group.')}><LogOut size={17} />Leave group</button>}<button className="danger" onClick={() => action(async () => { await chatService.remove(chat.id); onRemoved() }, 'Conversation deleted.')}><Trash2 size={17} />Delete conversation</button></div></div></Modal>
}
