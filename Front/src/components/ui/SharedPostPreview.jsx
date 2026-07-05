import { ExternalLink, Repeat2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../common/Avatar'
import { timeAgo } from '../../utils/formatters'

export default function SharedPostPreview({ post, compact = false }) {
  if (!post) {
    return <div className="shared-post shared-post--missing"><strong>Original post unavailable</strong><p>The post that was shared is no longer available to view.</p></div>
  }

  return <Link to={`/post/${post.id}`} className={`shared-post ${compact ? 'shared-post--compact' : ''}`}><div className="shared-post__eyebrow"><Repeat2 size={14} /><span>Original post</span><ExternalLink size={13} /></div><div className="shared-post__header"><Avatar user={post.author} size="sm" /><div><strong>{post.author?.name || 'TTM member'}</strong><small>@{post.author?.username || 'member'} · {timeAgo(post.createdAt)}</small></div></div>{post.content && <p className="shared-post__content">{post.content}</p>}{post.image && <div className="shared-post__media"><img src={post.image} alt="" /></div>}</Link>
}
