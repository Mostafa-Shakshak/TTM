import { Check, Ellipsis, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { commentsService } from '../../services/comments.service'
import { getErrorMessage } from '../../utils/errors'
import { timeAgo } from '../../utils/formatters'
import Avatar from '../common/Avatar'

export default function CommentItem({ comment, onUpdated, onDeleted }) {
  const { user, isDemo } = useAuth()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(comment.content || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const isOwner = user?.id === comment.authorId

  async function updateComment() {
    if (!content.trim()) return
    setBusy(true)
    try {
      const updated = isDemo
        ? { ...comment, content: content.trim(), updatedAt: new Date().toISOString() }
        : await commentsService.update(comment.id, { content: content.trim(), image: comment.image })
      onUpdated({ ...comment, ...updated })
      setEditing(false)
      showToast('Comment updated.')
    } catch (error) {
      showToast(getErrorMessage(error, 'That comment could not be updated.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function deleteComment() {
    setBusy(true)
    try {
      if (!isDemo) await commentsService.remove(comment.id)
      onDeleted(comment.id)
      showToast('Comment deleted.')
    } catch (error) {
      showToast(getErrorMessage(error, 'That comment could not be deleted.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="comment">
      <Link to={`/profile/${comment.authorId}`}>
        <Avatar user={comment.author} size="sm" />
      </Link>
      <div className="comment__body">
        <div className="comment__meta">
          <Link to={`/profile/${comment.authorId}`}>{comment.author?.name || 'TTM member'}</Link>
          <span>@{comment.author?.username || 'member'} · {timeAgo(comment.createdAt)}</span>
        </div>
        {editing ? (
          <div className="comment__edit">
            <input value={content} onChange={(event) => setContent(event.target.value)} autoFocus />
            <button onClick={updateComment} disabled={busy} aria-label="Save comment"><Check size={16} /></button>
            <button onClick={() => setEditing(false)} aria-label="Cancel editing"><X size={16} /></button>
          </div>
        ) : (
          <>
            {comment.content && <p>{comment.content}</p>}
            {comment.image && <img className="comment__image" src={comment.image} alt="" />}
          </>
        )}
      </div>
      {isOwner && (
        <div className="comment__menu">
          <button className="icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Comment options">
            <Ellipsis size={17} />
          </button>
          {menuOpen && (
            <div className="context-menu">
              <button onClick={() => { setEditing(true); setMenuOpen(false) }}><Pencil size={15} /> Edit</button>
              <button className="danger" onClick={deleteComment} disabled={busy}><Trash2 size={15} /> Delete</button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
