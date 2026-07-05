import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { connectSocket, disconnectSocket } from '../services/socket.service'
import { chatService } from '../services/chat.service'
import { messagesService } from '../services/messages.service'

const SocketContext = createContext(null)

function countUnreadMessages(messages, userId) {
  return messages.filter((message) =>
    message.senderId !== userId &&
    message.reciept?.some((receipt) => receipt.userId === userId && receipt.status !== 'Seen')
  ).length
}

function updateConversationUnread(current, conversationId, nextCount) {
  const next = { ...current }
  if (nextCount > 0) next[conversationId] = nextCount
  else delete next[conversationId]
  return next
}

export function SocketProvider({ children }) {
  const { isAuthenticated, isDemo, user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [messageUnreadByConversation, setMessageUnreadByConversation] = useState({})
  const [latestNotification, setLatestNotification] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  const refreshMessageUnreadCount = useCallback(async () => {
    if (!isAuthenticated || isDemo || !user?.id) {
      setMessageUnreadByConversation({})
      return
    }

    try {
      const chats = await chatService.getAll(false)
      const results = await Promise.allSettled(chats.map(async (item) => {
        const conversationId = item.conversation.id
        const messages = await messagesService.getAll(conversationId)
        return [conversationId, countUnreadMessages(messages, user.id)]
      }))

      const next = {}
      results.forEach((result) => {
        if (result.status !== 'fulfilled') return
        const [conversationId, count] = result.value
        if (count > 0) next[conversationId] = count
      })

      setMessageUnreadByConversation(next)
    } catch {
      setMessageUnreadByConversation({})
    }
  }, [isAuthenticated, isDemo, user?.id])

  const markConversationRead = useCallback((conversationId) => {
    if (!conversationId) return
    setMessageUnreadByConversation((current) => updateConversationUnread(current, conversationId, 0))
  }, [])

  useEffect(() => {
    if (!isAuthenticated || isDemo) {
      disconnectSocket()
      setSocket(null)
      setUnreadCount(0)
      setMessageUnreadByConversation({})
      setLatestNotification(null)
      setOnlineUsers(new Set())
      return undefined
    }

    const token = localStorage.getItem('ttm_access_token')
    const connection = connectSocket(token)
    setSocket(connection)

    const onConnect = () => {
      connection.emit('notification:getUnreadCount')
      refreshMessageUnreadCount()
    }
    const onUnread = ({ count }) => setUnreadCount(count)
    const onAllRead = () => setUnreadCount(0)
    const onNotification = (notification) => {
      setLatestNotification(notification)
      setUnreadCount((count) => count + 1)
    }
    const onConversationUpdated = ({ conversationId, message }) => {
      if (!conversationId || message?.senderId === user?.id) return
      const receipt = message?.reciept?.find((item) => item.userId === user?.id)
      if (!receipt || receipt.status === 'Seen') return
      setMessageUnreadByConversation((current) =>
        updateConversationUnread(current, conversationId, (current[conversationId] || 0) + 1)
      )
    }
    const onMessageSeen = (receipt) => {
      if (receipt.userId !== user?.id || receipt.status !== 'Seen') return
      const conversationId = receipt.message?.convId
      if (!conversationId) return
      setMessageUnreadByConversation((current) =>
        updateConversationUnread(current, conversationId, Math.max((current[conversationId] || 0) - 1, 0))
      )
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
    connection.on('notification:allRead', onAllRead)
    connection.on('notification:new', onNotification)
    connection.on('conversation:updated', onConversationUpdated)
    connection.on('messageSeen', onMessageSeen)
    connection.on('presence:list', onPresence)
    connection.on('userOnline', onOnline)
    connection.on('userOffline', onOffline)

    if (connection.connected) onConnect()

    return () => {
      connection.off('connect', onConnect)
      connection.off('notification:unreadCount', onUnread)
      connection.off('notification:allRead', onAllRead)
      connection.off('notification:new', onNotification)
      connection.off('conversation:updated', onConversationUpdated)
      connection.off('messageSeen', onMessageSeen)
      connection.off('presence:list', onPresence)
      connection.off('userOnline', onOnline)
      connection.off('userOffline', onOffline)
      disconnectSocket()
      setSocket(null)
    }
  }, [isAuthenticated, isDemo, refreshMessageUnreadCount, user?.id])

  const messageUnreadCount = useMemo(
    () => Object.keys(messageUnreadByConversation).length,
    [messageUnreadByConversation]
  )

  const value = useMemo(() => ({
    socket,
    unreadCount,
    setUnreadCount,
    messageUnreadCount,
    messageUnreadByConversation,
    markConversationRead,
    refreshMessageUnreadCount,
    latestNotification,
    onlineUsers
  }), [socket, unreadCount, messageUnreadCount, messageUnreadByConversation, markConversationRead, refreshMessageUnreadCount, latestNotification, onlineUsers])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used inside SocketProvider')
  return context
}
