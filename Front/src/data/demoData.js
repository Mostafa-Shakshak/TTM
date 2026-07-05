const ago = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString()

export const DEMO_USER = {
  id: 'demo-user',
  name: 'Alex Morgan',
  username: 'alexm',
  email: 'alex@ttm.demo',
  bio: 'Product designer, weekend photographer, and enthusiastic collector of small good moments.',
  profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=85',
  coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
  isPrivate: false,
  _count: { post: 12, followers: 2480, following: 386 }
}

export const DEMO_PROFILES = [
  DEMO_USER,
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    username: 'mayamakes',
    bio: 'Ceramic artist. Slow mornings, good clay, better coffee. Brooklyn.',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=85',
    coverImage: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=85',
    isPrivate: false,
    _count: { post: 84, followers: 12700, following: 412 }
  },
  {
    id: 'jon-bell',
    name: 'Jon Bell',
    username: 'jonoutside',
    bio: 'Trail notes and field recordings from wherever the path goes.',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=85',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
    isPrivate: false,
    _count: { post: 38, followers: 5230, following: 178 }
  },
  {
    id: 'nora-lee',
    name: 'Nora Lee',
    username: 'norareads',
    bio: 'Books, marginalia, and the occasional very strong opinion.',
    profileImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=85',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=85',
    isPrivate: true,
    _count: { post: 29, followers: 912, following: 244 }
  }
]

const byId = Object.fromEntries(DEMO_PROFILES.map((profile) => [profile.id, profile]))

export const DEMO_POSTS = [
  {
    id: 'demo-post-1',
    content: 'A reminder from the studio today: the nicest things usually take one more patient pass than you think.',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=85',
    createdAt: ago(18),
    authorId: 'maya-chen',
    author: byId['maya-chen'],
    _count: { likes: 342, comments: 18 },
    comments: [
      {
        id: 'demo-comment-1',
        content: 'This is exactly what I needed to hear today.',
        authorId: 'demo-user',
        author: DEMO_USER,
        createdAt: ago(9)
      },
      {
        id: 'demo-comment-2',
        content: 'The glaze on that piece is unreal.',
        authorId: 'jon-bell',
        author: byId['jon-bell'],
        createdAt: ago(5)
      }
    ]
  },
  {
    id: 'demo-post-2',
    content: 'Took the long way home. Strongly recommend it.',
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85',
    createdAt: ago(64),
    authorId: 'jon-bell',
    author: byId['jon-bell'],
    _count: { likes: 189, comments: 11 },
    comments: [
      {
        id: 'demo-comment-3',
        content: 'Adding this trail to my list immediately.',
        authorId: 'maya-chen',
        author: byId['maya-chen'],
        createdAt: ago(40)
      }
    ]
  },
  {
    id: 'demo-post-3',
    content: 'We keep waiting for a big opening. Sometimes the invitation is just ten quiet minutes and a blank page.',
    image: null,
    createdAt: ago(190),
    authorId: 'demo-user',
    author: DEMO_USER,
    _count: { likes: 76, comments: 8 },
    comments: []
  },
  {
    id: 'demo-post-4',
    content: 'Current desk situation. Four books open, one cup going cold, zero regrets.',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=85',
    createdAt: ago(1440),
    authorId: 'nora-lee',
    author: byId['nora-lee'],
    _count: { likes: 521, comments: 32 },
    comments: []
  }
]

export const DEMO_REQUESTS = [
  {
    id: 'request-1',
    status: 'Pending',
    follower: {
      id: 'sam-rivera',
      name: 'Sam Rivera',
      username: 'samwanders',
      profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=85'
    },
    createdAt: ago(32)
  },
  {
    id: 'request-2',
    status: 'Pending',
    follower: {
      id: 'lina-park',
      name: 'Lina Park',
      username: 'linapark',
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=85'
    },
    createdAt: ago(210)
  }
]

export function getDemoProfile(id) {
  return DEMO_PROFILES.find((profile) => profile.id === id)
}

export function getDemoPost(id) {
  return DEMO_POSTS.find((post) => post.id === id)
}
