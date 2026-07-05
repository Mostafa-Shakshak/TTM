import api from './api'

export const commentsService = {
  async create(payload) {
    const { data } = await api.post('/comments', payload)
    return data.comment
  },

  async update(commentId, payload) {
    const { data } = await api.patch(`/comments/${commentId}`, payload)
    return data.comment
  },

  async remove(commentId) {
    const { data } = await api.delete(`/comments/${commentId}`)
    return data
  }
}
