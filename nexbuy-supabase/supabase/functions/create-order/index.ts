import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { ok, fail } from '../_shared/response.ts'
import { getUserFromRequest } from '../_shared/admin-auth.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') return fail('Method not allowed', 405)

  try {
    const user = await getUserFromRequest(req)
    const body = await req.json()

    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('create_order', {
      p_user_id: user.id,
      p_shipping_address_id: body.shipping_address_id || null,
      p_shipping_method_id: body.shipping_method_id || null,
      p_recipient_name: body.recipient_name || '',
      p_recipient_phone: body.recipient_phone || '',
      p_shipping_address: body.shipping_address || null,
      p_store_id: body.store_id || null,
      p_points_to_redeem: body.points_to_redeem || 0,
      p_note: body.note || null
    })

    if (error) {
      // Extract custom error code from PostgreSQL exception
      const message = error.message || 'Order creation failed'
      return fail(message, 400, message)
    }

    return ok(data)
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('token') ? 401 : 500)
  }
})
