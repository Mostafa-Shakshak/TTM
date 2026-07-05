import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ChatList from '../../components/ui/ChatList'
import ConversationView from '../../components/ui/ConversationView'
import CreateGroupModal from '../../components/ui/CreateGroupModal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { chatService } from '../../services/chat.service'
import { messagesService } from '../../services/messages.service'
import { getErrorMessage } from '../../utils/errors'

export default function MessagesPage() {
  const { conversationId } = useParams()
  const { user, isDemo } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [search, setSearch] = useState('')
  const [messageResults, setMessageResults] = useState([])
  const [archived, setArchived] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)

  const loadChats = useCallback(async () => {
    if (isDemo) { setChats([]); return }
    try { setChats(await chatService.getAll(archived)) } catch (error) { showToast(getErrorMessage(error), 'error') }
  }, [archived, isDemo, showToast])

  useEffect(() => { loadChats() }, [loadChats])

  async function handleSearch(value) {
    setSearch(value)
    if (!value.trim()) { setMessageResults([]); loadChats(); return }
    try {
      const [chatResults, foundMessages] = await Promise.all([chatService.search(value), messagesService.search(value)])
      setChats(chatResults); setMessageResults(foundMessages)
    } catch (error) { showToast(getErrorMessage(error), 'error') }
  }

  return <div className={`messages-page ${conversationId ? 'messages-page--open' : ''}`}><ChatList chats={chats} messageResults={messageResults} currentUserId={user.id} activeId={conversationId} search={search} onSearch={handleSearch} onSelect={(id) => navigate(`/messages/${id}`)} onCreateGroup={() => setGroupOpen(true)} archived={archived} onToggleArchived={() => setArchived((value) => !value)} /><ConversationView conversationId={conversationId} currentUser={user} onBack={() => navigate('/messages')} onRemoved={() => { navigate('/messages'); loadChats() }} onConversationUpdate={loadChats} /><CreateGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} onCreated={(group) => { loadChats(); navigate(`/messages/${group.id}`) }} /></div>
}
