import axios from 'axios'

export const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5555'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 12000
})

let refreshPromise = null

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ttm_access_token')
  if (token && token !== 'demo-session') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config
    const isAuthRequest = request?.url?.includes('/auth/login') ||
      request?.url?.includes('/auth/refresh') ||
      request?.url?.includes('/auth/forgot-password') ||
      request?.url?.includes('/auth/reset-password')

    if (
      error.response?.status === 401 &&
      !request?._retry &&
      !isAuthRequest
    ) {
      const refreshToken = localStorage.getItem('ttm_refresh_token')

      if (refreshToken) {
        request._retry = true

        try {
          if (!refreshPromise) {
            refreshPromise = axios.post(
              `${API_URL}/auth/refresh`,
              { refreshToken }
            ).finally(() => {
              refreshPromise = null
            })
          }

          const { data } = await refreshPromise
          localStorage.setItem('ttm_access_token', data.accessToken)
          localStorage.setItem('ttm_refresh_token', data.refreshToken)
          request.headers.Authorization = `Bearer ${data.accessToken}`
          return api(request)
        } catch {
          window.dispatchEvent(new CustomEvent('ttm:unauthorized'))
        }
      } else {
        window.dispatchEvent(new CustomEvent('ttm:unauthorized'))
      }
    }

    return Promise.reject(error)
  }
)

export default api
