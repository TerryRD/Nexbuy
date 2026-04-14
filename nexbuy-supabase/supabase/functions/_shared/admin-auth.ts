import { createServiceClient } from './supabase-client.ts'

interface AdminPayload {
  sub: string
  email: string
  role: string
}

export async function verifyAdmin(req: Request): Promise<AdminPayload> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET')
  if (!jwtSecret) throw new Error('JWT secret not configured')

  const [headerB64, payloadB64] = token.split('.')
  if (!headerB64 || !payloadB64) throw new Error('Invalid token format')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signatureB64 = token.split('.')[2]
  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0)
  )

  const valid = await crypto.subtle.verify('HMAC', key, signature, data)
  if (!valid) throw new Error('Invalid token signature')

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as AdminPayload & { exp: number }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }

  if (payload.role !== 'admin' && payload.role !== 'super_admin') {
    throw new Error('Insufficient permissions')
  }

  return { sub: payload.sub, email: payload.email, role: payload.role }
}

export async function getUserFromRequest(req: Request): Promise<{ id: string; email: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const supabase = createServiceClient()
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('Invalid or expired token')
  }

  return { id: user.id, email: user.email! }
}
