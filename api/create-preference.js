import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' })
    return
  }

  var accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  var supabaseUrl = process.env.SUPABASE_URL || 'https://koaayhnqgcyemnzkzffq.supabase.co'
  var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  var siteUrl = process.env.SITE_URL || 'https://retroke-karaoke.vercel.app'

  if (!accessToken || !serviceKey) {
    res.status(500).json({ error: 'El servidor todavia no tiene configuradas las credenciales de Mercado Pago.' })
    return
  }

  var subscriptionId = req.body && req.body.subscription_id
  if (!subscriptionId) {
    res.status(400).json({ error: 'Falta subscription_id' })
    return
  }

  var supabaseAdmin = createClient(supabaseUrl, serviceKey)

  var subResult = await supabaseAdmin
    .from('subscriptions')
    .select('id, external_reference, plan:plans(id, name, price_monthly)')
    .eq('id', subscriptionId)
    .single()

  if (subResult.error || !subResult.data) {
    res.status(404).json({ error: 'No encontramos esa suscripcion' })
    return
  }

  var sub = subResult.data
  var plan = sub.plan

  if (!plan || Number(plan.price_monthly) <= 0) {
    res.status(400).json({ error: 'Este plan no requiere pago' })
    return
  }

  try {
    var client = new MercadoPagoConfig({ accessToken: accessToken })
    var preference = new Preference(client)

    var result = await preference.create({
      body: {
        items: [
          {
            title: 'Retroke - ' + plan.name,
            quantity: 1,
            unit_price: Number(plan.price_monthly),
            currency_id: 'CLP'
          }
        ],
        back_urls: {
          success: siteUrl + '/bienvenido?sub=' + sub.id,
          failure: siteUrl + '/comenzar?error=pago_fallido',
          pending: siteUrl + '/bienvenido?sub=' + sub.id + '&pending=1'
        },
        auto_return: 'approved',
        notification_url: siteUrl + '/api/webhook-mercadopago',
        external_reference: sub.external_reference
      }
    })

    res.status(200).json({ init_point: result.init_point })
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear la preferencia de pago', detail: err.message })
  }
}
