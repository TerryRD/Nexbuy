import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { fail } from '../_shared/response.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'GET' && req.method !== 'POST') return fail('Method not allowed', 405)

  try {
    const body = req.method === 'POST' ? await req.json() : {}
    const url = new URL(req.url)
    const token = body.token || url.searchParams.get('token')

    if (!token) return fail('Download token required')

    const supabase = createServiceClient()

    // Validate token
    const { data: download, error } = await supabase
      .from('digital_downloads')
      .select('*, order_item:order_items(product_name)')
      .eq('token', token)
      .single()

    if (error || !download) return fail('Invalid download token', 404)
    if (download.is_revoked) return fail('Download has been revoked')
    if (new Date(download.expires_at) < new Date()) return fail('Download has expired')
    if (download.download_count >= download.max_downloads) return fail('Download limit reached')

    // Increment download count
    await supabase
      .from('digital_downloads')
      .update({ download_count: download.download_count + 1 })
      .eq('id', download.id)

    // Return a placeholder file (in production, serve from Supabase Storage)
    const content = new TextEncoder().encode(
      `Digital download for: ${download.order_item?.product_name || 'Unknown'}\n` +
      `Token: ${token}\n` +
      `Downloads: ${download.download_count + 1}/${download.max_downloads}\n`
    )

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="download-${token.substring(0, 8)}.txt"`
      }
    })
  } catch (err) {
    return fail(err.message || 'Internal error', 500)
  }
})
