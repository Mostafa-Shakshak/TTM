import { ArrowLeft, ImagePlus, LoaderCircle, MoreHorizontal, Reply, Send, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Avatar from '../common/Avatar'
import EmptyState from '../common/EmptyState'
import MessageBubble from './MessageBubble'
import GroupSettingsModal from './GroupSettingsModal'
import { chatService } from '../../services/chat.service'
import { messagesService } from '../../services/messages.service'
import { uploadsService } from '../../services/uploads.service'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errors'

export default function ConversationView({ conversationId, currentUser, onBack, onRemoved, onConversationUpdate }) {
  const { socket, onlineUsers } = useSocket()
  const { showToast } = useToast()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [image, setImage] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const imageInput = useRef(null)
  const bottomRef = useRef(null)

  const otherUser = useMemo(() => chat?.conversation?.find((member) => member.userId !== currentUser.id)?.user, [chat, currentUser.id])
  const identity = chat?.type === 'Group' ? { name: chat.name || 'Group', profileImage: chat.image } : otherUser

  const load = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    try {
      const [chatData, messageData] = await Promise.all([
        chatService.getById(conversationId),
        messagesService.getAll(conversationId)
      ])
      setChat(chatData); setMessages(messageData)
      messageData.filter((message) => message.senderId !== currentUser.id).forEach((message) => socket?.emit('messageSeen', { messageId: message.id }))
    } catch (error) { showToast(getErrorMessage(error), 'error') } finally { setLoading(false) }
  }, [conversationId, currentUser.id, showToast, socket])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!socket || !conversationId) return undefined
    socket.emit('joinConversation', conversationId)
    const onNew = (message) => { if (message.convId === conversationId) { setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]); if (message.senderId !== currentUser.id) socket.emit('messageSeen', { messageId: message.id }); onConversationUpdate?.() } }
    const onEdit = (message) => setMessages((current) => current.map((item) => item.id === message.id ? message : item))
    const onDelete = ({ messageId }) => setMessages((current) => current.filter((item) => item.id !== messageId))
    const onTyping = ({ userId, conversationId: id }) => { if (id === conversationId) setTypingUsers((current) => new Set([...current, userId])) }
    const onStop = ({ userId, conversationId: id }) => { if (id === conversationId) setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next }) }
    const onReceipt = (receipt) => setMessages((current) => current.map((message) => message.id === receipt.messageId ? { ...message, reciept: message.reciept?.map((item) => item.id === receipt.id ? receipt : item) } : message))
    socket.on('newMessage', onNew); socket.on('messageEdited', onEdit); socket.on('messageDeleted', onDelete); socket.on('typing', onTyping); socket.on('stopTyping', onStop); socket.on('messageSeen', onReceipt); socket.on('messageDelivered', onReceipt)
    return () => { socket.emit('leaveConversation', conversationId); socket.off('newMessage', onNew); socket.off('messageEdited', onEdit); socket.off('messageDeleted', onDelete); socket.off('typing', onTyping); socket.off('stopTyping', onStop); socket.off('messageSeen', onReceipt); socket.off('messageDelivered', onReceipt) }
  }, [socket, conversationId, currentUser.id, onConversationUpdate])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typingUsers])

  async function uploadImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setSending(true)
    try { setImage(await uploadsService.upload(file, 'chat')) } catch (error) { showToast(getErrorMessage(error), 'error') } finally { setSending(false); event.target.value = '' }
  }

  async function send(event) {
    event.preventDefault()
    if (!content.trim() && !image) return
    setSending(true)
    const payload = { content: content.trim() || undefined, image: image || undefined, conversationId, replyToId: replyTo?.id }
    try {
      if (socket?.connected) socket.emit('sendMessage', payload)
      else { const message = await messagesService.send(conversationId, payload); setMessages((current) => [...current, message]) }
      setContent(''); setImage(''); setReplyTo(null); socket?.emit('stopTyping', { conversationId })
    } catch (error) { showToast(getErrorMessage(error), 'error') } finally { setSending(false) }
  }

  function editMessage(id, nextContent) { if (socket?.connected) socket.emit('editMessage', { messageId: id, content: nextContent }); else messagesService.update(id, nextContent).then((message) => setMessages((current) => current.map((item) => item.id === id ? message : item))) }
  function deleteMessage(id) { if (socket?.connected) socket.emit('deleteMessage', id); else messagesService.remove(id).then(() => setMessages((current) => current.filter((item) => item.id !== id))) }

  if (!conversationId) return <div className="conversation-empty"><EmptyState icon={Send} title="Choose a conversation" text="Pick someone from your inbox or start a new conversation." /></div>
  if (loading) return <div className="conversation-empty"><LoaderCircle className="spin" size={28} /></div>

  return <section className="conversation-view"><header><button className="icon-button conversation-view__back" onClick={onBack}><ArrowLeft size={20} /></button><Avatar user={identity} size="md" /><div><strong>{identity?.name || 'Conversation'}</strong><small>{chat?.type === 'Private' && otherUser ? (onlineUsers.has(otherUser.id) ? 'Online' : `@${otherUser.username}`) : `${chat?.conversation?.length || 0} members`}</small></div><button className="icon-button" onClick={() => setSettingsOpen(true)}><MoreHorizontal size={20} /></button></header><div className="message-list">{messages.map((message) => <MessageBubble key={message.id} message={message} own={message.senderId === currentUser.id} onEdit={editMessage} onDelete={deleteMessage} onReply={setReplyTo} />)}{typingUsers.size > 0 && <div className="typing-indicator"><span /><span /><span /></div>}<div ref={bottomRef} /></div>{replyTo && <div className="message-compose__reply"><Reply size={15} /><span>Replying to {replyTo.sender?.name}: {replyTo.content || 'Image'}</span><button onClick={() => setReplyTo(null)}><X size={15} /></button></div>}{image && <div className="message-compose__image"><img src={image} alt="Ready to send" /><button onClick={() => setImage('')}><X size={15} /></button></div>}<form className="message-compose" onSubmit={send}><input type="file" accept="image/*" ref={imageInput} onChange={uploadImage} hidden /><button type="button" onClick={() => imageInput.current?.click()}><ImagePlus size={20} /></button><input value={content} onChange={(event) => { setContent(event.target.value); socket?.emit(event.target.value ? 'typing' : 'stopTyping', { conversationId }) }} placeholder="Write a message…" /><button className="message-compose__send" disabled={sending || (!content.trim() && !image)}>{sending ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}</button></form><GroupSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} chat={chat} currentUserId={currentUser.id} onChanged={load} onRemoved={onRemoved} /></section>
}
