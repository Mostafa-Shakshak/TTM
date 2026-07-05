import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Logo from '../common/Logo'
import Composer from '../ui/Composer'
import MobileNav from './MobileNav'
import Navigation from './Navigation'
import RightSidebar from './RightSidebar'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'

export default function AppShell() {
  const [composerOpen, setComposerOpen] = useState(false)
  const { latestNotification } = useSocket()
  const { showToast } = useToast()

  useEffect(() => {
    if (latestNotification) {
      showToast(`${latestNotification.actor?.name || 'Someone'} interacted with you.`, 'info')
    }
  }, [latestNotification, showToast])

  return (
    <div className="app-shell">
      <Navigation onCreate={() => setComposerOpen(true)} />
      <header className="mobile-header">
        <Logo />
        <button className="mobile-header__action" onClick={() => setComposerOpen(true)}>Share</button>
      </header>
      <main className="app-main">
        <Outlet context={{ openComposer: () => setComposerOpen(true) }} />
      </main>
      <RightSidebar />
      <MobileNav onCreate={() => setComposerOpen(true)} />
      <Composer
        mode="modal"
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  )
}
