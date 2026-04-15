import { supabase } from '@/lib/supabase'

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  productName: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  subtotal: number
  stock: number
  type: string
}

export interface Cart {
  items: CartItem[]
  subTotal: number
  discountAmount: number
  total: number
  couponCode?: string
}

export const cartApi = {
  async getCart(): Promise<{ success: boolean; data: Cart }> {
    const locale = localStorage.getItem('locale') || 'zh-TW'

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id, product_id, variant_id, quantity, coupon_code,
        product:products(
          id, price, type, stock,
          translations:product_translations(locale, name),
          images:product_images(url, sort_order),
          variants:product_variants(id, variant_name, price_adjustment, stock)
        )
      `)

    if (error) throw error

    let couponCode: string | null = null
    const items: CartItem[] = (data || []).map((item: any) => {
      if (item.coupon_code) couponCode = item.coupon_code

      const product = item.product
      const translation = product?.translations?.find((t: any) => t.locale === locale)
        || product?.translations?.[0]
      const firstImage = product?.images
        ?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]

      let unitPrice = product?.price || 0
      let stock = product?.stock || 0
      let productName = translation?.name || ''

      if (item.variant_id) {
        const variant = product?.variants?.find((v: any) => v.id === item.variant_id)
        if (variant) {
          unitPrice += variant.price_adjustment
          stock = variant.stock
          productName += ` - ${variant.variant_name}`
        }
      }

      return {
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id || undefined,
        productName,
        imageUrl: firstImage?.url || null,
        unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice * item.quantity,
        stock,
        type: product?.type || 'physical'
      }
    })

    const subTotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    // Coupon discount calculation happens server-side via Edge Function
    return {
      success: true,
      data: {
        items,
        subTotal,
        discountAmount: 0,
        total: subTotal,
        couponCode: couponCode || undefined
      }
    }
  },

  async addItem(data: { productId: string; variantId?: string; quantity: number }) {
    const { data: result, error } = await supabase.functions.invoke('manage-cart', {
      body: { action: 'add', ...data }
    })
    if (error) throw error
    if (!result.success) throw new Error(result.message)
    return result
  },

  async updateItem(id: string, quantity: number) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)

    if (error) throw error
    return { success: true }
  },

  async removeItem(id: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  },

  async mergeCart(items: { productId: string; variantId?: string; quantity: number }[]) {
    const { data, error } = await supabase.functions.invoke('manage-cart', {
      body: { action: 'merge', items }
    })
    if (error) throw error
    return data
  },

  async applyCoupon(code: string) {
    const { data, error } = await supabase.functions.invoke('manage-cart', {
      body: { action: 'apply-coupon', code }
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message)
    return data
  },

  async removeCoupon() {
    const { data, error } = await supabase.functions.invoke('manage-cart', {
      body: { action: 'remove-coupon' }
    })
    if (error) throw error
    return data
  }
}
