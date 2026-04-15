import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { ok, fail } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/admin-auth.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['completed'],
  completed: [],
  cancelled: []
}

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

        let query = supabase
          .from('orders')
          .select(`
            order_no, status, payment_status, total_amount, created_at,
            user:profiles(email),
            items:order_items(id)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })

        if (body.status) query = query.eq('status', body.status)
        if (body.search) {
          query = query.or(`order_no.ilike.%${body.search}%,recipient_name.ilike.%${body.search}%`)
        }

        const { data, count, error } = await query.range(from, to)
        if (error) return fail(error.message)

        const items = (data || []).map((o: any) => ({
          orderNo: o.order_no,
          status: o.status,
          paymentStatus: o.payment_status,
          totalAmount: o.total_amount,
          createdAt: o.created_at,
          customerEmail: o.user?.email,
          itemCount: o.items?.length || 0
        }))

        return ok({ items, total: count, page, pageSize })
      }

      case 'detail': {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            user:profiles(email, name),
            items:order_items(*)
          `)
          .eq('order_no', body.orderNo)
          .single()

        if (error) return fail(error.message)
        return ok(data)
      }

      case 'update-status': {
        const { data: order, error: fetchErr } = await supabase
          .from('orders')
          .select('status')
          .eq('order_no', body.orderNo)
          .single()

        if (fetchErr || !order) return fail('Order not found')

        const allowed = VALID_TRANSITIONS[order.status] || []
        if (!allowed.includes(body.status)) {
          return fail(`Cannot transition from ${order.status} to ${body.status}`)
        }

        const updates: any = { status: body.status }
        if (body.status === 'paid') updates.payment_status = 'paid'

        const { error } = await supabase
          .from('orders')
          .update(updates)
          .eq('order_no', body.orderNo)

        if (error) return fail(error.message)
        return ok({ message: 'Status updated' })
      }

      case 'update-tracking': {
        const { error } = await supabase
          .from('orders')
          .update({ tracking_no: body.trackingNo })
          .eq('order_no', body.orderNo)

        if (error) return fail(error.message)
        return ok({ message: 'Tracking updated' })
      }

      case 'export': {
        let query = supabase
          .from('orders')
          .select(`
            order_no, status, payment_status, total_amount, sub_total,
            discount_amount, shipping_fee, recipient_name, created_at,
            user:profiles(email),
            items:order_items(id)
          `)
          .order('created_at', { ascending: false })

        if (body.startDate) query = query.gte('created_at', body.startDate)
        if (body.endDate) query = query.lte('created_at', body.endDate)

        const { data, error } = await query
        if (error) return fail(error.message)

        // Generate CSV
        const headers = 'Order No,Status,Payment Status,Customer,Recipient,SubTotal,Discount,Shipping,Total,Items,Date\n'
        const rows = (data || []).map((o: any) =>
          `${o.order_no},${o.status},${o.payment_status},${o.user?.email || ''},${o.recipient_name},${o.sub_total},${o.discount_amount},${o.shipping_fee},${o.total_amount},${o.items?.length || 0},${o.created_at}`
        ).join('\n')

        return ok({ csv: headers + rows, filename: `orders-export-${new Date().toISOString().split('T')[0]}.csv` })
      }

      default:
        return fail('Invalid action')
    }
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('permission') ? 403 : 500)
  }
})
