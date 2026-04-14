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

        let query = supabase
          .from('products')
          .select('*, translations:product_translations(*), images:product_images(*)', { count: 'exact' })
          .order('created_at', { ascending: false })

        if (body.status) query = query.eq('status', body.status)
        if (body.search) {
          query = query.or(`sku.ilike.%${body.search}%`)
        }

        const { data, count, error } = await query.range(from, to)
        if (error) return fail(error.message)
        return ok({ items: data, total: count, page, pageSize })
      }

      case 'create': {
        const { data: product, error } = await supabase
          .from('products')
          .insert({
            category_id: body.categoryId,
            sku: body.sku,
            type: body.type || 'physical',
            price: body.price,
            stock: body.stock || 0,
            max_downloads: body.maxDownloads,
            download_expiry_hours: body.downloadExpiryHours,
            status: body.status || 'active'
          })
          .select()
          .single()

        if (error) return fail(error.message)

        // Create translations
        if (body.translations?.length) {
          await supabase.from('product_translations').insert(
            body.translations.map((t: any) => ({
              product_id: product.id,
              locale: t.locale,
              name: t.name,
              description: t.description
            }))
          )
        }

        // Create variants
        if (body.variants?.length) {
          await supabase.from('product_variants').insert(
            body.variants.map((v: any) => ({
              product_id: product.id,
              variant_name: v.variantName,
              price_adjustment: v.priceAdjustment || 0,
              stock: v.stock || 0,
              sku: v.sku
            }))
          )
        }

        return ok(product)
      }

      case 'update': {
        // Update product
        const { error: updateErr } = await supabase
          .from('products')
          .update({
            category_id: body.categoryId,
            sku: body.sku,
            type: body.type,
            price: body.price,
            stock: body.stock,
            max_downloads: body.maxDownloads,
            download_expiry_hours: body.downloadExpiryHours,
            status: body.status
          })
          .eq('id', body.id)

        if (updateErr) return fail(updateErr.message)

        // Re-create translations
        await supabase.from('product_translations').delete().eq('product_id', body.id)
        if (body.translations?.length) {
          await supabase.from('product_translations').insert(
            body.translations.map((t: any) => ({
              product_id: body.id,
              locale: t.locale,
              name: t.name,
              description: t.description
            }))
          )
        }

        // Re-create variants
        await supabase.from('product_variants').delete().eq('product_id', body.id)
        if (body.variants?.length) {
          await supabase.from('product_variants').insert(
            body.variants.map((v: any) => ({
              product_id: body.id,
              variant_name: v.variantName,
              price_adjustment: v.priceAdjustment || 0,
              stock: v.stock || 0,
              sku: v.sku
            }))
          )
        }

        return ok({ id: body.id })
      }

      case 'delete': {
        await supabase.from('products').update({ status: 'inactive' }).eq('id', body.id)
        return ok({ message: 'Product deactivated' })
      }

      case 'delete-image': {
        const { error } = await supabase
          .from('product_images')
          .delete()
          .eq('id', body.imageId)
          .eq('product_id', body.productId)

        if (error) return fail(error.message)
        return ok({ message: 'Image deleted' })
      }

      case 'list-categories': {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order')
        if (error) return fail(error.message)
        return ok(data)
      }

      case 'create-category': {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            slug: body.slug,
            parent_id: body.parentId || null,
            sort_order: body.sortOrder || 0
          })
          .select()
          .single()
        if (error) return fail(error.message)
        return ok(data)
      }

      case 'update-category': {
        const { error } = await supabase
          .from('categories')
          .update({
            slug: body.slug,
            parent_id: body.parentId,
            sort_order: body.sortOrder
          })
          .eq('id', body.id)
        if (error) return fail(error.message)
        return ok({ id: body.id })
      }

      case 'delete-category': {
        const { error } = await supabase.from('categories').delete().eq('id', body.id)
        if (error) return fail(error.message)
        return ok({ message: 'Category deleted' })
      }

      default:
        return fail('Invalid action')
    }
  } catch (err) {
    return fail(err.message || 'Internal error', err.message?.includes('permission') ? 403 : 500)
  }
})
