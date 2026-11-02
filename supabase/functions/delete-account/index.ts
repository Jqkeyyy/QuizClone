import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' })

  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (!token) return respond(401, { error: 'Not signed in' })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  // The account to delete always comes from the verified token, never the request body.
  const { data: { user }, error: userError } = await admin.auth.getUser(token)
  if (userError || !user) return respond(401, { error: 'Not signed in' })

  const { data: sets, error: setsError } = await admin.from('sets').select('id').eq('owner_id', user.id)
  if (setsError) return respond(500, { error: 'Could not delete account' })

  // Storage objects don't cascade, so remove images before the rows that reference them.
  for (const { id } of sets) {
    while (true) {
      const { data: files, error: listError } = await admin.storage.from('card-images').list(id, { limit: 100 })
      if (listError) return respond(500, { error: 'Could not delete account' })
      if (files.length === 0) break
      const { error: removeError } = await admin.storage
        .from('card-images')
        .remove(files.map((file) => `${id}/${file.name}`))
      if (removeError) return respond(500, { error: 'Could not delete account' })
    }
  }

  // Profiles, sets, cards, memberships, and progress all cascade from auth.users.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return respond(500, { error: 'Could not delete account' })

  return respond(200, { deleted: true })
})
