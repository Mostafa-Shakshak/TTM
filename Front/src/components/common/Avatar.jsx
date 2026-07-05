import { initials } from '../../utils/formatters'

export default function Avatar({ user, size = 'md', className = '' }) {
  return (
    <span
      className={`avatar avatar--${size} ${className}`}
      title={user?.name}
      aria-label={`${user?.name || 'User'} avatar`}
    >
      {user?.profileImage ? (
        <img src={user.profileImage} alt="" />
      ) : (
        <span>{initials(user?.name)}</span>
      )}
    </span>
  )
}
