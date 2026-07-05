export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-state__icon"><Icon size={26} /></span>}
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  )
}
