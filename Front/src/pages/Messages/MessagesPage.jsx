import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ChatList from '../../components/ui/ChatList'
import ConversationView from '../../components/ui/ConversationView'
import CreateGroupModal from '../../components/ui/CreateGroupModal'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'
import { chatService } from '../../services/chat.service'
import { messagesService } from '../../services/messages.service'
import { getErrorMessage } from '../../utils/errors'

export default function MessagesPage() {
  const { conversationId } = useParams()
  const { user, isDemo } = useAuth()
  const { refreshMessageUnreadCount, messageUnreadByConversation } = useSocket()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [chatBuckets, setChatBuckets] = useState({ inbox: [], archived: [] })
  const [search, setSearch] = useState('')
  const [searchChats, setSearchChats] = useState([])
  const [messageResults, setMessageResults] = useState([])
  const [archived, setArchived] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [unarchivingId, setUnarchivingId] = useState('')

  const activeBucket = archived ? 'archived' : 'inbox'
  const chats = search.trim() ? searchChats : chatBuckets[activeBucket]

  const loadChats = useCallback(async (targetArchived = archived) => {
    if (isDemo) {
      setChatBuckets({ inbox: [], archived: [] })
      return []
    }
    try {
      const nextChats = await chatService.getAll(targetArchived)
      setChatBuckets((current) => ({
        ...current,
        [targetArchived ? 'archived' : 'inbox']: nextChats
      }))
      return nextChats
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      return []
    }
  }, [archived, isDemo, showToast])

  useEffect(() => { loadChats(archived) }, [archived, loadChats])

  async function handleSearch(value) {
    setSearch(value)
    if (!value.trim()) {
      setSearchChats([])
      setMessageResults([])
      return
    }
    try {
      const [chatResults, foundMessages] = await Promise.all([chatService.search(value), messagesService.search(value)])
      setSearchChats(chatResults); setMessageResults(foundMessages)
    } catch (error) { showToast(getErrorMessage(error), 'error') }
  }

  async function handleUnarchive(targetConversationId) {
    const restoredChat = chatBuckets.archived.find((item) => item.conversation.id === targetConversationId)
    setUnarchivingId(targetConversationId)
    try {
      await chatService.unarchive(targetConversationId)
      setChatBuckets((current) => ({
        archived: current.archived.filter((item) => item.conversation.id !== targetConversationId),
        inbox: restoredChat && !current.inbox.some((item) => item.conversation.id === targetConversationId)
          ? [restoredChat, ...current.inbox]
          : current.inbox
      }))
      setSearchChats((current) => current.filter((item) => item.conversation.id !== targetConversationId))
      if (conversationId === targetConversationId) setArchived(false)
      refreshMessageUnreadCount()
      showToast('Conversation moved back to your inbox.')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setUnarchivingId('')
    }
  }

  return <div className={`messages-page ${conversationId ? 'messages-page--open' : ''}`}><ChatList chats={chats} messageResults={messageResults} currentUserId={user.id} activeId={conversationId} unreadByConversation={messageUnreadByConversation} search={search} onSearch={handleSearch} onSelect={(id) => navigate(`/messages/${id}`)} onCreateGroup={() => setGroupOpen(true)} archived={archived} onToggleArchived={() => setArchived((value) => !value)} onUnarchive={handleUnarchive} unarchivingId={unarchivingId} /><ConversationView conversationId={conversationId} currentUser={user} onBack={() => navigate('/messages')} onRemoved={() => { navigate('/messages'); loadChats(archived); refreshMessageUnreadCount() }} onConversationUpdate={() => { loadChats(archived); refreshMessageUnreadCount() }} /><CreateGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} onCreated={(group) => { loadChats(false); navigate(`/messages/${group.id}`) }} /></div>
}
