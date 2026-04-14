import { supabase } from '@/lib/supabase'

export interface ProductListParams {
  page?: number
  pageSize?: number
  sort?: string
  categoryId?: number
  search?: string
  lang?: string
}

export interface ProductListItem {
  id: string
  name: string
  price: number
  imageUrl: string | null
  type: string
  stock: number
  categorySlug: string | null
}

export interface ProductDetail {
  id: string
  sku: string
  type: string
  price: number
  stock: number
  maxDownloads?: number
  downloadExpiryHours?: number
  status: string
  categoryId: number
  translations: { locale: string; name: string; description: string | null }[]
  images: { id: string; url: string; sortOrder: number }[]
  variants: { id: string; variantName: string; priceAdjustment: number; stock: number; sku: string | null }[]
}

export interface Category {
  id: number
  slug: string
  sortOrder: number
  parentId: number | null
  name: string
  children: Category[]
}

function buildCategoryTree(categories: any[], locale: string): Category[] {
  const roots = categories.filter(c => !c.parent_id)
  const childrenMap = new Map<number, any[]>()
  categories.forEach(c => {
    if (c.parent_id) {
      const siblings = childrenMap.get(c.parent_id) || []
      siblings.push(c)
      childrenMap.set(c.parent_id, siblings)
    }
  })

  function mapCategory(c: any): Category {
    const children = (childrenMap.get(c.id) || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map(mapCategory)
    return {
      id: c.id,
      slug: c.slug,
      sortOrder: c.sort_order,
      parentId: c.parent_id,
      name: c.slug, // slug as fallback name
      children
    }
  }

  return roots.sort((a, b) => a.sort_order - b.sort_order).map(mapCategory)
}

export const productsApi = {
  async getProducts(params: ProductListParams = {}) {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const locale = params.lang || localStorage.getItem('locale') || 'zh-TW'
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('products')
      .select(`
        id, sku, type, price, stock, created_at,
        category:categories(id, slug),
        translations:product_translations(locale, name, description),
        images:product_images(id, url, sort_order)
      `, { count: 'exact' })
      .eq('status', 'active')

    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId)
    }

    // Sorting
    switch (params.sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    query = query.range(from, to)
    const { data, count, error } = await query
    if (error) throw error

    const items: ProductListItem[] = (data || []).map((p: any) => {
      const translation = p.translations?.find((t: any) => t.locale === locale)
        || p.translations?.[0]
      const firstImage = p.images
        ?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]

      return {
        id: p.id,
        name: translation?.name || '',
        price: p.price,
        imageUrl: firstImage?.url || null,
        type: p.type,
        stock: p.stock,
        categorySlug: p.category?.slug || null
      }
    })

    return {
      success: true,
      data: { items, total: count || 0, page, pageSize }
    }
  },

  async getProduct(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, sku, type, price, stock, max_downloads, download_expiry_hours, status, category_id,
        translations:product_translations(locale, name, description),
        images:product_images(id, url, sort_order),
        variants:product_variants(id, variant_name, price_adjustment, stock, sku)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    const detail: ProductDetail = {
      id: data.id,
      sku: data.sku,
      type: data.type,
      price: data.price,
      stock: data.stock,
      maxDownloads: data.max_downloads ?? undefined,
      downloadExpiryHours: data.download_expiry_hours ?? undefined,
      status: data.status,
      categoryId: data.category_id,
      translations: (data.translations || []).map((t: any) => ({
        locale: t.locale,
        name: t.name,
        description: t.description
      })),
      images: (data.images || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((i: any) => ({
          id: i.id,
          url: i.url,
          sortOrder: i.sort_order
        })),
      variants: (data.variants || []).map((v: any) => ({
        id: v.id,
        variantName: v.variant_name,
        priceAdjustment: v.price_adjustment,
        stock: v.stock,
        sku: v.sku
      }))
    }

    return { success: true, data: detail }
  },

  async searchProducts(params: { q: string; page?: number; pageSize?: number }) {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const locale = localStorage.getItem('locale') || 'zh-TW'
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Search in product_translations, then join back to products
    const { data: translationMatches, error: searchError } = await supabase
      .from('product_translations')
      .select('product_id')
      .eq('locale', locale)
      .or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`)

    if (searchError) throw searchError

    const productIds = [...new Set((translationMatches || []).map(t => t.product_id))]
    if (productIds.length === 0) {
      return { success: true, data: { items: [], total: 0, page, pageSize } }
    }

    const { data, count, error } = await supabase
      .from('products')
      .select(`
        id, sku, type, price, stock, created_at,
        category:categories(slug),
        translations:product_translations(locale, name, description),
        images:product_images(id, url, sort_order)
      `, { count: 'exact' })
      .eq('status', 'active')
      .in('id', productIds)
      .range(from, to)

    if (error) throw error

    const items: ProductListItem[] = (data || []).map((p: any) => {
      const translation = p.translations?.find((t: any) => t.locale === locale) || p.translations?.[0]
      const firstImage = p.images?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]
      return {
        id: p.id,
        name: translation?.name || '',
        price: p.price,
        imageUrl: firstImage?.url || null,
        type: p.type,
        stock: p.stock,
        categorySlug: p.category?.slug || null
      }
    })

    return { success: true, data: { items, total: count || 0, page, pageSize } }
  },

  async getCategories() {
    const locale = localStorage.getItem('locale') || 'zh-TW'
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, parent_id, sort_order')
      .order('sort_order')

    if (error) throw error
    return { success: true, data: buildCategoryTree(data || [], locale) }
  },

  async getCategoryProducts(categoryId: number, params: ProductListParams = {}) {
    return this.getProducts({ ...params, categoryId })
  }
}
