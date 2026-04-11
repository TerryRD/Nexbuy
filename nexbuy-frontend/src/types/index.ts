export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errorCode?: string
}

export type OrderStatus = 0 | 1 | 2 | 3 | 4 | 5
export type PaymentStatus = 0 | 1 | 2 | 3
export type ProductType = 0 | 1
export type CouponType = 0 | 1
export type PointType = 0 | 1 | 2 | 3
export type AddressType = 0 | 1
export type ShippingMethodType = 0 | 1 | 2

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  0: 'statusPending',
  1: 'statusPaid',
  2: 'statusProcessing',
  3: 'statusShipped',
  4: 'statusCompleted',
  5: 'statusCancelled'
}

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, string> = {
  0: 'paymentUnpaid',
  1: 'paymentPaid',
  2: 'paymentRefunding',
  3: 'paymentRefunded'
}

export const POINT_TYPE_MAP: Record<PointType, string> = {
  0: 'pointEarn',
  1: 'pointRedeem',
  2: 'pointExpire',
  3: 'pointAdjust'
}
