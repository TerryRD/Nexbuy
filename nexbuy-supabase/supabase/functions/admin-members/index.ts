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
      case 'list': {
        const page = body.page || 1
        const pageSize = body.pageSize || 20
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })

        if (body.search) {
          query = query.or(`email.ilike.%${body.search}%,name.ilike.%${body.search}%,phone.ilike.%${body.search}%`)
        }

        const { data, count, error } = await query.range(from, to)
        if (error) return fail(error.message)
        return ok({ items: data, total: count, page, pageSize })
      }

      case 'detail': {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', body.id)
          .single()
        if (error) return fail(error.message)
        return ok(data)
      }

      case 'update-status': {
        const { error } = await supabase
          .from('profiles')
          .update({ status: body.status })
          .eq('id', body.id)
        if (error) return fail(error.message)
        return ok({ message: 'Status updated' })
      }

      case 'adjust-points': {
        const { data: member, error: fetchErr } = await supabase
          .from('profiles')
          .select('point_balance')
          .eq('id', body.id)
          .single()

        if (fetchErr || !member) return fail('Member not found')

        const newBalance = member.point_balance + body.amount
        if (newBalance < 0) return fail('Cannot reduce points below zero')

        // Update balance
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ point_balance: newBalance })
          .eq('id', body.id)

        if (updateErr) return fail(updateErr.message)

        // Create point record
        await supabase.from('points').insert({
          user_id: body.id,
          type: 'adjust',
          amount: body.amount,
          note: `[Admin:${admin.sub}] ${body.note || ''}`
        })

        return ok({ message: 'Points adjusted', newBalance })
      }

      case 'export': {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) return fail(error.message)

        const headers = 'Email,Name,Phone,PointBalance,Status,CreatedAt\n'
        const rows = (data || []).map((m: any) =>
          `${m.email},${m.name},${m.phone || ''},${m.point_balance},${m.status},${m.created_at}`
        ).join('\n')

        return ok({ csv: headers + rows, filename: `members-export-${new Date().toISOString().split('T')[0]}.csv` })
      }

      default:
        return fail('Invalid action')
    }
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('permission') ? 403 : 500)
  }
})
