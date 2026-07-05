export function formatCount(value = 0) {
  return new Intl.NumberFormat('en', {
    notation: value > 999 ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(value)
}

export function timeAgo(date) {
  if (!date) return 'now'

  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000))
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60]
  ]

  for (const [label, amount] of units) {
    if (seconds >= amount) return `${Math.floor(seconds / amount)}${label}`
  }

  return 'now'
}

export function initials(name = 'TTM') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function normalizeStatus(status = '') {
  const value = status.toLowerCase()
  if (value === 'accepted') return 'following'
  if (value === 'pending') return 'pending'
  if (value === 'rejected') return 'rejected'
  return 'idle'
}
