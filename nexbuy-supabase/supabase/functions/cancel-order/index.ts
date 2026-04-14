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
    const { order_no } = await req.json()

    if (!order_no) return fail('Order number required')

    const supabase = createServiceClient()

    const { error } = await supabase.rpc('cancel_order', {
      p_user_id: user.id,
      p_order_no: order_no
    })

    if (error) return fail(error.message, 400)

    return ok({ message: 'Order cancelled successfully' })
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('token') ? 401 : 500)
  }
})
