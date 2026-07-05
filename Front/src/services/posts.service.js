import api from './api'

export const postsService = {
  async getAll() {
    const { data } = await api.get('/posts')
    return data.posts
  },

  async getById(postId) {
    const { data } = await api.get(`/posts/${postId}`)
    return data.post
  },

  async search(query) {
    const { data } = await api.get('/posts/search', {
      params: { q: query }
    })
    return data.posts
  },

  async create(payload) {
    const { data } = await api.post('/posts', payload)
    return data.post
  },

  async update(postId, payload) {
    const { data } = await api.patch(`/posts/${postId}`, payload)
    return data.post
  },

  async remove(postId) {
    const { data } = await api.delete(`/posts/${postId}`)
    return data
  }
}
