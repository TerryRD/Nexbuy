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
      case 'sales': {
        const { data, error } = await supabase
          .from('orders')
          .select('created_at, total_amount, status')
          .neq('status', 'cancelled')
          .gte('created_at', body.startDate)
          .lte('created_at', body.endDate)
          .order('created_at')

        if (error) return fail(error.message)

        // Group by date
        const dailyMap = new Map<string, { orderCount: number; revenue: number }>()
        for (const order of data || []) {
          const date = order.created_at.split('T')[0]
          const existing = dailyMap.get(date) || { orderCount: 0, revenue: 0 }
          existing.orderCount++
          existing.revenue += Number(order.total_amount)
          dailyMap.set(date, existing)
        }

        const report = Array.from(dailyMap.entries()).map(([date, stats]) => ({
          date,
          orderCount: stats.orderCount,
          revenue: Math.round(stats.revenue * 100) / 100
        }))

        return ok(report)
      }

      case 'top-products': {
        const { data: orders, error: orderErr } = await supabase
          .from('orders')
          .select('id')
          .neq('status', 'cancelled')
          .gte('created_at', body.startDate)
          .lte('created_at', body.endDate)

        if (orderErr) return fail(orderErr.message)
        const orderIds = (orders || []).map(o => o.id)

        if (orderIds.length === 0) return ok([])

        const { data: items, error: itemErr } = await supabase
          .from('order_items')
          .select('product_id, product_name, quantity, subtotal')
          .in('order_id', orderIds)

        if (itemErr) return fail(itemErr.message)

        // Aggregate by product
        const productMap = new Map<string, { productName: string; totalQuantity: number; totalRevenue: number }>()
        for (const item of items || []) {
          const existing = productMap.get(item.product_id) || {
            productName: item.product_name,
            totalQuantity: 0,
            totalRevenue: 0
          }
          existing.totalQuantity += item.quantity
          existing.totalRevenue += Number(item.subtotal)
          productMap.set(item.product_id, existing)
        }

        const topProducts = Array.from(productMap.entries())
          .map(([productId, stats]) => ({ productId, ...stats }))
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, body.count || 10)

        return ok(topProducts)
      }

      case 'order-trend': {
        const { data, error } = await supabase
          .from('orders')
          .select('created_at')
          .gte('created_at', body.startDate)
          .lte('created_at', body.endDate)
          .order('created_at')

        if (error) return fail(error.message)

        const dailyMap = new Map<string, number>()
        for (const order of data || []) {
          const date = order.created_at.split('T')[0]
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
        }

        const trend = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }))
        return ok(trend)
      }

      case 'export-sales': {
        const { data, error } = await supabase
          .from('orders')
          .select('created_at, total_amount, status')
          .neq('status', 'cancelled')
          .gte('created_at', body.startDate)
          .lte('created_at', body.endDate)
          .order('created_at')

        if (error) return fail(error.message)

        const dailyMap = new Map<string, { orderCount: number; revenue: number }>()
        for (const order of data || []) {
          const date = order.created_at.split('T')[0]
          const existing = dailyMap.get(date) || { orderCount: 0, revenue: 0 }
          existing.orderCount++
          existing.revenue += Number(order.total_amount)
          dailyMap.set(date, existing)
        }

        const headers = 'Date,Order Count,Revenue\n'
        const rows = Array.from(dailyMap.entries())
          .map(([date, stats]) => `${date},${stats.orderCount},${stats.revenue.toFixed(2)}`)
          .join('\n')

        return ok({ csv: headers + rows, filename: `sales-report-${body.startDate}-${body.endDate}.csv` })
      }

      default:
        return fail('Invalid action')
    }
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('permission') ? 403 : 500)
  }
})
