import { supabase } from '@/lib/supabase'

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
  status: string
  paymentStatus: string
  totalAmount: number
  createdAt: string
  itemCount: number
}

export interface OrderDetail {
  orderNo: string
  status: string
  paymentMethod: string
  paymentStatus: string
  shippingMethod: string
  shippingFee: number
  subTotal: number
  discountAmount: number
  pointDiscount: number
  totalAmount: number
  recipientName: string
  recipientPhone: string
  shippingAddress: string | null
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
  imageUrl: string | null
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
  async createOrder(data: CreateOrderRequest) {
    const { data: result, error } = await supabase.functions.invoke('create-order', {
      body: {
        shipping_address_id: data.shippingAddressId,
        shipping_method_id: data.shippingMethodId,
        recipient_name: data.recipientName,
        recipient_phone: data.recipientPhone,
        shipping_address: data.shippingAddress,
        store_id: data.storeId,
        points_to_redeem: data.pointsToRedeem || 0,
        note: data.note
      }
    })
    if (error) throw error
    if (!result.success) throw new Error(result.message)
    return { success: true, data: result.data }
  },

  async getOrders(params: { page?: number; pageSize?: number; status?: string } = {}) {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('orders')
      .select('order_no, status, payment_status, total_amount, created_at, items:order_items(id)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (params.status) {
      query = query.eq('status', params.status)
    }

    query = query.range(from, to)
    const { data, count, error } = await query
    if (error) throw error

    const items: OrderSummary[] = (data || []).map((o: any) => ({
      orderNo: o.order_no,
      status: o.status,
      paymentStatus: o.payment_status,
      totalAmount: o.total_amount,
      createdAt: o.created_at,
      itemCount: o.items?.length || 0
    }))

    return { success: true, data: { items, total: count || 0, page, pageSize } }
  },

  async getOrder(orderNo: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          id, product_id, variant_id, product_name, unit_price, quantity, subtotal,
          product:products(type, images:product_images(url, sort_order))
        )
      `)
      .eq('order_no', orderNo)
      .single()

    if (error) throw error

    const detail: OrderDetail = {
      orderNo: data.order_no,
      status: data.status,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      shippingMethod: data.shipping_method,
      shippingFee: data.shipping_fee,
      subTotal: data.sub_total,
      discountAmount: data.discount_amount,
      pointDiscount: data.point_discount,
      totalAmount: data.total_amount,
      recipientName: data.recipient_name,
      recipientPhone: data.recipient_phone,
      shippingAddress: data.shipping_address,
      storeId: data.store_id,
      trackingNo: data.tracking_no,
      note: data.note,
      createdAt: data.created_at,
      items: (data.items || []).map((item: any) => {
        const firstImage = item.product?.images
          ?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]
        return {
          productId: item.product_id,
          variantId: item.variant_id,
          productName: item.product_name,
          unitPrice: item.unit_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          imageUrl: firstImage?.url || null,
          isDigital: item.product?.type === 'digital'
        }
      })
    }

    return { success: true, data: detail }
  },

  async cancelOrder(orderNo: string) {
    const { data, error } = await supabase.functions.invoke('cancel-order', {
      body: { order_no: orderNo }
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message)
    return { success: true }
  },

  async returnOrder(orderNo: string) {
    const userId = (await supabase.auth.getUser()).data.user!.id
    const { error } = await supabase.rpc('return_order', {
      p_user_id: userId,
      p_order_no: orderNo
    })
    if (error) throw error
    return { success: true }
  },

  async getDownloads(orderNo: string) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('order_no', orderNo)
      .single()
    if (orderError) throw orderError

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_name')
      .eq('order_id', order.id)
    if (itemsError) throw itemsError

    const itemIds = (items || []).map(i => i.id)
    if (itemIds.length === 0) {
      return { success: true, data: [] }
    }

    const { data: downloads, error: dlError } = await supabase
      .from('digital_downloads')
      .select('*')
      .in('order_item_id', itemIds)
    if (dlError) throw dlError

    const itemNameMap = new Map((items || []).map(i => [i.id, i.product_name]))

    const links: DownloadLink[] = (downloads || []).map(d => ({
      token: d.token,
      downloadCount: d.download_count,
      maxDownloads: d.max_downloads,
      expiresAt: d.expires_at,
      isRevoked: d.is_revoked,
      productName: itemNameMap.get(d.order_item_id) || ''
    }))

    return { success: true, data: links }
  }
}
