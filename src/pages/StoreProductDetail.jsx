import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

var FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Audiowide&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap'

function useGoogleFonts() {
  useEffect(function () {
    if (document.getElementById('retroke-store-fonts')) return
    var link = document.createElement('link')
    link.id = 'retroke-store-fonts'
    link.rel = 'stylesheet'
    link.href = FONTS_HREF
    document.head.appendChild(link)
  }, [])
}

function waLink(whatsapp, product) {
  if (!whatsapp) return null
  var digits = whatsapp.replace(/[^0-9]/g, '')
  var text = encodeURIComponent('Hola! Me interesa el producto "' + product.name + '" ($' + product.price.toLocaleString('es-CL') + ') que vi en la tienda de Retroke.')
  return 'https://wa.me/' + digits + '?text=' + text
}

export default function StoreProductDetail() {
  var params = new URLSearchParams(window.location.search)
  var productId = params.get('id')

  useGoogleFonts()

  var productState = useState(null)
  var product = productState[0]
  var setProduct = productState[1]

  var whatsappState = useState('')
  var whatsapp = whatsappState[0]
  var setWhatsapp = whatsappState[1]

  var activeImgState = useState(0)
  var activeImg = activeImgState[0]
  var setActiveImg = activeImgState[1]

  var notFoundState = useState(false)
  var notFound = notFoundState[0]
  var setNotFound = notFoundState[1]

  useEffect(function () {
    if (!productId) { setNotFound(true); return }
    supabase.from('store_products').select('*').eq('id', productId).eq('is_active', true).maybeSingle()
      .then(function (result) {
        if (!result.data) { setNotFound(true); return }
        setProduct(result.data)
      })
    supabase.from('store_settings').select('whatsapp_number').eq('id', 1).maybeSingle()
      .then(function (result) { if (result.data) setWhatsapp(result.data.whatsapp_number || '') })
  }, [productId])

  function addToCartAndGo() {
    try {
      var saved = window.localStorage.getItem('retroke_cart')
      var cart = saved ? JSON.parse(saved) : []
      var existing = cart.find(function (i) { return i.id === product.id })
      if (existing) {
        existing.quantity += 1
      } else {
        cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.images && product.images[0], quantity: 1 })
      }
      window.localStorage.setItem('retroke_cart', JSON.stringify(cart))
    } catch (e) {}
    window.location.href = '/tienda'
  }

  if (notFound) {
    return (
      <div className="retroke-pdp pdp-notfound">
        <p>No encontramos este producto.</p>
        <a href="/tienda">Volver a la tienda</a>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="retroke-pdp pdp-loading">
        <div className="pdp-spinner" />
        <style>{`
          .retroke-pdp { background: #060309; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .pdp-spinner { width: 32px; height: 32px; border: 3px solid rgba(139,92,246,0.25); border-top-color: #E91E8C; border-radius: 999px; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  var images = (product.images && product.images.length) ? product.images : (product.image_url ? [product.image_url] : [])
  var link = waLink(whatsapp, product)

  return (
    <div className="retroke-pdp">
      <nav className="pdp-nav">
        <a href="/inicio" className="pdp-logo-link">
          <img src="/landing/retroke-logo.png" alt="Retroke" className="pdp-logo-img" />
        </a>
        <a href="/tienda" className="pdp-back">← Volver a la tienda</a>
      </nav>

      <main className="pdp-main">
        <div className="pdp-gallery">
          <div className="pdp-main-img">
            {images.length > 0 ? (
              <img src={images[activeImg]} alt={product.name} />
            ) : (
              <span className="pdp-placeholder">📦</span>
            )}
            <span className="pdp-glow" />
            {!product.in_stock && <span className="pdp-outstock">Sin stock</span>}
          </div>
          {images.length > 1 && (
            <div className="pdp-thumbs">
              {images.map(function (img, i) {
                return (
                  <button key={i} className={'pdp-thumb' + (i === activeImg ? ' active' : '')} onClick={function () { setActiveImg(i) }}>
                    <img src={img} alt="" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <p className="pdp-category">{product.category === 'microfonos' ? '🎤 Micrófonos' : product.category === 'parlantes' ? '🔊 Parlantes y sets' : '💡 Luces'}</p>
          <h1 className="pdp-name">{product.name}</h1>
          <p className="pdp-price">${product.price.toLocaleString('es-CL')}</p>

          {product.description && <p className="pdp-short-desc">{product.description}</p>}

          {product.in_stock ? (
            <div className="pdp-actions">
              <button onClick={addToCartAndGo} className="pdp-btn pdp-btn-primary">🛒 Agregar al carrito</button>
              {link && <a href={link} target="_blank" rel="noopener noreferrer" className="pdp-btn pdp-btn-ghost">💬 Consultar por WhatsApp</a>}
            </div>
          ) : (
            <div className="pdp-actions">
              <span className="pdp-btn pdp-btn-disabled">Sin stock por ahora</span>
              {link && <a href={link} target="_blank" rel="noopener noreferrer" className="pdp-btn pdp-btn-ghost">💬 Avísenme cuando llegue</a>}
            </div>
          )}

          {product.long_description && (
            <div className="pdp-section">
              <p className="pdp-section-title">Descripción</p>
              <p className="pdp-longdesc">{product.long_description}</p>
            </div>
          )}

          {product.specs && product.specs.length > 0 && (
            <div className="pdp-section">
              <p className="pdp-section-title">Ficha técnica</p>
              <div className="pdp-specs">
                {product.specs.map(function (s, i) {
                  return (
                    <div className="pdp-spec-row" key={i}>
                      <span className="pdp-spec-label">{s.label}</span>
                      <span className="pdp-spec-value">{s.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .retroke-pdp { background: #060309; color: #fff; font-family: 'Manrope', sans-serif; min-height: 100vh; }
        .retroke-pdp * { box-sizing: border-box; }
        .pdp-notfound { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 14px; color: #c3bcd4; }
        .pdp-notfound a { color: #F4D03F; text-decoration: none; font-weight: 700; }

        .pdp-nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 6vw; position: sticky; top: 0; z-index: 10; background: rgba(6,3,9,0.85); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(139,92,246,0.2); }
        .pdp-logo-img { height: 38px; width: auto; }
        .pdp-back { color: #c3bcd4; text-decoration: none; font-size: 13px; font-weight: 700; }
        .pdp-back:hover { color: #fff; }

        .pdp-main { max-width: 1080px; margin: 0 auto; padding: 50px 6vw 90px; display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }

        .pdp-gallery { position: relative; }
        .pdp-main-img { position: relative; aspect-ratio: 1; border-radius: 24px; overflow: hidden; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(139,92,246,0.3); display: flex; align-items: center; justify-content: center; }
        .pdp-main-img img { width: 100%; height: 100%; object-fit: cover; }
        .pdp-placeholder { font-size: 64px; opacity: 0.3; }
        .pdp-glow { position: absolute; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(233,30,140,0.12), transparent 60%); pointer-events: none; }
        .pdp-outstock { position: absolute; top: 16px; right: 16px; background: #E9544A; color: #fff; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; }
        .pdp-thumbs { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
        .pdp-thumb { width: 62px; height: 62px; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(139,92,246,0.3); background: rgba(255,255,255,0.03); padding: 0; cursor: pointer; transition: border-color 0.15s ease; }
        .pdp-thumb.active { border-color: #F4D03F; box-shadow: 0 0 12px -2px rgba(244,208,63,0.6); }
        .pdp-thumb img { width: 100%; height: 100%; object-fit: cover; }

        .pdp-category { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 1.5px; text-transform: uppercase; color: #8B5CF6; font-weight: 600; margin-bottom: 12px; }
        .pdp-name { font-family: 'Audiowide', cursive; font-size: clamp(1.5rem, 3vw, 2.1rem); line-height: 1.3; margin-bottom: 16px; letter-spacing: 0.3px; }
        .pdp-price { font-family: 'Audiowide', cursive; font-size: 26px; color: #F4D03F; margin-bottom: 18px; text-shadow: 0 0 30px rgba(244,208,63,0.35); }
        .pdp-short-desc { font-size: 14.5px; color: #c3bcd4; line-height: 1.7; margin-bottom: 24px; }

        .pdp-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
        .pdp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px; border-radius: 999px; font-weight: 700; font-size: 13.5px; cursor: pointer; border: none; text-decoration: none; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .pdp-btn-primary { background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff; box-shadow: 0 0 24px -6px rgba(233,30,140,0.7); }
        .pdp-btn-primary:hover { transform: translateY(-2px); }
        .pdp-btn-ghost { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(139,92,246,0.4); }
        .pdp-btn-disabled { background: rgba(255,255,255,0.04); color: #6c6480; padding: 13px 24px; border-radius: 999px; font-size: 13.5px; font-weight: 700; }

        .pdp-section { border-top: 1px solid rgba(139,92,246,0.2); padding-top: 22px; margin-top: 22px; }
        .pdp-section-title { font-family: 'Audiowide', cursive; font-size: 13.5px; color: #F4D03F; margin-bottom: 14px; letter-spacing: 0.5px; }
        .pdp-longdesc { font-size: 13.5px; color: #c3bcd4; line-height: 1.75; white-space: pre-line; }
        .pdp-specs { display: flex; flex-direction: column; gap: 0; border-radius: 14px; overflow: hidden; border: 1px solid rgba(139,92,246,0.2); }
        .pdp-spec-row { display: flex; justify-content: space-between; gap: 16px; padding: 11px 16px; font-size: 12.5px; }
        .pdp-spec-row:nth-child(odd) { background: rgba(255,255,255,0.02); }
        .pdp-spec-label { color: #9b92ad; font-weight: 600; }
        .pdp-spec-value { color: #fff; font-weight: 600; text-align: right; }

        @media (max-width: 800px) {
          .pdp-main { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </div>
  )
}
