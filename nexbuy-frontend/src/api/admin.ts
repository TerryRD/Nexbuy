import client from './client'

export const adminProductsApi = {
  getProducts: (params?: any) => client.get('/admin/products', { params }),
  createProduct: (data: any) => client.post('/admin/products', data),
  updateProduct: (id: string, data: any) => client.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => client.delete(`/admin/products/${id}`),
  uploadImage: (id: string, formData: FormData) => client.post(`/admin/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (id: string, imageId: string) => client.delete(`/admin/products/${id}/images/${imageId}`),
  getCategories: () => client.get('/admin/categories'),
  createCategory: (data: any) => client.post('/admin/categories', data),
  updateCategory: (id: number, data: any) => client.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => client.delete(`/admin/categories/${id}`)
}

export const adminOrdersApi = {
  getOrders: (params?: any) => client.get('/admin/orders', { params }),
  getOrder: (orderNo: string) => client.get(`/admin/orders/${orderNo}`),
  updateStatus: (orderNo: string, status: number) => client.put(`/admin/orders/${orderNo}/status`, { status }),
  updateTracking: (orderNo: string, trackingNo: string) => client.put(`/admin/orders/${orderNo}/tracking`, { trackingNo }),
  exportOrders: (params?: any) => client.get('/admin/orders/export', { params, responseType: 'blob' })
}

export const adminMembersApi = {
  getMembers: (params?: any) => client.get('/admin/members', { params }),
  getMember: (id: string) => client.get(`/admin/members/${id}`),
  updateStatus: (id: string, status: number) => client.put(`/admin/members/${id}/status`, { status }),
  adjustPoints: (id: string, data: { amount: number; note: string }) => client.post(`/admin/members/${id}/points`, data),
  exportMembers: () => client.get('/admin/members/export', { responseType: 'blob' })
}

export const adminCouponsApi = {
  getCoupons: (params?: any) => client.get('/admin/coupons', { params }),
  createCoupon: (data: any) => client.post('/admin/coupons', data),
  updateCoupon: (id: number, data: any) => client.put(`/admin/coupons/${id}`, data),
  updateStatus: (id: number, status: number) => client.put(`/admin/coupons/${id}/status`, { status })
}

export const adminPointsApi = {
  getRules: () => client.get('/admin/points/rules'),
  updateRules: (data: any) => client.put('/admin/points/rules', data)
}

export const adminReportsApi = {
  getSales: (params: { startDate: string; endDate: string }) => client.get('/admin/reports/sales', { params }),
  getTopProducts: (params: { startDate: string; endDate: string }) => client.get('/admin/reports/products/top', { params }),
  getOrderTrend: (params: { startDate: string; endDate: string }) => client.get('/admin/reports/orders/trend', { params }),
  exportSales: (params: { startDate: string; endDate: string }) => client.get('/admin/reports/sales/export', { params, responseType: 'blob' })
}
