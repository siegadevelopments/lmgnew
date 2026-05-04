// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    
    // Only process if status is 'uploading'
    if (!record || record.status !== 'uploading') {
      return new Response(JSON.stringify({ message: 'Skipping: Not in uploading state' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log(`Processing video: ${record.title} (${record.id})`)

    // 1. Get Credentials
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN')

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      console.warn('Missing YouTube credentials, marking as ready with storage URL')
      await supabaseAdmin.from('videos').update({ status: 'ready' }).eq('id', record.id)
      return new Response(JSON.stringify({ message: 'Missing credentials, skipped YouTube' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 2. Resolve File Path (check multiple buckets for robustness)
    let filePath = ''
    let bucket = 'video-uploads'
    
    if (record.embed_url?.includes('video-uploads/')) {
      filePath = record.embed_url.split('video-uploads/')[1]
    } else if (record.embed_url?.includes('media/')) {
      filePath = record.embed_url.split('media/')[1]
      bucket = 'media'
    } else {
      // Fallback: Check the video-uploads bucket for the author's latest file
      const { data: files } = await supabaseAdmin.storage.from('video-uploads').list(record.author_id)
      if (files && files.length > 0) {
        const latest = files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        filePath = `${record.author_id}/${latest.name}`
      }
    }

    if (!filePath) throw new Error('Could not locate video file in storage')

    // 3. Refresh Google Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) throw new Error('Failed to refresh YouTube access token')

    // 4. Prepare Stream Source
    let sourceUrl = record.embed_url;
    if (bucket === 'media' || bucket === 'video-uploads') {
      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);
      if (signedError) throw signedError;
      sourceUrl = signedData.signedUrl;
    }

    console.log(`Streaming video from: ${sourceUrl}`);
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) throw new Error(`Failed to access source video: ${sourceResponse.statusText}`);
    
    const contentLength = sourceResponse.headers.get('content-length');
    if (!contentLength) throw new Error('Source video missing content-length header');

    // 5. Upload to YouTube (Streaming)
    const metadata = {
      snippet: {
        title: record.title,
        description: record.description || 'Uploaded via Lifestyle Medicine Gateway',
        categoryId: '22',
      },
      status: { privacyStatus: 'unlisted', selfDeclaredMadeForKids: false },
    }

    // A. Initiate Resumable Session
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/*',
          'X-Upload-Content-Length': contentLength,
        },
        body: JSON.stringify(metadata),
      }
    )

    const uploadUrl = initResponse.headers.get('Location')
    if (!uploadUrl) {
      const errBody = await initResponse.text();
      console.error('YouTube Init Error:', errBody);
      throw new Error('Failed to initiate YouTube upload session');
    }

    // B. Stream the file directly to YouTube
    console.log(`Starting stream to YouTube: ${contentLength} bytes`);
    const finalUpload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/*' },
      // @ts-ignore - Deno supports streaming body
      body: sourceResponse.body,
      // @ts-ignore - Required for streaming in some fetch environments
      duplex: 'half',
    })

    if (!finalUpload.ok) {
      const errBody = await finalUpload.text();
      console.error('YouTube Final Upload Error:', errBody);
      throw new Error(`YouTube upload failed with status ${finalUpload.status}`);
    }

    const youtubeResult = await finalUpload.json()
    if (!youtubeResult.id) throw new Error('YouTube upload failed at final stage');

    // 6. Update Video Record
    const updates: any = {
      status: 'ready',
      embed_url: `https://www.youtube.com/embed/${youtubeResult.id}`,
      youtube_id: youtubeResult.id
    };

    // 7. Generate AI Thumbnail if missing
    if (!record.thumbnail_url) {
      console.log('Thumbnail missing, generating with AI...');
      try {
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
        if (OPENAI_API_KEY) {
          const aiResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: `A professional, high-quality cinematic thumbnail for a wellness/health video. Title: ${record.title}. Theme: ${record.description || record.title}. Minimalist, clean, modern aesthetic. No text on image.`,
              n: 1,
              size: "1024x1024",
            })
          })

          const aiData = await aiResponse.json()
          if (aiData.data?.[0]?.url) {
            const imageUrl = aiData.data[0].url
            const imageRes = await fetch(imageUrl)
            const blob = await imageRes.blob()

            const fileName = `${record.id}_thumb.png`
            const filePath = `ai-thumbnails/${fileName}`

            await supabaseAdmin.storage
              .from('media')
              .upload(filePath, blob, { contentType: 'image/png', upsert: true })

            const { data: publicUrlData } = supabaseAdmin.storage
              .from('media')
              .getPublicUrl(filePath)
            
            updates.thumbnail_url = publicUrlData.publicUrl
            console.log('AI Thumbnail generated and saved:', updates.thumbnail_url)
          }
        }
      } catch (aiErr) {
        console.error('AI Thumbnail generation failed:', aiErr.message)
        // Non-fatal, we still mark video as ready
      }
    }

    await supabaseAdmin
      .from('videos')
      .update(updates)
      .eq('id', record.id)

    // 7. Cleanup (optional)
    await supabaseAdmin.storage.from(bucket).remove([filePath])

    return new Response(JSON.stringify({ success: true, youtube_id: youtubeResult.id }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error: any) {
    console.error('Video Processing Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
