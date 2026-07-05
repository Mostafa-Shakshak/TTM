import { Bell, Home, MessageCircleMore, Plus, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/notifications', label: 'Activity', icon: Bell },
  { to: '/messages', label: 'Messages', icon: MessageCircleMore },
  { to: '/profile', label: 'Profile', icon: UserRound }
]

export default function MobileNav({ onCreate }) {
  const { unreadCount, messageUnreadCount } = useSocket()
  const formatMessagesBadge = (count) => (count > 99 ? '99+' : count)
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.slice(0, 1).map(({ to, label, icon: Icon, end }) => (
        <NavLink key={label} to={to} end={end} aria-label={label}>
          <Icon size={22} />
        </NavLink>
      ))}
      <button className="mobile-nav__create" onClick={onCreate} aria-label="Create post">
        <Plus size={23} />
      </button>
      {items.slice(1).map(({ to, label, icon: Icon }) => (
        <NavLink key={label} to={to} aria-label={label}>
          <Icon size={22} />
          {label === 'Activity' && unreadCount > 0 && <i className="mobile-nav__badge">{unreadCount > 9 ? '9+' : unreadCount}</i>}
          {label === 'Messages' && messageUnreadCount > 0 && <i className="mobile-nav__badge">{formatMessagesBadge(messageUnreadCount)}</i>}
        </NavLink>
      ))}
    </nav>
  )
}
