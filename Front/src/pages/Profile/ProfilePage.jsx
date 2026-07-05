import { ArrowLeft, Ban, Grid3X3, LockKeyhole, MessageCircle, MessageSquareText, MoreHorizontal, Settings, ShieldOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/common/Avatar'
import EmptyState from '../../components/common/EmptyState'
import { PageLoader } from '../../components/common/Loading'
import EditProfileModal from '../../components/ui/EditProfileModal'
import FollowButton from '../../components/ui/FollowButton'
import PostCard from '../../components/ui/PostCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getDemoProfile } from '../../data/demoData'
import { chatService } from '../../services/chat.service'
import { followService } from '../../services/follow.service'
import { usersService } from '../../services/users.service'
import { getErrorMessage } from '../../utils/errors'
import { formatCount, normalizeStatus } from '../../utils/formatters'
import { getDemoPosts } from '../../utils/demoStore'

export default function ProfilePage() {
  const { id } = useParams()
  const { user, isDemo } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const profileId = id || user.id
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [follow, setFollow] = useState(null)
  const [privateBlocked, setPrivateBlocked] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwner = profileId === user.id

  const loadProfile = useCallback(async () => {
    setIsLoading(true); setError(''); setPrivateBlocked(false)
    try {
      const userProfile = isDemo ? getDemoProfile(profileId) : await usersService.getProfile(profileId)
      if (!userProfile) throw new Error('User Not Found')
      setProfile(userProfile)

      let relationship = null
      if (!isOwner && !isDemo && !userProfile.blockedByMe) {
        relationship = await followService.getStatus(profileId)
        setFollow(relationship)
      }

      const status = normalizeStatus(relationship?.status)
      if (userProfile.blockedByMe) {
        setPrivateBlocked(true); setPosts([])
      } else if (userProfile.isPrivate && !isOwner && status !== 'following' && !isDemo) {
        setPrivateBlocked(true); setPosts([])
      } else if (userProfile.isPrivate && !isOwner && isDemo) {
        setPrivateBlocked(true); setPosts([])
      } else {
        setPosts(isDemo ? getDemoPosts().filter((post) => post.authorId === profileId) : await usersService.getPosts(profileId))
      }
    } catch (loadError) {
      const message = getErrorMessage(loadError, loadError.message || 'This profile could not be loaded.')
      if (message.toLowerCase().includes('private')) setPrivateBlocked(true)
      else setError(message)
    } finally { setIsLoading(false) }
  }, [isDemo, isOwner, profileId])

  useEffect(() => { loadProfile() }, [loadProfile])

  async function startMessage() {
    try {
      const chat = await chatService.createPrivate(profile.id)
      navigate(`/messages/${chat.id}`)
    } catch (messageError) { showToast(getErrorMessage(messageError), 'error') }
  }

  async function toggleBlock() {
    try {
      if (profile.blockedByMe) await usersService.unblock(profile.id)
      else await usersService.block(profile.id)
      showToast(profile.blockedByMe ? 'User unblocked.' : 'User blocked.')
      setProfile((current) => ({ ...current, blockedByMe: !current.blockedByMe }))
      setPosts([]); setPrivateBlocked(!profile.blockedByMe); setMenuOpen(false)
    } catch (blockError) { showToast(getErrorMessage(blockError), 'error') }
  }

  if (isLoading) return <PageLoader label="Opening profile" />
  if (error || !profile) return <div className="page-column"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button><EmptyState icon={MessageSquareText} title="Profile unavailable" text={error || 'We could not find this person.'} /></div>

  const followStatus = normalizeStatus(follow?.status)

  return <div className="profile-page page-column">
    <div className="profile-topbar"><button className="icon-button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button><span><strong>{profile.name}</strong><small>{formatCount(profile._count?.post)} posts</small></span></div>
    <section className="profile-hero"><div className="profile-cover">{profile.coverImage ? <img src={profile.coverImage} alt="" /> : <div className="profile-cover__fallback" />}</div><div className="profile-hero__body"><div className="profile-hero__actions"><Avatar user={profile} size="xl" className="profile-avatar" /><div>{isOwner ? <><button className="button button--secondary" onClick={() => setEditOpen(true)}>Edit profile</button><button className="icon-button profile-more" onClick={() => navigate('/settings')} aria-label="Account settings"><Settings size={19} /></button></> : <>{!profile.blockedByMe && <button className="button button--secondary" onClick={startMessage}><MessageCircle size={17} />Message</button>}<FollowButton profileId={profile.id} isPrivate={profile.isPrivate} initialFollow={follow} onChange={(status, nextFollow) => { setFollow(nextFollow); if (status === 'following') { setPrivateBlocked(false); usersService.getPosts(profile.id).then(setPosts).catch(() => {}) } }} disabled={profile.blockedByMe} /><div className="profile-menu"><button className="icon-button profile-more" onClick={() => setMenuOpen((value) => !value)} aria-label="More profile actions"><MoreHorizontal size={20} /></button>{menuOpen && <div className="context-menu"><button className="danger" onClick={toggleBlock}>{profile.blockedByMe ? <ShieldOff size={16} /> : <Ban size={16} />}{profile.blockedByMe ? 'Unblock user' : 'Block user'}</button></div>}</div></>}</div></div><div className="profile-copy"><h1>{profile.name}</h1><span>@{profile.username}</span><p>{profile.bio || 'This person is still writing their introduction.'}</p>{profile.isPrivate && <small className="private-badge"><LockKeyhole size={13} /> Private account</small>}</div><div className="profile-stats"><span><strong>{formatCount(profile._count?.post)}</strong> posts</span><span><strong>{formatCount(profile._count?.followers)}</strong> followers</span><span><strong>{formatCount(profile._count?.following)}</strong> following</span></div></div></section>
    <div className="profile-tabs"><button className="is-active"><Grid3X3 size={17} /> Conversations</button></div>
    {privateBlocked ? <EmptyState icon={profile.blockedByMe ? Ban : LockKeyhole} title={profile.blockedByMe ? 'You blocked this account' : 'This account is private'} text={profile.blockedByMe ? 'Unblock this person to see their profile and conversations.' : followStatus === 'pending' ? 'Your request is waiting for approval.' : 'Follow this account to see their conversations.'} /> : posts.length === 0 ? <EmptyState icon={MessageSquareText} title="No posts yet" text={isOwner ? 'Your first conversation can start right here.' : 'Nothing has been shared here yet.'} /> : <div className="feed-list profile-feed">{posts.map((post) => <PostCard post={post} key={post.id} onDeleted={(postId) => setPosts((current) => current.filter((item) => item.id !== postId))} />)}</div>}
    {isOwner && <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} onSaved={setProfile} />}
  </div>
}
