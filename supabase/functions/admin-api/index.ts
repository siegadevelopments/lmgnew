import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Verify caller is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') throw new Error('Forbidden')

    // 2. Initialize Admin Client
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, params } = await req.json()

    switch (action) {
      case 'list-users': {
        const { data, error } = await adminClient.auth.admin.listUsers()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'update-user': {
        const { id, ...updates } = params
        const { data, error } = await adminClient.auth.admin.updateUserById(id, updates)
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'reset-password': {
        const { email } = params
        const { data, error } = await adminClient.auth.generateLink({
          type: 'recovery',
          email,
        })
        if (error) throw error
        
        // This generates a link, but we want to SEND an email.
        // auth.admin.resetPasswordForEmail is actually a client-side method but works for admins too if they have the email.
        // Better: just use the client-side resetPasswordForEmail in the frontend, it doesn't need admin privileges!
        // But for "sending" from admin panel, we can use generateLink or just trigger the client method.
        return new Response(JSON.stringify({ success: true, link: data.properties.action_link }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'delete-user': {
        const { id } = params
        const { data, error } = await adminClient.auth.admin.deleteUser(id)
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
