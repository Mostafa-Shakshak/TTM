import { ArrowLeft, LoaderCircle, MessageCircle, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/common/Avatar'
import EmptyState from '../../components/common/EmptyState'
import { PageLoader } from '../../components/common/Loading'
import CommentItem from '../../components/ui/CommentItem'
import PostCard from '../../components/ui/PostCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { commentsService } from '../../services/comments.service'
import { postsService } from '../../services/posts.service'
import { getErrorMessage } from '../../utils/errors'
import { getStoredDemoPost, upsertDemoPost } from '../../utils/demoStore'

export default function PostDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isDemo } = useAuth()
  const { showToast } = useToast()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadPost() {
      try {
        const storedPost = isDemo ? getStoredDemoPost(id) : null
        const result = isDemo ? (storedPost ? structuredClone(storedPost) : null) : await postsService.getById(id)
        if (!result) throw new Error('Post Not Found')
        if (active) {
          setPost(result)
          setComments(result.comments || [])
        }
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError, loadError.message || 'This post could not be loaded.'))
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadPost()
    return () => { active = false }
  }, [id, isDemo])

  async function createComment(event) {
    event.preventDefault()
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const created = isDemo
        ? {
            id: crypto.randomUUID(),
            content: content.trim(),
            postedId: id,
            authorId: user.id,
            createdAt: new Date().toISOString()
          }
        : await commentsService.create({ content: content.trim(), postedId: id })
      const hydratedComment = { ...created, author: user }
      setComments((current) => {
        const nextComments = [hydratedComment, ...current]
        if (isDemo) {
          upsertDemoPost({
            ...post,
            comments: nextComments,
            _count: { ...post._count, comments: nextComments.length }
          })
        }
        return nextComments
      })
      setPost((current) => ({
        ...current,
        _count: { ...current._count, comments: (current._count?.comments || 0) + 1 }
      }))
      setContent('')
      showToast('Reply added.')
    } catch (submitError) {
      showToast(getErrorMessage(submitError, 'Your reply could not be added.'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageLoader label="Opening conversation" />

  if (error || !post) {
    return (
      <div className="page-column">
        <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
        <EmptyState icon={MessageCircle} title="Conversation unavailable" text={error} />
      </div>
    )
  }

  return (
    <div className="post-detail-page page-column">
      <div className="detail-topbar">
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button>
        <div><strong>Conversation</strong><small>See the full thread</small></div>
      </div>

      <PostCard
        post={{ ...post, comments }}
        detail
        onUpdated={setPost}
      />

      <section className="comments-section">
        <form className="reply-form" onSubmit={createComment}>
          <Avatar user={user} size="sm" />
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add to the conversation…"
            maxLength={600}
          />
          <button disabled={!content.trim() || isSubmitting} aria-label="Post reply">
            {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
          </button>
        </form>

        <header className="comments-heading">
          <h2>Replies</h2>
          <span>{comments.length}</span>
        </header>

        {comments.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No replies yet" text="Say the thing that gets this conversation moving." />
        ) : (
          <div className="comment-list">
            {comments.map((comment) => (
              <CommentItem
                comment={comment}
                key={comment.id}
                onUpdated={(updated) => setComments((current) => current.map((item) => item.id === updated.id ? updated : item))}
                onDeleted={(commentId) => setComments((current) => current.filter((item) => item.id !== commentId))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
