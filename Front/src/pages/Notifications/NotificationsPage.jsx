import { Bell, Check, LoaderCircle, UserRoundCheck, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar'
import EmptyState from '../../components/common/EmptyState'
import NotificationItem from '../../components/ui/NotificationItem'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'
import { DEMO_REQUESTS } from '../../data/demoData'
import { followService } from '../../services/follow.service'
import { notificationsService } from '../../services/notifications.service'
import { getErrorMessage } from '../../utils/errors'
import { timeAgo } from '../../utils/formatters'

export default function NotificationsPage() {
  const { isDemo } = useAuth()
  const { latestNotification, setUnreadCount } = useSocket()
  const { showToast } = useToast()
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [busyId, setBusyId] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemo) {
        setRequests(structuredClone(DEMO_REQUESTS)); setNotifications([])
      } else {
        const [requestData, notificationData] = await Promise.all([followService.getRequests(), notificationsService.getAll(1)])
        setRequests(requestData); setNotifications(notificationData.notifications); setPagination(notificationData.pagination)
      }
    } catch (error) { showToast(getErrorMessage(error), 'error') } finally { setLoading(false) }
  }, [isDemo, showToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (latestNotification) setNotifications((current) => current.some((item) => item.id === latestNotification.id) ? current : [latestNotification, ...current]) }, [latestNotification])

  async function respond(request, action) {
    setBusyId(request.id)
    try {
      if (!isDemo) { if (action === 'accept') await followService.accept(request.id); else await followService.reject(request.id) }
      setRequests((current) => current.filter((item) => item.id !== request.id))
      showToast(action === 'accept' ? 'Follow request accepted.' : 'Follow request declined.')
    } catch (error) { showToast(getErrorMessage(error), 'error') } finally { setBusyId(null) }
  }

  async function markRead(notification) {
    if (notification.isRead || isDemo) return
    try {
      await notificationsService.markRead(notification.id)
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item))
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch (error) { showToast(getErrorMessage(error), 'error') }
  }

  async function markAll() {
    try {
      if (!isDemo) await notificationsService.markAllRead()
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
    } catch (error) { showToast(getErrorMessage(error), 'error') }
  }

  async function loadMore() {
    const next = pagination.page + 1
    try { const data = await notificationsService.getAll(next); setNotifications((current) => [...current, ...data.notifications]); setPagination(data.pagination) } catch (error) { showToast(getErrorMessage(error), 'error') }
  }

  return <div className="notifications-page page-column"><header className="page-heading page-heading--compact"><div><span className="eyebrow">Your people</span><h1>Activity</h1><p>Requests, replies, and moments that found their way back to you.</p></div><span className="page-heading__mark"><Bell size={20} /></span></header>
    {loading ? <div className="page-loader"><LoaderCircle className="spin" size={28} /></div> : <><section className="request-section"><div className="section-title"><div><UserRoundCheck size={18} /><h2>Follow requests</h2></div>{requests.length > 0 && <span>{requests.length} new</span>}</div>{requests.length === 0 ? <p className="section-empty">No pending follow requests.</p> : <div className="request-list">{requests.map((request) => <article className="request-item" key={request.id}><Avatar user={request.follower} size="md" /><div><strong>{request.follower.name}</strong><span>@{request.follower.username} · {timeAgo(request.createdAt)}</span><p>would like to follow you.</p></div><div className="request-item__actions"><button className="button button--primary" onClick={() => respond(request, 'accept')} disabled={busyId === request.id}>{busyId === request.id ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}Accept</button><button className="button button--quiet" onClick={() => respond(request, 'reject')} disabled={busyId === request.id}><X size={16} />Decline</button></div></article>)}</div>}</section>
      <section className="activity-section"><div className="section-title"><div><Bell size={18} /><h2>Notifications</h2></div>{notifications.some((item) => !item.isRead) && <button onClick={markAll}>Mark all read</button>}</div>{notifications.length === 0 ? <EmptyState icon={Check} title="You’re all caught up" text="New likes, comments, and follows will appear here." /> : <div className="notification-list">{notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onRead={markRead} />)}{pagination.page < pagination.pages && <button className="button button--quiet notification-list__more" onClick={loadMore}>Load more</button>}</div>}</section></>}
  </div>
}
