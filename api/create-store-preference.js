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

  var body = req.body || {}
  var items = body.items // [{ id, quantity }]
  var customer = body.customer || {}

  if (!items || !items.length) {
    res.status(400).json({ error: 'El carrito esta vacio' })
    return
  }
  if (!customer.name || !customer.phone || !customer.address || !customer.city || !customer.region) {
    res.status(400).json({ error: 'Faltan datos de envio' })
    return
  }

  var supabaseAdmin = createClient(supabaseUrl, serviceKey)

  var ids = items.map(function (i) { return i.id })
  var productsResult = await supabaseAdmin
    .from('store_products')
    .select('id, name, price, in_stock, is_active')
    .in('id', ids)

  if (productsResult.error || !productsResult.data || !productsResult.data.length) {
    res.status(404).json({ error: 'No encontramos esos productos' })
    return
  }

  var settingsResult = await supabaseAdmin
    .from('store_settings')
    .select('shipping_flat_fee, free_shipping_threshold')
    .eq('id', 1)
    .single()

  var shippingFlatFee = settingsResult.data ? settingsResult.data.shipping_flat_fee : 3990
  var freeShippingThreshold = settingsResult.data ? settingsResult.data.free_shipping_threshold : 50000

  var orderItems = []
  var subtotal = 0

  for (var i = 0; i < items.length; i++) {
    var reqItem = items[i]
    var product = productsResult.data.find(function (p) { return p.id === reqItem.id })
    if (!product || !product.is_active || !product.in_stock) {
      res.status(400).json({ error: 'El producto "' + (product ? product.name : reqItem.id) + '" ya no esta disponible' })
      return
    }
    var qty = Math.max(1, parseInt(reqItem.quantity, 10) || 1)
    orderItems.push({ id: product.id, name: product.name, price: product.price, quantity: qty })
    subtotal += product.price * qty
  }

  var shippingCost = subtotal >= freeShippingThreshold ? 0 : shippingFlatFee
  var total = subtotal + shippingCost

  var orderResult = await supabaseAdmin
    .from('store_orders')
    .insert({
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email || null,
      shipping_address: customer.address,
      shipping_city: customer.city,
      shipping_region: customer.region,
      items: orderItems,
      subtotal: subtotal,
      shipping_cost: shippingCost,
      total: total,
      status: 'pending'
    })
    .select()
    .single()

  if (orderResult.error) {
    res.status(500).json({ error: 'No se pudo crear el pedido', detail: orderResult.error.message })
    return
  }

  var order = orderResult.data

  try {
    var client = new MercadoPagoConfig({ accessToken: accessToken })
    var preference = new Preference(client)

    var mpItems = orderItems.map(function (it) {
      return { title: it.name, quantity: it.quantity, unit_price: Number(it.price), currency_id: 'CLP' }
    })
    if (shippingCost > 0) {
      mpItems.push({ title: 'Envio', quantity: 1, unit_price: shippingCost, currency_id: 'CLP' })
    }

    var result = await preference.create({
      body: {
        items: mpItems,
        back_urls: {
          success: siteUrl + '/tienda/gracias?order=' + order.id,
          failure: siteUrl + '/tienda?error=pago_fallido',
          pending: siteUrl + '/tienda/gracias?order=' + order.id + '&pending=1'
        },
        auto_return: 'approved',
        notification_url: siteUrl + '/api/webhook-mercadopago',
        external_reference: 'store_order_' + order.id
      }
    })

    await supabaseAdmin.from('store_orders').update({ mp_preference_id: result.id }).eq('id', order.id)

    res.status(200).json({ init_point: result.init_point, order_id: order.id })
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear la preferencia de pago', detail: err.message })
  }
}
