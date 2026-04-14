import { supabase } from '@/lib/supabase'

function getAdminHeaders() {
  const token = localStorage.getItem('adminToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function invokeAdmin(fnName: string, body: any) {
  const { data, error } = await supabase.functions.invoke(fnName, {
    body,
    headers: getAdminHeaders()
  })
  if (error) throw error
  if (data && !data.success) throw new Error(data.message || 'Operation failed')
  return data
}

export const adminProductsApi = {
  getProducts: (params?: any) => invokeAdmin('admin-products', { action: 'list', ...params }),
  createProduct: (data: any) => invokeAdmin('admin-products', { action: 'create', ...data }),
  updateProduct: (id: string, data: any) => invokeAdmin('admin-products', { action: 'update', id, ...data }),
  deleteProduct: (id: string) => invokeAdmin('admin-products', { action: 'delete', id }),

  async uploadImage(id: string, formData: FormData) {
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const token = localStorage.getItem('adminToken')
    const { data, error } = await supabase.functions.invoke('admin-products', {
      body: formData,
      headers: {
        ...getAdminHeaders(),
        'x-action': 'upload-image',
        'x-product-id': id
      }
    })
    if (error) throw error
    return data
  },

  deleteImage: (productId: string, imageId: string) =>
    invokeAdmin('admin-products', { action: 'delete-image', productId, imageId }),

  getCategories: () => invokeAdmin('admin-products', { action: 'list-categories' }),
  createCategory: (data: any) => invokeAdmin('admin-products', { action: 'create-category', ...data }),
  updateCategory: (id: number, data: any) => invokeAdmin('admin-products', { action: 'update-category', id, ...data }),
  deleteCategory: (id: number) => invokeAdmin('admin-products', { action: 'delete-category', id })
}

export const adminOrdersApi = {
  getOrders: (params?: any) => invokeAdmin('admin-orders', { action: 'list', ...params }),
  getOrder: (orderNo: string) => invokeAdmin('admin-orders', { action: 'detail', orderNo }),
  updateStatus: (orderNo: string, status: string) =>
    invokeAdmin('admin-orders', { action: 'update-status', orderNo, status }),
  updateTracking: (orderNo: string, trackingNo: string) =>
    invokeAdmin('admin-orders', { action: 'update-tracking', orderNo, trackingNo }),
  async exportOrders(params?: any) {
    const data = await invokeAdmin('admin-orders', { action: 'export', ...params })
    return data
  }
}

export const adminMembersApi = {
  getMembers: (params?: any) => invokeAdmin('admin-members', { action: 'list', ...params }),
  getMember: (id: string) => invokeAdmin('admin-members', { action: 'detail', id }),
  updateStatus: (id: string, status: string) =>
    invokeAdmin('admin-members', { action: 'update-status', id, status }),
  adjustPoints: (id: string, data: { amount: number; note: string }) =>
    invokeAdmin('admin-members', { action: 'adjust-points', id, ...data }),
  async exportMembers() {
    return invokeAdmin('admin-members', { action: 'export' })
  }
}

export const adminCouponsApi = {
  getCoupons: (params?: any) => invokeAdmin('admin-coupons', { action: 'list', ...params }),
  createCoupon: (data: any) => invokeAdmin('admin-coupons', { action: 'create', ...data }),
  updateCoupon: (id: number, data: any) => invokeAdmin('admin-coupons', { action: 'update', id, ...data }),
  updateStatus: (id: number, status: string) =>
    invokeAdmin('admin-coupons', { action: 'update-status', id, status })
}

export const adminPointsApi = {
  getRules: () => invokeAdmin('admin-points', { action: 'get-rules' }),
  updateRules: (data: any) => invokeAdmin('admin-points', { action: 'update-rules', ...data })
}

export const adminReportsApi = {
  getSales: (params: { startDate: string; endDate: string }) =>
    invokeAdmin('admin-reports', { action: 'sales', ...params }),
  getTopProducts: (params: { startDate: string; endDate: string }) =>
    invokeAdmin('admin-reports', { action: 'top-products', ...params }),
  getOrderTrend: (params: { startDate: string; endDate: string }) =>
    invokeAdmin('admin-reports', { action: 'order-trend', ...params }),
  exportSales: (params: { startDate: string; endDate: string }) =>
    invokeAdmin('admin-reports', { action: 'export-sales', ...params })
}
