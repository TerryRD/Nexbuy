import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  const locale = localStorage.getItem('locale') || 'zh-TW'
  config.headers['Accept-Language'] = locale
  return config
})

client.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && data.success !== undefined) {
      if (!data.success) {
        return Promise.reject({ response: { data } })
      }
      return data
    }
    return data
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const auth = useAuthStore()
      try {
        await auth.refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`
        return client(originalRequest)
      } catch {
        auth.logout()
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default client
