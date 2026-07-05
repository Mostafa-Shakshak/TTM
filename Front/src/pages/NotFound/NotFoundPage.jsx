import { ArrowLeft, MessageCircleOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../../components/common/Logo'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <Logo />
      <div>
        <MessageCircleOff size={42} />
        <span>404</span>
        <h1>This conversation wandered off.</h1>
        <p>The page you’re looking for doesn’t live here—or maybe it’s taking the scenic route.</p>
        <Link to="/" className="button button--primary"><ArrowLeft size={17} /> Back to TTM</Link>
      </div>
    </main>
  )
}
