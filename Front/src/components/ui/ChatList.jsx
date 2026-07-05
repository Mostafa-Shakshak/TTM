import { Archive, LoaderCircle, Plus, RotateCcw, Search } from 'lucide-react'
import Avatar from '../common/Avatar'
import { timeAgo } from '../../utils/formatters'

function chatIdentity(item, currentUserId) {
  const chat = item.conversation
  if (chat.type === 'Group') {
    return { name: chat.name || 'Untitled group', profileImage: chat.image }
  }
  return chat.conversation.find((member) => member.userId !== currentUserId)?.user || { name: 'Conversation' }
}

export default function ChatList({
  chats,
  messageResults = [],
  currentUserId,
  activeId,
  unreadByConversation = {},
  search,
  onSearch,
  onSelect,
  onCreateGroup,
  archived,
  onToggleArchived,
  onUnarchive,
  unarchivingId
}) {
  const formatUnread = (count) => (count > 99 ? '99+' : count)

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
          const busy = unarchivingId === item.conversation.id
          const unreadCount = unreadByConversation[item.conversation.id] || 0
          return <article
            key={item.conversation.id}
            className={`chat-list__item ${activeId === item.conversation.id ? 'is-active' : ''}`}
            onClick={() => onSelect(item.conversation.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(item.conversation.id)
              }
            }}
            role="button"
            tabIndex={0}
          ><Avatar user={identity} size="md" className="chat-list__avatar" /><span><strong>{identity.name}</strong><small>{last?.content || (last?.image ? 'Sent an image' : 'Start the conversation')}</small></span><div className="chat-list__meta">{unreadCount > 0 && !archived && <i className="chat-list__badge">{formatUnread(unreadCount)}</i>}{last && <time>{timeAgo(last.createdAt)}</time>}{archived && <button className="chat-list__restore" onClick={(event) => { event.stopPropagation(); onUnarchive?.(item.conversation.id) }} onKeyDown={(event) => event.stopPropagation()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={13} /> : <RotateCcw size={13} />}<span>Unarchive</span></button>}</div></article>
        })}
      </div>
    </aside>
  )
}
