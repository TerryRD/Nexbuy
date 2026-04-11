import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type LoginRequest, type RegisterRequest } from '@/api/auth'
import { cartApi } from '@/api/cart'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => {
    if (!accessToken.value) return false
    try {
      const payload = JSON.parse(atob(accessToken.value.split('.')[1]))
      return payload.role === 'Admin' || payload.role === 'SuperAdmin'
    } catch { return false }
  })

  function setAuth(data: { accessToken: string; refreshToken: string; user: any }) {
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    user.value = data.user
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  async function login(data: LoginRequest) {
    const res = await authApi.login(data)
    setAuth(res.data)
    await mergeGuestCart()
    return res
  }

  async function register(data: RegisterRequest) {
    const res = await authApi.register(data)
    setAuth(res.data)
    await mergeGuestCart()
    return res
  }

  async function adminLogin(data: LoginRequest) {
    const res = await authApi.adminLogin(data)
    setAuth(res.data)
    return res
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) throw new Error('No refresh token')
    const res = await authApi.refresh(refreshToken.value)
    setAuth(res.data)
  }

  function logout() {
    try { authApi.logout() } catch {}
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  async function mergeGuestCart() {
    const guestCart = localStorage.getItem('guestCart')
    if (guestCart) {
      try {
        const items = JSON.parse(guestCart)
        if (items.length > 0) {
          await cartApi.mergeCart(items)
        }
      } catch {}
      localStorage.removeItem('guestCart')
    }
  }

  return { accessToken, refreshToken, user, isAuthenticated, isAdmin, login, register, adminLogin, refreshAccessToken, logout, setAuth }
})
