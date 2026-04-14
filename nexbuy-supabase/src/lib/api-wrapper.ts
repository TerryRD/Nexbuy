import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'

interface ApiResponse<T> {
  success: boolean
  data: T | null
  message?: string
  errorCode?: string
}

interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function wrapResponse<T>(response: PostgrestSingleResponse<T>): ApiResponse<T> {
  if (response.error) {
    return {
      success: false,
      data: null,
      message: response.error.message,
      errorCode: response.error.code
    }
  }
  return { success: true, data: response.data }
}

export function wrapListResponse<T>(
  response: PostgrestResponse<T>,
  page: number,
  pageSize: number
): ApiResponse<PagedResult<T>> {
  if (response.error) {
    return {
      success: false,
      data: null,
      message: response.error.message,
      errorCode: response.error.code
    }
  }
  return {
    success: true,
    data: {
      items: response.data ?? [],
      total: response.count ?? 0,
      page,
      pageSize
    }
  }
}

export async function wrapEdgeFn<T>(
  promise: Promise<{ data: { success: boolean; data: T; message?: string; errorCode?: string } | null; error: any }>
): Promise<ApiResponse<T>> {
  const { data, error } = await promise
  if (error) {
    return { success: false, data: null, message: error.message }
  }
  if (data) {
    return data as ApiResponse<T>
  }
  return { success: false, data: null, message: 'Unknown error' }
}
