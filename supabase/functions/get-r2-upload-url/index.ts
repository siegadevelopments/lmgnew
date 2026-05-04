// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { S3CustomClient } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME')

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
      throw new Error('Missing R2 configuration secrets')
    }

    const { fileName, contentType } = await req.json()

    // Initialize S3 Client for R2
    // R2 endpoint usually looks like https://<accountid>.r2.cloudflarestorage.com
    const s3Client = new S3CustomClient({
      endPoint: R2_ENDPOINT.replace('https://', ''),
      accessKey: R2_ACCESS_KEY_ID,
      secretKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET_NAME,
      region: "auto",
      useSSL: true,
    })

    // Generate a pre-signed URL for PUT (upload)
    // Valid for 60 minutes
    const uploadUrl = await s3Client.getPresignedUrl("PUT", fileName, {
      expirySeconds: 3600,
      headers: {
        "Content-Type": contentType,
      }
    })

    // The public URL where the file will be accessible after upload
    // You might want to use a custom domain or the R2 public worker URL here
    // For now, we'll return the standard R2 public path if enabled
    const publicUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${fileName}`

    return new Response(JSON.stringify({ uploadUrl, publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
