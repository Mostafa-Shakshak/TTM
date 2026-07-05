import api from './api'

export const uploadsService = {
  async upload(file, type) {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post(`/uploads/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data.imageUrl
  }
}
