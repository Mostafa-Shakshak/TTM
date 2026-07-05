import api from './api'

export const chatService = {
  async getAll(archived = false) {
    const { data } = await api.get('/chat', {
      params: { archived }
    })
    return data.chats
  },

  async getById(conversationId) {
    const { data } = await api.get(`/chat/${conversationId}`)
    return data.chat
  },

  async createPrivate(recieverId) {
    const { data } = await api.post('/chat/private', { recieverId })
    return data.chat
  },

  async createGroup(payload) {
    const { data } = await api.post('/chat/group', payload)
    return data.group
  },

  async update(conversationId, payload) {
    const { data } = await api.patch(`/chat/${conversationId}`, payload)
    return data.group
  },

  async addMembers(conversationId, members) {
    const { data } = await api.post(`/chat/${conversationId}/members`, { members })
    return data
  },

  async removeMember(conversationId, memberId) {
    const { data } = await api.patch(`/chat/${conversationId}/remove`, { memberId })
    return data
  },

  async leave(conversationId) {
    const { data } = await api.patch(`/chat/${conversationId}/leave`)
    return data
  },

  async promote(conversationId, memberId) {
    const { data } = await api.patch(`/chat/${conversationId}/promote`, { memberId })
    return data.member
  },

  async demote(conversationId, memberId) {
    const { data } = await api.patch(`/chat/${conversationId}/demote`, { memberId })
    return data.member
  },

  async remove(conversationId) {
    const { data } = await api.delete(`/chat/${conversationId}`)
    return data
  },

  async mute(conversationId, mutedUntil = null) {
    const { data } = await api.patch(`/chat/${conversationId}/mute`, { mutedUntil })
    return data.membership
  },

  async archive(conversationId, archived = true) {
    const { data } = await api.patch(`/chat/${conversationId}/archive`, { archived })
    return data.membership
  },

  async search(query) {
    const { data } = await api.get('/chat/search', { params: { q: query } })
    return data.chats
  }
}
