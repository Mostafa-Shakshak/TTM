import api from './api'

export const notificationsService = {
  async getAll(page = 1, limit = 20) {
    const { data } = await api.get('/notifications', {
      params: { page, limit }
    })
    return data
  },

  async unreadCount() {
    const { data } = await api.get('/notifications/unread-count')
    return data.count
  },

  async markRead(id) {
    const { data } = await api.patch(`/notifications/${id}/read`)
    return data.notification
  },

  async markAllRead() {
    const { data } = await api.patch('/notifications/read-all')
    return data
  }
}
