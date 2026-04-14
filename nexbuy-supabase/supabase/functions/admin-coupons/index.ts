import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { ok, fail } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/admin-auth.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    await verifyAdmin(req)
    const body = await req.json()
    const supabase = createServiceClient()

    switch (body.action) {
      case 'list': {
        const page = body.page || 1
        const pageSize = body.pageSize || 20
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, count, error } = await supabase
          .from('coupons')
          .select('*', { count: 'exact' })
          .order('id', { ascending: false })
          .range(from, to)

        if (error) return fail(error.message)
        return ok({ items: data, total: count, page, pageSize })
      }

      case 'create': {
        const { data, error } = await supabase
          .from('coupons')
          .insert({
            code: body.code,
            type: body.type || 'fixed_amount',
            value: body.value,
            min_order_amount: body.minOrderAmount || 0,
            usage_limit: body.usageLimit || null,
            start_at: body.startAt || new Date().toISOString(),
            expired_at: body.expiredAt || new Date(Date.now() + 30 * 86400000).toISOString(),
            status: body.status || 'active'
          })
          .select()
          .single()

        if (error) return fail(error.message)
        return ok(data)
      }

      case 'update': {
        const updates: any = {}
        if (body.code !== undefined) updates.code = body.code
        if (body.type !== undefined) updates.type = body.type
        if (body.value !== undefined) updates.value = body.value
        if (body.minOrderAmount !== undefined) updates.min_order_amount = body.minOrderAmount
        if (body.usageLimit !== undefined) updates.usage_limit = body.usageLimit
        if (body.startAt !== undefined) updates.start_at = body.startAt
        if (body.expiredAt !== undefined) updates.expired_at = body.expiredAt
        if (body.status !== undefined) updates.status = body.status

        const { error } = await supabase
          .from('coupons')
          .update(updates)
          .eq('id', body.id)

        if (error) return fail(error.message)
        return ok({ message: 'Coupon updated' })
      }

      case 'update-status': {
        const { error } = await supabase
          .from('coupons')
          .update({ status: body.status })
          .eq('id', body.id)

        if (error) return fail(error.message)
        return ok({ message: 'Status updated' })
      }

      default:
        return fail('Invalid action')
    }
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('permission') ? 403 : 500)
  }
})
