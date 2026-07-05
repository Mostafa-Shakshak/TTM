import { Archive, Plus, Search } from 'lucide-react'
import Avatar from '../common/Avatar'
import { timeAgo } from '../../utils/formatters'

function chatIdentity(item, currentUserId) {
  const chat = item.conversation
  if (chat.type === 'Group') {
    return { name: chat.name || 'Untitled group', profileImage: chat.image }
  }
  return chat.conversation.find((member) => member.userId !== currentUserId)?.user || { name: 'Conversation' }
}

export default function ChatList({ chats, messageResults = [], currentUserId, activeId, search, onSearch, onSelect, onCreateGroup, archived, onToggleArchived }) {
  return (
    <aside className="chat-list">
      <header><div><span className="eyebrow">Messages</span><h1>Talk</h1></div><button className="icon-button" onClick={onCreateGroup} aria-label="Create group"><Plus size={20} /></button></header>
      <div className="chat-list__search"><Search size={17} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search conversations" /></div>
      <button className={`chat-list__archive ${archived ? 'is-active' : ''}`} onClick={onToggleArchived}><Archive size={15} />{archived ? 'Back to inbox' : 'Archived conversations'}</button>
      <div className="chat-list__items">
        {messageResults.length > 0 && <div className="message-search-results"><strong>Messages</strong>{messageResults.map((message) => <button key={message.id} onClick={() => onSelect(message.convId)}><Search size={14} /><span><b>{message.sender?.name}</b><small>{message.content}</small></span></button>)}</div>}
        {chats.length === 0 && <p className="chat-list__empty">No conversations here yet.</p>}
        {chats.map((item) => {
          const identity = chatIdentity(item, currentUserId)
          const last = item.conversation.message?.[0]
          return <button key={item.conversation.id} className={`chat-list__item ${activeId === item.conversation.id ? 'is-active' : ''}`} onClick={() => onSelect(item.conversation.id)}><Avatar user={identity} size="md" /><span><strong>{identity.name}</strong><small>{last?.content || (last?.image ? 'Sent an image' : 'Start the conversation')}</small></span>{last && <time>{timeAgo(last.createdAt)}</time>}</button>
        })}
      </div>
    </aside>
  )
}
