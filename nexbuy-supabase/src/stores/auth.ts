import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { authApi, type LoginRequest, type RegisterRequest } from '@/api/auth'
import type { Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const profile = ref<any>(null)
  const adminToken = ref<string | null>(localStorage.getItem('adminToken'))
  const adminUser = ref<any>(JSON.parse(localStorage.getItem('adminUser') || 'null'))
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!session.value || !!adminToken.value)
  const isAdmin = computed(() => !!adminToken.value && !!adminUser.value)
  const accessToken = computed(() => adminToken.value || session.value?.access_token || null)

  const user = computed(() => {
    if (adminUser.value) return adminUser.value
    if (profile.value) return {
      id: profile.value.id,
      email: profile.value.email,
      name: profile.value.name,
      phone: profile.value.phone,
      preferredLocale: profile.value.preferred_locale,
      pointBalance: profile.value.point_balance
    }
    return null
  })

  // Initialize: listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, sess) => {
    session.value = sess
    if (sess) {
      await fetchProfile()
    } else {
      profile.value = null
    }
    initialized.value = true
  })

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single()
    if (!error && data) {
      profile.value = data
    }
  }

  async function login(data: LoginRequest) {
    const result = await authApi.login(data)
    await mergeGuestCart()
    return result
  }

  async function register(data: RegisterRequest) {
    const result = await authApi.register(data)
    await mergeGuestCart()
    return result
  }

  async function adminLogin(data: LoginRequest) {
    const result = await authApi.adminLogin(data)
    adminToken.value = result.accessToken
    adminUser.value = result.user
    localStorage.setItem('adminToken', result.accessToken)
    localStorage.setItem('adminUser', JSON.stringify(result.user))
    return result
  }

  async function logout() {
    if (adminToken.value) {
      adminToken.value = null
      adminUser.value = null
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    } else {
      await authApi.logout()
    }
    profile.value = null
  }

  async function mergeGuestCart() {
    const guestCart = localStorage.getItem('guestCart')
    if (guestCart) {
      try {
        const items = JSON.parse(guestCart)
        if (items.length > 0) {
          await supabase.functions.invoke('manage-cart', {
            body: { action: 'merge', items }
          })
        }
      } catch { /* ignore merge errors */ }
      localStorage.removeItem('guestCart')
    }
  }

  return {
    session,
    profile,
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    initialized,
    login,
    register,
    adminLogin,
    logout,
    fetchProfile
  }
})
