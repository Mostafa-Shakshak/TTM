import { useMemo, useState } from 'react'
import { Image, LoaderCircle, Send, Smile } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { postsService } from '../../services/posts.service'
import { upsertDemoPost } from '../../utils/demoStore'
import { getErrorMessage } from '../../utils/errors'
import Avatar from '../common/Avatar'
import Modal from '../common/Modal'
import ImagePicker from './ImagePicker'

export default function Composer({
  mode = 'inline',
  open = true,
  onClose = () => {},
  onCreated
}) {
  const { user, isDemo } = useAuth()
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [image, setImage] = useState('')
  const [showImageField, setShowImageField] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(() => Boolean(content.trim() || image.trim()), [content, image])

  function reset() {
    setContent('')
    setImage('')
    setShowImageField(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)

    try {
      const payload = {
        content: content.trim() || undefined,
        image: image.trim() || undefined
      }

      const post = isDemo
        ? {
            id: crypto.randomUUID(),
            ...payload,
            authorId: user.id,
            author: user,
            createdAt: new Date().toISOString(),
            _count: { likes: 0, comments: 0 },
            comments: []
          }
        : await postsService.create(payload)

      const hydrated = { ...post, author: post.author || user, _count: post._count || { likes: 0, comments: 0 } }
      if (isDemo) upsertDemoPost(hydrated)
      onCreated?.(hydrated)
      window.dispatchEvent(new CustomEvent('ttm:post-created', { detail: hydrated }))
      showToast('Your post is live.')
      reset()
      if (mode === 'modal') onClose()
    } catch (error) {
      showToast(getErrorMessage(error, 'Your post could not be shared.'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const form = (
    <form className={`composer composer--${mode}`} onSubmit={handleSubmit}>
      <div className="composer__body">
        <Avatar user={user} size="md" />
        <div className="composer__fields">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What do you want to talk about?"
            rows={mode === 'modal' ? 5 : 3}
            maxLength={1200}
            autoFocus={mode === 'modal'}
          />
          {showImageField && (
            <ImagePicker type="post" value={image} onChange={setImage} label="Upload a post image" />
          )}
        </div>
      </div>
      <div className="composer__footer">
        <div className="composer__tools">
          <button
            type="button"
            className={showImageField ? 'is-active' : ''}
            onClick={() => setShowImageField((value) => !value)}
          >
            <Image size={18} />
            <span>Image</span>
          </button>
          <button type="button" onClick={() => setContent((value) => `${value}${value ? ' ' : ''}✨`)}>
            <Smile size={18} />
            <span>Feeling</span>
          </button>
        </div>
        <div className="composer__submit">
          {content.length > 900 && <small>{1200 - content.length}</small>}
          <button className="button button--primary" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <Send size={17} />}
            Post
          </button>
        </div>
      </div>
    </form>
  )

  if (mode === 'modal') {
    return (
      <Modal open={open} onClose={onClose} title="Start a conversation">
        {form}
      </Modal>
    )
  }

  return form
}
