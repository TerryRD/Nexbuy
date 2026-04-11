import client from './client'

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
  imageUrl: string
  type: number
  stock: number
  categorySlug: string
}

export interface ProductDetail {
  id: string
  sku: string
  type: number
  price: number
  stock: number
  maxDownloads?: number
  downloadExpiryHours?: number
  status: number
  categoryId: number
  translations: { locale: string; name: string; description: string }[]
  images: { id: string; url: string; sortOrder: number }[]
  variants: { id: string; variantName: string; priceAdjustment: number; stock: number; sku: string }[]
}

export interface Category {
  id: number
  slug: string
  sortOrder: number
  name: string
  children: Category[]
}

export const productsApi = {
  getProducts: (params?: ProductListParams) => client.get('/products', { params }),
  getProduct: (id: string) => client.get(`/products/${id}`),
  searchProducts: (params: { q: string; page?: number; pageSize?: number }) => client.get('/products/search', { params }),
  getCategories: () => client.get('/categories'),
  getCategoryProducts: (id: number, params?: ProductListParams) => client.get(`/categories/${id}/products`, { params })
}
