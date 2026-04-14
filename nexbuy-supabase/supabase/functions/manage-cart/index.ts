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

    switch (body.action) {
      case 'add': {
        const { productId, variantId, quantity } = body
        if (!productId || !quantity) return fail('Product ID and quantity required')

        // Validate product exists and is active
        const { data: product, error: productErr } = await supabase
          .from('products')
          .select('id, price, stock, status, type')
          .eq('id', productId)
          .eq('status', 'active')
          .single()

        if (productErr || !product) return fail('Product not found')

        let availableStock = product.stock
        if (variantId) {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', variantId)
            .single()
          if (variant) availableStock = variant.stock
        }

        if (quantity > availableStock) return fail('Insufficient stock')

        // Upsert cart item
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .is('variant_id', variantId || null)
          .maybeSingle()

        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, availableStock)
          await supabase
            .from('cart_items')
            .update({ quantity: newQty })
            .eq('id', existing.id)
        } else {
          await supabase.from('cart_items').insert({
            user_id: user.id,
            product_id: productId,
            variant_id: variantId || null,
            quantity: Math.min(quantity, availableStock)
          })
        }

        return ok({ message: 'Item added to cart' })
      }

      case 'merge': {
        const { items } = body
        if (!items || !Array.isArray(items)) return fail('Items array required')

        for (const item of items) {
          const { productId, variantId, quantity } = item
          if (!productId || !quantity) continue

          const { data: existing } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .is('variant_id', variantId || null)
            .maybeSingle()

          if (existing) {
            await supabase
              .from('cart_items')
              .update({ quantity: existing.quantity + quantity })
              .eq('id', existing.id)
          } else {
            await supabase.from('cart_items').insert({
              user_id: user.id,
              product_id: productId,
              variant_id: variantId || null,
              quantity
            })
          }
        }

        return ok({ message: 'Cart merged successfully' })
      }

      case 'apply-coupon': {
        const { code } = body
        if (!code) return fail('Coupon code required')

        // Validate coupon
        const { data: coupon, error: couponErr } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', code)
          .eq('status', 'active')
          .lte('start_at', new Date().toISOString())
          .gt('expired_at', new Date().toISOString())
          .single()

        if (couponErr || !coupon) return fail('Invalid or expired coupon')
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
          return fail('Coupon usage limit reached')
        }

        // Apply coupon code to all cart items
        await supabase
          .from('cart_items')
          .update({ coupon_code: code })
          .eq('user_id', user.id)

        return ok({ message: 'Coupon applied', couponCode: code })
      }

      case 'remove-coupon': {
        await supabase
          .from('cart_items')
          .update({ coupon_code: null })
          .eq('user_id', user.id)

        return ok({ message: 'Coupon removed' })
      }

      default:
        return fail('Invalid action')
    }
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('token') ? 401 : 500)
  }
})
