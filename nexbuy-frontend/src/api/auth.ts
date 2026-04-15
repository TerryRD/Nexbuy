import client from './client'

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

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: {
    id: string
    email: string
    name: string
    phone: string
    preferredLocale: string
    pointBalance: number
  }
}

export const authApi = {
  login: (data: LoginRequest) => client.post<any, { data: LoginResponse }>('/auth/login', data),
  register: (data: RegisterRequest) => client.post<any, { data: LoginResponse }>('/auth/register', data),
  refresh: (refreshToken: string) => client.post<any, { data: LoginResponse }>('/auth/refresh', { refreshToken }),
  logout: () => client.post('/auth/logout'),
  forgotPassword: (email: string) => client.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => client.post('/auth/reset-password', { token, newPassword }),
  adminLogin: (data: LoginRequest) => client.post<any, { data: LoginResponse }>('/admin/auth/login', data)
}
