import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { ok, fail } from '../_shared/response.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') return fail('Method not allowed', 405)

  try {
    const { email, password } = await req.json()
    if (!email || !password) return fail('Email and password required')

    const supabase = createServiceClient()

    // Fetch admin by email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single()

    if (error || !admin) return fail('Invalid credentials', 401)

    // Verify password
    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) return fail('Invalid credentials', 401)

    // Generate JWT
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET')!
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // 1 hour

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const payload = btoa(JSON.stringify({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      iat: now,
      exp
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${header}.${payload}`)
    )

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const accessToken = `${header}.${payload}.${signature}`

    return ok({
      accessToken,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })
  } catch (err) {
    return fail(err.message || 'Internal error', 500)
  }
})
