import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { ok, fail } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/admin-auth.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const admin = await verifyAdmin(req)
    const body = await req.json()
    const supabase = createServiceClient()

    switch (body.action) {
      case 'get-rules': {
        const { data, error } = await supabase
          .from('point_rules')
          .select('*')
          .limit(1)
          .single()

        if (error) {
          // Return defaults if no rules exist
          return ok({ earnRate: 0.01, redeemRate: 1.0, pointExpiryMonths: 12 })
        }

        return ok({
          earnRate: data.earn_rate,
          redeemRate: data.redeem_rate,
          pointExpiryMonths: data.point_expiry_months
        })
      }

      case 'update-rules': {
        const { data: existing } = await supabase
          .from('point_rules')
          .select('id')
          .limit(1)
          .single()

        if (existing) {
          const { error } = await supabase
            .from('point_rules')
            .update({
              earn_rate: body.earnRate,
              redeem_rate: body.redeemRate,
              point_expiry_months: body.pointExpiryMonths,
              updated_by: admin.sub
            })
            .eq('id', existing.id)

          if (error) return fail(error.message)
        } else {
          const { error } = await supabase
            .from('point_rules')
            .insert({
              earn_rate: body.earnRate,
              redeem_rate: body.redeemRate,
              point_expiry_months: body.pointExpiryMonths,
              updated_by: admin.sub
            })

          if (error) return fail(error.message)
        }

        return ok({ message: 'Point rules updated' })
      }

      default:
        return fail('Invalid action')
    }
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('permission') ? 403 : 500)
  }
})
