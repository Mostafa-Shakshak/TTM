import api from './api'

export const usersService = {
  async getProfile(userId) {
    const { data } = await api.get(`/users/${userId}`)
    return data.user
  },

  async getPosts(userId) {
    const { data } = await api.get(`/users/${userId}/posts`)
    return data.posts
  },

  async search(query) {
    const { data } = await api.get('/users/search', {
      params: { q: query }
    })
    return data.users
  },

  async updateProfile(payload) {
    const { data } = await api.patch('/users/profile', payload)
    return data.user
  },

  async block(userId) {
    const { data } = await api.post(`/users/${userId}/block`)
    return data.block
  },

  async unblock(userId) {
    const { data } = await api.delete(`/users/${userId}/block`)
    return data
  }
}
