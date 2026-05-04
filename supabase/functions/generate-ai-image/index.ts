// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, folder = 'ai-thumbnails' } = await req.json()
    if (!prompt) throw new Error('Prompt is required')

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY secret')

    console.log(`Generating AI image for prompt: ${prompt}`)

    // 1. Call OpenAI DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `A professional, high-quality cinematic thumbnail for a wellness/health video. Theme: ${prompt}. Minimalist, clean, modern aesthetic. No text on image.`,
        n: 1,
        size: "1024x1024",
      })
    })

    const aiData = await response.json()
    if (aiData.error) throw new Error(aiData.error.message)

    const imageUrl = aiData.data[0].url
    console.log(`Successfully generated image: ${imageUrl}`)

    // 2. Download the image
    const imageRes = await fetch(imageUrl)
    const blob = await imageRes.blob()

    // 3. Upload to Supabase Storage
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileName = `${Date.now()}.png`
    const filePath = `${folder}/${fileName}`

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('media')
      .upload(filePath, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filePath)

    return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('AI Generation Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
