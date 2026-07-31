import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function StoreThankYou() {
  var params = new URLSearchParams(window.location.search)
  var orderId = params.get('order')
  var pending = params.get('pending')

  var statusState = useState('checking')
  var status = statusState[0]
  var setStatus = statusState[1]

  useEffect(function () {
    if (!orderId) {
      setStatus('missing')
      return
    }
    var attempts = 0
    function check() {
      supabase
        .from('store_orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle()
        .then(function (result) {
          if (result.data && result.data.status === 'paid') {
            setStatus('paid')
            return
          }
          attempts += 1
          if (attempts < 8) {
            setTimeout(check, 2000)
          } else {
            setStatus(pending ? 'pending' : 'checking_slow')
          }
        })
    }
    check()
  }, [orderId])

  return (
    <div style={{ minHeight: '100vh', background: '#060309', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Manrope, sans-serif', textAlign: 'center' }}>
      <div style={{ maxWidth: 420 }}>
        {status === 'paid' && (
          <>
            <p style={{ fontSize: 44, marginBottom: 16 }}>🎉</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>¡Gracias por tu compra!</h1>
            <p style={{ color: '#c3bcd4', lineHeight: 1.6 }}>
              Tu pago fue confirmado. Vamos a preparar tu pedido y te contactaremos
              para coordinar el envío.
            </p>
          </>
        )}
        {(status === 'checking' || status === 'checking_slow') && (
          <>
            <p style={{ fontSize: 44, marginBottom: 16 }}>⏳</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Confirmando tu pago...</h1>
            <p style={{ color: '#c3bcd4', lineHeight: 1.6 }}>Esto puede tardar unos segundos.</p>
          </>
        )}
        {status === 'pending' && (
          <>
            <p style={{ fontSize: 44, marginBottom: 16 }}>🕓</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Tu pago está pendiente</h1>
            <p style={{ color: '#c3bcd4', lineHeight: 1.6 }}>
              Te avisaremos apenas se confirme. Si pagaste con un medio que demora
              (como transferencia), puede tardar hasta un día hábil.
            </p>
          </>
        )}
        {status === 'missing' && (
          <p style={{ color: '#c3bcd4' }}>No encontramos tu pedido.</p>
        )}
        <a
          href="/tienda"
          style={{ display: 'inline-block', marginTop: 28, padding: '12px 28px', borderRadius: 999, background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
        >
          Volver a la tienda
        </a>
      </div>
    </div>
  )
}
