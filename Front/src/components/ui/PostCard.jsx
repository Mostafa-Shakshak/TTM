import { useEffect, useState } from 'react'
import {
  Bookmark,
  Check,
  Ellipsis,
  Heart,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Repeat2,
  Trash2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { likesService } from '../../services/likes.service'
import { postsService } from '../../services/posts.service'
import { getErrorMessage } from '../../utils/errors'
import { deleteDemoPost, upsertDemoPost } from '../../utils/demoStore'
import { formatCount, timeAgo } from '../../utils/formatters'
import Avatar from '../common/Avatar'
import Modal from '../common/Modal'
import ImagePicker from './ImagePicker'
import SharePostModal from './SharePostModal'
import SharedPostPreview from './SharedPostPreview'

export default function PostCard({ post, onDeleted, onUpdated, detail = false }) {
  const { user, isDemo } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [draft, setDraft] = useState({ content: post.content || '', image: post.image || '' })
  const [currentPost, setCurrentPost] = useState(post)
  const [liked, setLiked] = useState(Boolean(post.likedByMe))
  const [likeId, setLikeId] = useState(post.likeId || null)
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const isOwner = user?.id === currentPost.authorId
  const authorLink = `/profile/${currentPost.authorId}`
  const canSaveEdit = Boolean(draft.content.trim() || draft.image.trim() || currentPost.sharedPost)

  useEffect(() => {
    setCurrentPost(post)
    setDraft({ content: post.content || '', image: post.image || '' })
    setLiked(Boolean(post.likedByMe))
    setLikeId(post.likeId || null)
    setLikeCount(post._count?.likes || 0)
  }, [post])

  async function handleLike() {
    if (busy) return
    setBusy(true)
    try {
      if (liked) {
        if (!isDemo) await likesService.unlike(likeId)
        setLiked(false)
        setLikeId(null)
        setLikeCount((count) => Math.max(0, count - 1))
      } else {
        const like = isDemo ? { id: crypto.randomUUID() } : await likesService.like(currentPost.id)
        setLiked(true)
        setLikeId(like.id)
        setLikeCount((count) => count + 1)
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'We could not update that like.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()
    if (!canSaveEdit) return
    setBusy(true)
    try {
      const payload = {
        content: draft.content.trim() || undefined,
        image: draft.image.trim() || undefined
      }
      const updated = isDemo
        ? { ...currentPost, ...payload, content: draft.content.trim() || null, image: draft.image.trim() || null, updatedAt: new Date().toISOString() }
        : await postsService.update(currentPost.id, payload)
      const hydrated = { ...currentPost, ...updated }
      if (isDemo) upsertDemoPost(hydrated)
      setCurrentPost(hydrated)
      onUpdated?.(hydrated)
      setEditOpen(false)
      showToast('Post updated.')
    } catch (error) {
      showToast(getErrorMessage(error, 'This post could not be updated.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      if (isDemo) deleteDemoPost(currentPost.id)
      else await postsService.remove(currentPost.id)
      onDeleted?.(currentPost.id)
      setDeleteOpen(false)
      showToast('Post deleted.')
      if (detail) navigate('/')
    } catch (error) {
      showToast(getErrorMessage(error, 'This post could not be deleted.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  function handleShared() {
    setShareOpen(false)
  }

  return (
    <>
      <article className={`post-card ${detail ? 'post-card--detail' : ''} ${currentPost.sharedPost ? 'post-card--shared' : ''}`}>
        <header className="post-card__header">
          <Link to={authorLink}><Avatar user={currentPost.author} size="md" /></Link>
          <div className="post-card__identity">
            <div>
              <Link to={authorLink}>{currentPost.author?.name || 'TTM member'}</Link>
              <span>@{currentPost.author?.username || 'member'}</span>
            </div>
            <span className="post-card__time">· {timeAgo(currentPost.createdAt)}</span>
          </div>
          <div className="post-card__menu">
            <button
              className="icon-button"
              aria-label="Post options"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <Ellipsis size={20} />
            </button>
            {menuOpen && (
              <div className="context-menu">
                {isOwner ? (
                  <>
                    <button onClick={() => { setEditOpen(true); setMenuOpen(false) }}>
                      <Pencil size={16} /> Edit post
                    </button>
                    <button className="danger" onClick={() => { setDeleteOpen(true); setMenuOpen(false) }}>
                      <Trash2 size={16} /> Delete post
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setSaved(true); setMenuOpen(false) }}>
                    <Bookmark size={16} /> Save post
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {currentPost.sharedPost && <div className="post-card__share-label"><Repeat2 size={15} /><span>{currentPost.author?.name || 'Someone'} shared a post</span></div>}

        {currentPost.content && <p className="post-card__content">{currentPost.content}</p>}

        {currentPost.image && (
          <Link to={`/post/${currentPost.id}`} className="post-card__media" aria-label="Open post">
            <img src={currentPost.image} alt="" />
          </Link>
        )}

        {currentPost.sharedPost && <SharedPostPreview post={currentPost.sharedPost} />}

        <div className="post-card__actions">
          <button className={liked ? 'is-liked' : ''} onClick={handleLike} disabled={busy}>
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            <span>{formatCount(likeCount)}</span>
          </button>
          <Link to={`/post/${currentPost.id}`}>
            <MessageCircle size={20} />
            <span>{formatCount(currentPost._count?.comments || currentPost.comments?.length || 0)}</span>
          </Link>
          <button onClick={() => setShareOpen(true)}>
            <Repeat2 size={19} />
            <span>Share</span>
          </button>
          <button
            className={`post-card__save ${saved ? 'is-saved' : ''}`}
            onClick={() => setSaved((value) => !value)}
            aria-label={saved ? 'Remove saved post' : 'Save post'}
          >
            {saved ? <Check size={19} /> : <Bookmark size={19} />}
          </button>
        </div>
      </article>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit post">
        <form className="edit-form" onSubmit={handleUpdate}>
          <label>
            <span>What do you want to say?</span>
            <textarea
              value={draft.content}
              onChange={(event) => setDraft((value) => ({ ...value, content: event.target.value }))}
              rows={5}
              maxLength={1200}
              placeholder={currentPost.sharedPost ? 'Add or update your thoughts (optional)' : undefined}
            />
          </label>
          <label><span>Post image</span><ImagePicker type="post" value={draft.image} onChange={(image) => setDraft((value) => ({ ...value, image }))} /></label>
          <div className="modal-actions">
            <button type="button" className="button button--quiet" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="button button--primary" disabled={busy || !canSaveEdit}>
              {busy && <LoaderCircle size={17} className="spin" />}
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this post?" size="sm">
        <div className="confirm-copy">
          <p>This conversation and its comments will be permanently removed.</p>
          <div className="modal-actions">
            <button className="button button--quiet" onClick={() => setDeleteOpen(false)}>Keep it</button>
            <button className="button button--danger" onClick={handleDelete} disabled={busy}>
              {busy && <LoaderCircle size={17} className="spin" />}
              Delete post
            </button>
          </div>
        </div>
      </Modal>

      <SharePostModal open={shareOpen} onClose={() => setShareOpen(false)} post={currentPost} onShared={handleShared} />
    </>
  )
}
