import { supabase } from '@/lib/supabase'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
  preferredLocale?: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  phone: string | null
  preferredLocale: string
  pointBalance: number
}

export const authApi = {
  async login(data: LoginRequest) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })
    if (error) throw error
    return authData
  },

  async register(data: RegisterRequest) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone || null,
          preferred_locale: data.preferredLocale || 'zh-TW'
        }
      }
    })
    if (error) throw error
    return authData
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  },

  async resetPassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async adminLogin(data: LoginRequest) {
    const { data: result, error } = await supabase.functions.invoke('admin-auth', {
      body: { email: data.email, password: data.password }
    })
    if (error) throw error
    if (!result.success) throw new Error(result.message || 'Login failed')
    return result.data
  }
}
