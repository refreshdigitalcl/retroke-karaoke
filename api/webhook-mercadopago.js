import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

// Mercado Pago exige responder 200 siempre, incluso si algo interno falla,
// para que no siga reintentando indefinidamente. Los errores quedan
// registrados en billing_events para revisarlos despues.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(200).send('ok')
    return
  }

  var accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  var supabaseUrl = process.env.SUPABASE_URL || 'https://koaayhnqgcyemnzkzffq.supabase.co'
  var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!accessToken || !serviceKey) {
    res.status(200).send('not_configured')
    return
  }

  var supabaseAdmin = createClient(supabaseUrl, serviceKey)

  try {
    var body = req.body || {}
    var paymentId = (body.data && body.data.id) || req.query.id || null
    var topic = body.type || req.query.type

    if (topic !== 'payment' || !paymentId) {
      res.status(200).send('ignored')
      return
    }

    var client = new MercadoPagoConfig({ accessToken: accessToken })
    var paymentApi = new Payment(client)
    var payment = await paymentApi.get({ id: paymentId })

    await supabaseAdmin.from('billing_events').insert({
      event_type: 'mercadopago_webhook',
      payload: payment
    })

    var externalRef = payment.external_reference
    if (!externalRef) {
      res.status(200).send('no_reference')
      return
    }

    var subResult = await supabaseAdmin
      .from('subscriptions')
      .select('id, workspace_id, workspaces(type)')
      .eq('external_reference', externalRef)
      .single()

    if (subResult.error || !subResult.data) {
      res.status(200).send('subscription_not_found')
      return
    }

    var sub = subResult.data

    // Idempotencia: si ya procesamos este pago antes, no lo hacemos de nuevo.
    var existing = await supabaseAdmin
      .from('payment_transactions')
      .select('id')
      .eq('provider', 'mercadopago')
      .eq('provider_ref', String(payment.id))
      .maybeSingle()

    if (existing.data) {
      res.status(200).send('already_processed')
      return
    }

    await supabaseAdmin.from('payment_transactions').insert({
      subscription_id: sub.id,
      provider: 'mercadopago',
      provider_ref: String(payment.id),
      status: payment.status === 'approved' ? 'approved' : payment.status,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      raw_status: payment.status_detail
    })

    if (payment.status === 'approved') {
      var renewsAt = new Date()
      renewsAt.setDate(renewsAt.getDate() + 30)

      // OJO: en el alta normal (SignupPage.jsx) workspaces.plan ya queda
      // en 'PRO' desde que se crea el workspace (antes de pagar) -- por
      // eso historicamente este webhook solo necesitaba extender
      // expires_at, nunca tocar el plan. Pero desde que existe el flujo
      // de "renovar" una suscripcion vencida (check-expirations.js baja
      // workspaces.plan a 'FREE' y subscriptions.plan_id al plan FREE
      // cuando vence), un pago aprobado sobre una suscripcion en ese
      // estado necesita RESTAURAR el plan PRO explicitamente -- si no,
      // el pago se cobra pero la cuenta se queda en FREE. Se resuelve el
      // plan PRO del tipo de workspace correspondiente (nunca se confia
      // en el plan_id que la suscripcion ya tenia guardado, por la misma
      // razon que create-preference.js dejo de confiar en el).
      var workspaceType = sub.workspaces ? sub.workspaces.type : null
      var proPlanId = null
      if (workspaceType) {
        var proPlanResult = await supabaseAdmin
          .from('plans')
          .select('id')
          .eq('workspace_type', workspaceType)
          .eq('code', 'PRO')
          .maybeSingle()
        proPlanId = proPlanResult.data ? proPlanResult.data.id : null
      }

      var subUpdate = {
        status: 'active',
        provider: 'mercadopago',
        provider_ref: String(payment.id),
        renews_at: renewsAt.toISOString(),
        expires_at: renewsAt.toISOString(),
        updated_at: new Date().toISOString()
      }
      if (proPlanId) subUpdate.plan_id = proPlanId

      await supabaseAdmin
        .from('subscriptions')
        .update(subUpdate)
        .eq('id', sub.id)

      var workspaceUpdate = { status: 'ACTIVE' }
      if (proPlanId) workspaceUpdate.plan = 'PRO'

      await supabaseAdmin
        .from('workspaces')
        .update(workspaceUpdate)
        .eq('id', sub.workspace_id)
    }

    res.status(200).send('ok')
  } catch (err) {
    try {
      await supabaseAdmin.from('billing_events').insert({
        event_type: 'webhook_error',
        payload: { message: err.message }
      })
    } catch (e2) {}
    res.status(200).send('error_logged')
  }
}
