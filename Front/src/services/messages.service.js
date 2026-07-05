import api from './api'

export const messagesService = {
  async getAll(conversationId) {
    const { data } = await api.get(`/messages/${conversationId}`)
    return data.messages
  },

  async send(conversationId, payload) {
    const { data } = await api.post(`/messages/${conversationId}`, payload)
    return data.data
  },

  async update(messageId, content) {
    const { data } = await api.patch(`/messages/${messageId}`, { content })
    return data.data
  },

  async remove(messageId) {
    const { data } = await api.delete(`/messages/${messageId}`)
    return data.data
  },

  async search(query) {
    const { data } = await api.get('/messages/search', { params: { q: query } })
    return data.messages
  }
}
