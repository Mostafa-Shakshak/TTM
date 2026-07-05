export function PageLoader({ label = 'Gathering conversations' }) {
  return (
    <div className="page-loader">
      <span className="loader-orbit" />
      <p>{label}</p>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="skeleton-stack" aria-label="Loading posts">
      {[1, 2, 3].map((item) => (
        <div className="post-card skeleton-card" key={item}>
          <div className="skeleton-row">
            <span className="skeleton skeleton--avatar" />
            <span className="skeleton skeleton--line" />
          </div>
          <span className="skeleton skeleton--text" />
          <span className="skeleton skeleton--text skeleton--short" />
          <span className="skeleton skeleton--media" />
        </div>
      ))}
    </div>
  )
}
