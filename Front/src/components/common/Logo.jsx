import { Link } from 'react-router-dom'

export default function Logo({ compact = false, light = false }) {
  return (
    <Link className={`brand ${light ? 'brand--light' : ''}`} to="/">
      <span className="brand__mark" aria-hidden="true">T</span>
      {!compact && (
        <span className="brand__copy">
          <strong>TTM</strong>
          <small>Talk To Me</small>
        </span>
      )}
    </Link>
  )
}
