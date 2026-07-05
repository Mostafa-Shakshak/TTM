import { CheckCheck, Ellipsis, Pencil, Reply, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { timeAgo } from '../../utils/formatters'
import Avatar from '../common/Avatar'

export default function MessageBubble({ message, own, onEdit, onDelete, onReply }) {
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(message.content || '')
  const seen = message.reciept?.some((receipt) => receipt.status === 'Seen' && receipt.userId !== message.senderId)

  function save() {
    if (!content.trim()) return
    onEdit(message.id, content.trim())
    setEditing(false)
  }

  return (
    <article className={`message-bubble ${own ? 'message-bubble--own' : ''}`}>
      {!own && <Avatar user={message.sender} size="sm" />}
      <div className="message-bubble__content">
        {message.replyTo && <div className="message-bubble__reply">{message.replyTo.content || 'Image'}</div>}
        {editing ? <div className="message-bubble__edit"><input value={content} onChange={(event) => setContent(event.target.value)} autoFocus /><button onClick={save}>Save</button></div> : <>{message.image && <img src={message.image} alt="Shared" />}{message.content && <p>{message.content}</p>}</>}
        <small>{timeAgo(message.createdAt)}{message.editedAt ? ' · edited' : ''}{own && <CheckCheck size={13} className={seen ? 'is-seen' : ''} />}</small>
      </div>
      <div className="message-bubble__menu"><button className="icon-button" onClick={() => setMenu((value) => !value)} aria-label="Message options"><Ellipsis size={16} /></button>{menu && <div className="context-menu"><button onClick={() => { onReply(message); setMenu(false) }}><Reply size={15} />Reply</button>{own && <><button onClick={() => { setEditing(true); setMenu(false) }}><Pencil size={15} />Edit</button><button className="danger" onClick={() => onDelete(message.id)}><Trash2 size={15} />Delete</button></>}</div>}</div>
    </article>
  )
}
