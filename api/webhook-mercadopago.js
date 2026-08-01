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
      .select('id, workspace_id')
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

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          provider: 'mercadopago',
          provider_ref: String(payment.id),
          renews_at: renewsAt.toISOString(),
          expires_at: renewsAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id)

      await supabaseAdmin
        .from('workspaces')
        .update({ status: 'ACTIVE' })
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
