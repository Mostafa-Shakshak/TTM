import api from './api'

export const likesService = {
  async like(postId) {
    const { data } = await api.post('/likes', { postId })
    return data.like
  },

  async unlike(likeId) {
    const { data } = await api.delete(`/likes/${likeId}`)
    return data
  }
}
