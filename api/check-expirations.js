import { createClient } from '@supabase/supabase-js'

// Esta funcion la llama un Cron Job de Vercel una vez al dia.
// Revisa suscripciones vencidas y las corta automaticamente,
// bajando el workspace a su plan gratuito equivalente.
// Nunca se borra informacion, solo se desactivan funciones premium.
export default async function handler(req, res) {
  var supabaseUrl = process.env.SUPABASE_URL || 'https://koaayhnqgcyemnzkzffq.supabase.co'
  var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    res.status(500).json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY' })
    return
  }

  var supabaseAdmin = createClient(supabaseUrl, serviceKey)
  var nowIso = new Date().toISOString()

  var expiredResult = await supabaseAdmin
    .from('subscriptions')
    .select('id, workspace_id, workspaces(type)')
    .eq('status', 'active')
    .lt('expires_at', nowIso)

  if (expiredResult.error) {
    res.status(500).json({ error: expiredResult.error.message })
    return
  }

  var expired = expiredResult.data || []
  var processed = []

  for (var i = 0; i < expired.length; i++) {
    var sub = expired[i]
    var workspaceType = sub.workspaces ? sub.workspaces.type : null

    var freePlanResult = await supabaseAdmin
      .from('plans')
      .select('id, code')
      .eq('workspace_type', workspaceType)
      .eq('code', 'FREE')
      .maybeSingle()

    var freePlan = freePlanResult.data

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'expired', plan_id: freePlan ? freePlan.id : sub.plan_id, updated_at: nowIso })
      .eq('id', sub.id)

    if (freePlan) {
      await supabaseAdmin
        .from('workspaces')
        .update({ plan: 'FREE' })
        .eq('id', sub.workspace_id)
    }

    await supabaseAdmin.from('billing_events').insert({
      subscription_id: sub.id,
      event_type: 'subscription_expired_auto',
      payload: { workspace_id: sub.workspace_id, downgraded_to: freePlan ? freePlan.code : null }
    })

    processed.push(sub.workspace_id)
  }

  res.status(200).json({ checked: expired.length, downgraded: processed })
}
