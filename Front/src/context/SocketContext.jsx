import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { connectSocket, disconnectSocket } from '../services/socket.service'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { isAuthenticated, isDemo } = useAuth()
  const [socket, setSocket] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (!isAuthenticated || isDemo) {
      disconnectSocket()
      setSocket(null)
      return undefined
    }

    const token = localStorage.getItem('ttm_access_token')
    const connection = connectSocket(token)
    setSocket(connection)

    const onConnect = () => connection.emit('notification:getUnreadCount')
    const onUnread = ({ count }) => setUnreadCount(count)
    const onNotification = (notification) => {
      setLatestNotification(notification)
      setUnreadCount((count) => count + 1)
    }
    const onPresence = ({ userIds }) => setOnlineUsers(new Set(userIds))
    const onOnline = ({ userId }) => setOnlineUsers((current) => new Set([...current, userId]))
    const onOffline = ({ userId }) => setOnlineUsers((current) => {
      const next = new Set(current)
      next.delete(userId)
      return next
    })

    connection.on('connect', onConnect)
    connection.on('notification:unreadCount', onUnread)
    connection.on('notification:new', onNotification)
    connection.on('notification:allRead', () => setUnreadCount(0))
    connection.on('presence:list', onPresence)
    connection.on('userOnline', onOnline)
    connection.on('userOffline', onOffline)

    if (connection.connected) onConnect()

    return () => {
      connection.off('connect', onConnect)
      connection.off('notification:unreadCount', onUnread)
      connection.off('notification:new', onNotification)
      connection.off('presence:list', onPresence)
      connection.off('userOnline', onOnline)
      connection.off('userOffline', onOffline)
      disconnectSocket()
      setSocket(null)
    }
  }, [isAuthenticated, isDemo])

  const value = useMemo(() => ({
    socket,
    unreadCount,
    setUnreadCount,
    latestNotification,
    onlineUsers
  }), [socket, unreadCount, latestNotification, onlineUsers])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used inside SocketProvider')
  return context
}
