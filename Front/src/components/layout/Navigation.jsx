import {
  Bell,
  Compass,
  Home,
  LogOut,
  MessageCircleMore,
  Plus,
  Settings,
  UserRound
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../common/Avatar'
import Logo from '../common/Logo'
import { useSocket } from '../../context/SocketContext'

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/?view=discover', label: 'Discover', icon: Compass },
  { to: '/notifications', label: 'Activity', icon: Bell },
  { to: '/messages', label: 'Messages', icon: MessageCircleMore },
  { to: '/profile', label: 'Profile', icon: UserRound }
  ,{ to: '/settings', label: 'Settings', icon: Settings }
]

export default function Navigation({ onCreate }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount } = useSocket()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="side-nav">
      <div className="side-nav__inner">
        <Logo />
        <nav aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon }) => {
            const discover = to.includes('view=discover')
            const active = discover
              ? location.pathname === '/' && location.search.includes('view=discover')
              : to === '/'
                ? location.pathname === '/' && !location.search.includes('view=discover')
                : location.pathname.startsWith(to)

            return (
            <Link
              to={to}
              key={label}
              className={`nav-link ${active ? 'nav-link--active' : ''}`}
            >
              <Icon size={21} />
              <span>{label}</span>
              {label === 'Activity' && unreadCount > 0 && <i className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</i>}
            </Link>
            )
          })}
        </nav>
        <button className="button button--primary side-nav__create" onClick={onCreate}>
          <Plus size={19} />
          <span>New post</span>
        </button>
        <div className="side-nav__spacer" />
        <div className="side-nav__account">
          <Avatar user={user} size="sm" />
          <span>
            <strong>{user?.name}</strong>
            <small>@{user?.username}</small>
          </span>
          <button className="icon-button" onClick={handleLogout} aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
        <p className="side-nav__footer">
          <MessageCircleMore size={13} />
          Talk openly. Listen kindly.
        </p>
      </div>
    </aside>
  )
}
