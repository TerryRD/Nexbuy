import { corsHeaders } from './cors.ts'

interface ApiResponse<T> {
  success: boolean
  data?: T | null
  message?: string
  errorCode?: string
}

export function ok<T>(data: T): Response {
  const body: ApiResponse<T> = { success: true, data }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function fail(message: string, status = 400, errorCode?: string): Response {
  const body: ApiResponse<null> = { success: false, data: null, message, errorCode }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function fileResponse(data: Uint8Array, filename: string, contentType: string): Response {
  return new Response(data, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
