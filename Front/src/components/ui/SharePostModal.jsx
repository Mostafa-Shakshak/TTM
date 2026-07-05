import { LoaderCircle, Repeat2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { postsService } from '../../services/posts.service'
import { upsertDemoPost } from '../../utils/demoStore'
import { getErrorMessage } from '../../utils/errors'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import SharedPostPreview from './SharedPostPreview'

export default function SharePostModal({ open, onClose, post, onShared }) {
  const { user, isDemo } = useAuth()
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [sharing, setSharing] = useState(false)

  const originalPost = useMemo(() => post?.sharedPost || post, [post])

  useEffect(() => {
    if (!open) {
      setContent('')
      setSharing(false)
    }
  }, [open])

  async function handleShare(event) {
    event.preventDefault()
    if (!post || sharing) return

    setSharing(true)
    try {
      const shared = isDemo
        ? {
            id: crypto.randomUUID(),
            content: content.trim() || null,
            image: null,
            authorId: user.id,
            author: user,
            sharedPostId: originalPost.id,
            sharedPost: originalPost,
            createdAt: new Date().toISOString(),
            _count: { likes: 0, comments: 0 },
            comments: [],
            likedByMe: false,
            likeId: null
          }
        : await postsService.share(post.id, { content: content.trim() || undefined })

      if (isDemo) upsertDemoPost(shared)
      onShared?.(shared)
      window.dispatchEvent(new CustomEvent('ttm:post-created', { detail: shared }))
      showToast('Post shared.')
      onClose()
      setContent('')
    } catch (error) {
      showToast(getErrorMessage(error, 'This post could not be shared.'), 'error')
    } finally {
      setSharing(false)
    }
  }

  return <Modal open={open} onClose={onClose} title="Share post"><form className="share-post-form" onSubmit={handleShare}><div className="share-post-form__composer"><Avatar user={user} size="md" /><div><strong>{user?.name}</strong><small>Add something to your share</small></div></div><label className="field"><span>Your thoughts</span><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} maxLength={1200} placeholder="Say something about this post (optional)" /></label><SharedPostPreview post={originalPost} compact /><div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={sharing}>{sharing ? <LoaderCircle className="spin" size={17} /> : <Repeat2 size={17} />}Share post</button></div></form></Modal>
}
