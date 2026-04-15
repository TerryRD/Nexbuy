import client from './client'

export interface UserProfile {
  id: string
  email: string
  name: string
  phone: string
  preferredLocale: string
  pointBalance: number
  status: number
  createdAt: string
}

export interface Address {
  id: string
  label: string
  recipientName: string
  phone: string
  addressType: number
  zipCode?: string
  city?: string
  address?: string
  storeId?: string
  storeName?: string
  isDefault: boolean
}

export interface PointHistory {
  id: string
  type: number
  amount: number
  expiresAt?: string
  note?: string
  createdAt: string
  orderNo?: string
}

export interface WishlistItem {
  productId: string
  name: string
  price: number
  imageUrl: string
  createdAt: string
}

export const membersApi = {
  getProfile: () => client.get('/members/me'),
  updateProfile: (data: { name?: string; phone?: string; preferredLocale?: string }) => client.put('/members/me', data),
  getAddresses: () => client.get('/members/me/addresses'),
  createAddress: (data: Omit<Address, 'id'>) => client.post('/members/me/addresses', data),
  updateAddress: (id: string, data: Partial<Address>) => client.put(`/members/me/addresses/${id}`, data),
  deleteAddress: (id: string) => client.delete(`/members/me/addresses/${id}`),
  getPoints: (params?: { page?: number; pageSize?: number }) => client.get('/members/me/points', { params }),
  getWishlist: () => client.get('/members/me/wishlist'),
  addToWishlist: (productId: string) => client.post(`/members/me/wishlist/${productId}`),
  removeFromWishlist: (productId: string) => client.delete(`/members/me/wishlist/${productId}`)
}
