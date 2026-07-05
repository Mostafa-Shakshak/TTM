import api from './api'

export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    return data
  },

  async signup(payload) {
    const { data } = await api.post('/auth/signup', payload)
    return data
  },

  async logout() {
    const { data } = await api.post('/auth/logout')
    return data
  },

  async logoutAll() {
    const { data } = await api.post('/auth/logout-all')
    return data
  },

  async changePassword(payload) {
    const { data } = await api.patch('/auth/change-password', payload)
    return data
  },

  async requestReset(email) {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(payload) {
    const { data } = await api.post('/auth/reset-password', payload)
    return data
  }
}
