import { DEMO_POSTS } from '../data/demoData'

const POSTS_KEY = 'ttm_demo_post_overrides'
const DELETED_KEY = 'ttm_demo_deleted_posts'

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback
  } catch {
    return fallback
  }
}

export function getDemoPosts() {
  const overrides = readJson(POSTS_KEY, [])
  const deleted = new Set(readJson(DELETED_KEY, []))
  const posts = new Map(DEMO_POSTS.map((post) => [post.id, structuredClone(post)]))

  overrides.forEach((post) => posts.set(post.id, post))

  return [...posts.values()]
    .filter((post) => !deleted.has(post.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getStoredDemoPost(postId) {
  return getDemoPosts().find((post) => post.id === postId)
}

export function upsertDemoPost(post) {
  const overrides = readJson(POSTS_KEY, []).filter((item) => item.id !== post.id)
  localStorage.setItem(POSTS_KEY, JSON.stringify([post, ...overrides]))
  return post
}

export function deleteDemoPost(postId) {
  const deleted = new Set(readJson(DELETED_KEY, []))
  deleted.add(postId)
  localStorage.setItem(DELETED_KEY, JSON.stringify([...deleted]))
}
