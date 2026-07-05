import { Heart, MessageCircle, Repeat2, UserCheck, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../common/Avatar'
import { timeAgo } from '../../utils/formatters'

const copy = {
  Like: 'liked your post',
  Comment: 'commented on your post',
  Share: 'shared your post',
  FollowRequest: 'sent you a follow request',
  FollowAccepted: 'accepted your follow request'
}

const icons = {
  Like: Heart,
  Comment: MessageCircle,
  Share: Repeat2,
  FollowRequest: UserPlus,
  FollowAccepted: UserCheck
}

export default function NotificationItem({ notification, onRead }) {
  const Icon = icons[notification.type] || MessageCircle
  const destination = notification.postId ? `/post/${notification.postId}` : `/profile/${notification.actorId}`

  return (
    <Link to={destination} className={`notification-item ${notification.isRead ? '' : 'notification-item--unread'}`} onClick={() => onRead(notification)}>
      <span className="notification-item__avatar"><Avatar user={notification.actor} size="md" /><i><Icon size={13} /></i></span>
      <span className="notification-item__copy"><strong>{notification.actor?.name}</strong> {copy[notification.type] || 'interacted with you'}<small>{timeAgo(notification.createdAt)}</small></span>
      {!notification.isRead && <i className="notification-item__dot" />}
    </Link>
  )
}
