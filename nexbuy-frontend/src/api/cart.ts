import client from './client'

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  productName: string
  imageUrl: string
  unitPrice: number
  quantity: number
  subtotal: number
  stock: number
  type: number
}

export interface Cart {
  items: CartItem[]
  subTotal: number
  discountAmount: number
  total: number
  couponCode?: string
}

export const cartApi = {
  getCart: () => client.get('/cart'),
  addItem: (data: { productId: string; variantId?: string; quantity: number }) => client.post('/cart/items', data),
  updateItem: (id: string, quantity: number) => client.put(`/cart/items/${id}`, { quantity }),
  removeItem: (id: string) => client.delete(`/cart/items/${id}`),
  mergeCart: (items: { productId: string; variantId?: string; quantity: number }[]) => client.post('/cart/merge', { items }),
  applyCoupon: (code: string) => client.post('/cart/coupon', { code }),
  removeCoupon: () => client.delete('/cart/coupon')
}
