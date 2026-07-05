import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { DEMO_PROFILES } from '../../data/demoData'
import Avatar from '../common/Avatar'

export default function RightSidebar() {
  const { user, isDemo } = useAuth()
  const suggestions = isDemo ? DEMO_PROFILES.filter((item) => item.id !== user?.id).slice(0, 3) : []

  return (
    <aside className="right-sidebar">
      <section className="mini-profile">
        <div className="mini-profile__top">
          <Avatar user={user} size="lg" />
          <Link to="/profile">View profile <ArrowUpRight size={14} /></Link>
        </div>
        <strong>{user?.name}</strong>
        <span>@{user?.username}</span>
        <p>{user?.bio || 'Your corner of TTM is ready for a little personality.'}</p>
      </section>

      {suggestions.length > 0 && (
        <section className="sidebar-card">
          <header>
            <h3>People to hear from</h3>
            <Sparkles size={17} />
          </header>
          <div className="suggestion-list">
            {suggestions.map((profile) => (
              <Link to={`/profile/${profile.id}`} className="suggestion" key={profile.id}>
                <Avatar user={profile} size="sm" />
                <span>
                  <strong>{profile.name}</strong>
                  <small>@{profile.username}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="sidebar-note">
        <span>Today on TTM</span>
        <h3>Make room for a real conversation.</h3>
        <p>Share the unfinished thought. Ask the better question. Stay curious.</p>
      </section>

      <footer className="right-sidebar__footer">
        <span>© 2026 TTM</span>
        <span>Talk To Me</span>
      </footer>
    </aside>
  )
}
