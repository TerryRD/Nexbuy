import client from './client'

export interface CreateOrderRequest {
  shippingAddressId?: string
  shippingMethodId: number
  recipientName: string
  recipientPhone: string
  shippingAddress?: string
  storeId?: string
  pointsToRedeem?: number
  note?: string
}

export interface OrderSummary {
  orderNo: string
  status: number
  paymentStatus: number
  totalAmount: number
  createdAt: string
  itemCount: number
}

export interface OrderDetail {
  orderNo: string
  status: number
  paymentMethod: number
  paymentStatus: number
  shippingMethod: number
  shippingFee: number
  subTotal: number
  discountAmount: number
  pointDiscount: number
  totalAmount: number
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  storeId?: string
  trackingNo?: string
  note?: string
  createdAt: string
  items: OrderItem[]
}

export interface OrderItem {
  productId: string
  variantId?: string
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
  imageUrl: string
  isDigital: boolean
}

export interface DownloadLink {
  token: string
  downloadCount: number
  maxDownloads: number
  expiresAt: string
  isRevoked: boolean
  productName: string
}

export const ordersApi = {
  createOrder: (data: CreateOrderRequest) => client.post('/orders', data),
  getOrders: (params?: { page?: number; pageSize?: number; status?: number }) => client.get('/orders', { params }),
  getOrder: (orderNo: string) => client.get(`/orders/${orderNo}`),
  cancelOrder: (orderNo: string) => client.post(`/orders/${orderNo}/cancel`),
  returnOrder: (orderNo: string) => client.post(`/orders/${orderNo}/return`),
  getDownloads: (orderNo: string) => client.get(`/orders/${orderNo}/downloads`)
}
