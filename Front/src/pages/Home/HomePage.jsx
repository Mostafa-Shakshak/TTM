import { MessageSquareText, RefreshCw, Search, Sparkles, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/common/Avatar'
import Composer from '../../components/ui/Composer'
import PostCard from '../../components/ui/PostCard'
import EmptyState from '../../components/common/EmptyState'
import { FeedSkeleton } from '../../components/common/Loading'
import { useAuth } from '../../context/AuthContext'
import { DEMO_PROFILES } from '../../data/demoData'
import { postsService } from '../../services/posts.service'
import { usersService } from '../../services/users.service'
import { getErrorMessage } from '../../utils/errors'
import { getDemoPosts } from '../../utils/demoStore'

export default function HomePage() {
  const { isDemo } = useAuth()
  const [searchParams] = useSearchParams()
  const isDiscover = searchParams.get('view') === 'discover'
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [searchPosts, setSearchPosts] = useState([])
  const [search, setSearch] = useState('')
  const [searchTab, setSearchTab] = useState('people')
  const [isLoading, setIsLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const loadPosts = useCallback(async () => {
    setIsLoading(true); setError('')
    try { setPosts(isDemo ? getDemoPosts() : await postsService.getAll()) }
    catch (loadError) { setError(getErrorMessage(loadError, 'The feed could not be loaded.')) }
    finally { setIsLoading(false) }
  }, [isDemo])

  useEffect(() => { loadPosts() }, [loadPosts])

  useEffect(() => {
    const addPost = (event) => setPosts((current) => [event.detail, ...current])
    window.addEventListener('ttm:post-created', addPost)
    return () => window.removeEventListener('ttm:post-created', addPost)
  }, [])

  useEffect(() => {
    if (!isDiscover || !search.trim()) { setUsers([]); setSearchPosts([]); return undefined }
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        if (isDemo) {
          const value = search.toLowerCase()
          setUsers(DEMO_PROFILES.filter((profile) => profile.name.toLowerCase().includes(value) || profile.username.toLowerCase().includes(value)))
          setSearchPosts(getDemoPosts().filter((post) => post.content?.toLowerCase().includes(value)))
        } else {
          const [people, foundPosts] = await Promise.all([usersService.search(search), postsService.search(search)])
          setUsers(people); setSearchPosts(foundPosts)
        }
      } catch (searchError) { setError(getErrorMessage(searchError, 'Search failed.')) }
      finally { setSearching(false) }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [isDiscover, isDemo, search])

  const visiblePosts = isDiscover ? searchPosts : posts

  return <div className="feed-page page-column">
    <header className="page-heading"><div><span className="eyebrow">{isDiscover ? 'A little farther out' : 'Your conversations'}</span><h1>{isDiscover ? 'Discover' : 'Good morning.'}</h1><p>{isDiscover ? 'Find people and conversations worth a detour.' : 'What’s moving through your world today?'}</p></div><span className="page-heading__mark"><Sparkles size={20} /></span></header>
    {!isDiscover && <Composer />}
    {isDiscover && <section className="discover-search"><div className="discover-search__field"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search TTM" autoFocus /></div><div className="discover-search__tabs"><button className={searchTab === 'people' ? 'is-active' : ''} onClick={() => setSearchTab('people')}><Users size={16} />People</button><button className={searchTab === 'posts' ? 'is-active' : ''} onClick={() => setSearchTab('posts')}><MessageSquareText size={16} />Posts</button></div></section>}
    {!isDiscover && <div className="feed-filter"><button className="is-active">For you</button><span /></div>}
    {(isLoading || searching) ? <FeedSkeleton /> : error ? <EmptyState icon={RefreshCw} title="The conversation paused" text={error} action={<button className="button button--secondary" onClick={loadPosts}>Try again</button>} /> : isDiscover && !search.trim() ? <EmptyState icon={Search} title="Find your next conversation" text="Search by name, username, or words inside a post." /> : isDiscover && searchTab === 'people' ? <div className="people-results">{users.length ? users.map((profile) => <Link to={`/profile/${profile.id}`} className="people-result" key={profile.id}><Avatar user={profile} size="md" /><span><strong>{profile.name}</strong><small>@{profile.username}</small><p>{profile.bio}</p></span></Link>) : <EmptyState icon={Users} title="No people found" text="Try a different name or username." />}</div> : visiblePosts.length === 0 ? <EmptyState icon={MessageSquareText} title={isDiscover ? 'No posts found' : 'It’s quiet here—for now'} text={isDiscover ? 'Try another search phrase.' : 'Be the first to start a conversation.'} /> : <div className="feed-list">{visiblePosts.map((post) => <PostCard post={post} key={post.id} onDeleted={(id) => setPosts((current) => current.filter((item) => item.id !== id))} onUpdated={(updated) => setPosts((current) => current.map((item) => item.id === updated.id ? updated : item))} />)}</div>}
  </div>
}
