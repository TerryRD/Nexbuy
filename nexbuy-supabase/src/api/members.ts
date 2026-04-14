import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  name: string
  phone: string | null
  preferredLocale: string
  pointBalance: number
  status: string
  createdAt: string
}

export interface Address {
  id: string
  label: string
  recipientName: string
  phone: string
  addressType: string
  zipCode?: string
  city?: string
  address?: string
  storeId?: string
  storeName?: string
  isDefault: boolean
}

export interface PointHistory {
  id: string
  type: string
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
  imageUrl: string | null
  createdAt: string
}

export const membersApi = {
  async getProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single()
    if (error) throw error

    return {
      success: true,
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        preferredLocale: data.preferred_locale,
        pointBalance: data.point_balance,
        status: data.status,
        createdAt: data.created_at
      } as UserProfile
    }
  },

  async updateProfile(updates: { name?: string; phone?: string; preferredLocale?: string }) {
    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.preferredLocale !== undefined) dbUpdates.preferred_locale = updates.preferredLocale

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', (await supabase.auth.getUser()).data.user!.id)

    if (error) throw error
    return { success: true }
  },

  async getAddresses() {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .order('is_default', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: (data || []).map(a => ({
        id: a.id,
        label: a.label,
        recipientName: a.recipient_name,
        phone: a.phone,
        addressType: a.address_type,
        zipCode: a.zip_code,
        city: a.city,
        address: a.address,
        storeId: a.store_id,
        storeName: a.store_name,
        isDefault: a.is_default
      })) as Address[]
    }
  },

  async createAddress(data: Omit<Address, 'id'>) {
    const userId = (await supabase.auth.getUser()).data.user!.id

    // If setting as default, unset existing defaults
    if (data.isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
    }

    const { data: result, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: userId,
        label: data.label,
        recipient_name: data.recipientName,
        phone: data.phone,
        address_type: data.addressType as 'regular' | 'convenience_store',
        zip_code: data.zipCode,
        city: data.city,
        address: data.address,
        store_id: data.storeId,
        store_name: data.storeName,
        is_default: data.isDefault
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data: result }
  },

  async updateAddress(id: string, data: Partial<Address>) {
    const userId = (await supabase.auth.getUser()).data.user!.id

    if (data.isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
    }

    const dbUpdates: any = {}
    if (data.label !== undefined) dbUpdates.label = data.label
    if (data.recipientName !== undefined) dbUpdates.recipient_name = data.recipientName
    if (data.phone !== undefined) dbUpdates.phone = data.phone
    if (data.addressType !== undefined) dbUpdates.address_type = data.addressType
    if (data.zipCode !== undefined) dbUpdates.zip_code = data.zipCode
    if (data.city !== undefined) dbUpdates.city = data.city
    if (data.address !== undefined) dbUpdates.address = data.address
    if (data.storeId !== undefined) dbUpdates.store_id = data.storeId
    if (data.storeName !== undefined) dbUpdates.store_name = data.storeName
    if (data.isDefault !== undefined) dbUpdates.is_default = data.isDefault

    const { error } = await supabase
      .from('user_addresses')
      .update(dbUpdates)
      .eq('id', id)

    if (error) throw error
    return { success: true }
  },

  async deleteAddress(id: string) {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  },

  async getPoints(params: { page?: number; pageSize?: number } = {}) {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await supabase
      .from('points')
      .select('*, order:orders(order_no)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const items: PointHistory[] = (data || []).map((p: any) => ({
      id: p.id,
      type: p.type,
      amount: p.amount,
      expiresAt: p.expires_at,
      note: p.note,
      createdAt: p.created_at,
      orderNo: p.order?.order_no
    }))

    return {
      success: true,
      data: { items, total: count || 0, page, pageSize }
    }
  },

  async getWishlist() {
    const locale = localStorage.getItem('locale') || 'zh-TW'

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        product_id, created_at,
        product:products(
          id, price,
          translations:product_translations(locale, name),
          images:product_images(url, sort_order)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const items: WishlistItem[] = (data || []).map((w: any) => {
      const translation = w.product?.translations?.find((t: any) => t.locale === locale)
        || w.product?.translations?.[0]
      const firstImage = w.product?.images
        ?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]

      return {
        productId: w.product_id,
        name: translation?.name || '',
        price: w.product?.price || 0,
        imageUrl: firstImage?.url || null,
        createdAt: w.created_at
      }
    })

    return { success: true, data: items }
  },

  async addToWishlist(productId: string) {
    const userId = (await supabase.auth.getUser()).data.user!.id
    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId, product_id: productId })

    if (error) throw error
    return { success: true }
  },

  async removeFromWishlist(productId: string) {
    const userId = (await supabase.auth.getUser()).data.user!.id
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
    return { success: true }
  }
}
