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

var TABS = [
  { id: 'galeria', label: 'Galería' },
  { id: 'descripcion', label: 'Descripción' },
  { id: 'especificaciones', label: 'Especificaciones' }
]

export default function StoreProductDetail() {
  var params = new URLSearchParams(window.location.search)
  var productId = params.get('id')

  useGoogleFonts()

  var productState = useState(null)
  var product = productState[0]
  var setProduct = productState[1]

  var relatedState = useState([])
  var related = relatedState[0]
  var setRelated = relatedState[1]

  var whatsappState = useState('')
  var whatsapp = whatsappState[0]
  var setWhatsapp = whatsappState[1]

  var activeImgState = useState(0)
  var activeImg = activeImgState[0]
  var setActiveImg = activeImgState[1]

  var activeTabState = useState('galeria')
  var activeTab = activeTabState[0]
  var setActiveTab = activeTabState[1]

  var qtyState = useState(1)
  var qty = qtyState[0]
  var setQty = qtyState[1]

  var notFoundState = useState(false)
  var notFound = notFoundState[0]
  var setNotFound = notFoundState[1]

  useEffect(function () {
    if (!productId) { setNotFound(true); return }
    supabase.from('store_products').select('*').eq('id', productId).eq('is_active', true).maybeSingle()
      .then(function (result) {
        if (!result.data) { setNotFound(true); return }
        setProduct(result.data)
        supabase.from('store_products').select('*').eq('category', result.data.category).eq('is_active', true).neq('id', result.data.id).limit(4)
          .then(function (r2) { setRelated(r2.data || []) })
      })
    supabase.from('store_settings').select('whatsapp_number').eq('id', 1).maybeSingle()
      .then(function (result) { if (result.data) setWhatsapp(result.data.whatsapp_number || '') })
  }, [productId])

  function scrollToTab(id) {
    setActiveTab(id)
    var el = document.getElementById('sec-' + id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function addToCartAndGo() {
    try {
      var saved = window.localStorage.getItem('retroke_cart')
      var cart = saved ? JSON.parse(saved) : []
      var existing = cart.find(function (i) { return i.id === product.id })
      if (existing) {
        existing.quantity += qty
      } else {
        cart.push({ id: product.id, name: product.name, price: product.price, image_url: (product.images && product.images[0]) || product.image_url, quantity: qty })
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
        <style>{`.pdp-notfound { background: #060309; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #c3bcd4; font-family: Manrope, sans-serif; } .pdp-notfound a { color: #F4D03F; text-decoration: none; font-weight: 700; }`}</style>
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
  var categoryLabel = product.category === 'microfonos' ? '🎤 Micrófonos' : product.category === 'parlantes' ? '🔊 Parlantes y sets' : '💡 Luces'

  return (
    <div className="retroke-pdp">
      <nav className="pdp-nav">
        <a href="/inicio" className="pdp-logo-link">
          <img src="/landing/retroke-logo.png" alt="Retroke" className="pdp-logo-img" />
        </a>
        <a href="/tienda" className="pdp-back">← Volver a la tienda</a>
      </nav>

      {/* GALERIA + COMPRA */}
      <main className="pdp-top" id="sec-galeria">
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

        <div className="pdp-buybox">
          <p className="pdp-category">{categoryLabel}</p>
          <h1 className="pdp-name">{product.name}</h1>
          <p className="pdp-price">${product.price.toLocaleString('es-CL')}</p>

          {product.highlights && product.highlights.length > 0 && (
            <ul className="pdp-highlights">
              {product.highlights.map(function (h, i) {
                return <li key={i}><span className="pdp-highlight-dot" />{h}</li>
              })}
            </ul>
          )}

          {product.in_stock ? (
            <>
              <div className="pdp-qty-row">
                <span className="pdp-qty-label">Cantidad</span>
                <div className="pdp-qty">
                  <button onClick={function () { setQty(Math.max(1, qty - 1)) }}>−</button>
                  <span>{qty}</span>
                  <button onClick={function () { setQty(qty + 1) }}>+</button>
                </div>
              </div>
              <div className="pdp-actions">
                <button onClick={addToCartAndGo} className="pdp-btn pdp-btn-primary">🛒 Agregar al carrito</button>
                {link && <a href={link} target="_blank" rel="noopener noreferrer" className="pdp-btn pdp-btn-ghost">💬</a>}
              </div>
            </>
          ) : (
            <div className="pdp-actions">
              <span className="pdp-btn pdp-btn-disabled">Sin stock por ahora</span>
              {link && <a href={link} target="_blank" rel="noopener noreferrer" className="pdp-btn pdp-btn-ghost">💬 Avísenme cuando llegue</a>}
            </div>
          )}

          <div className="pdp-trust">
            <span>🚚 Envío a todo Chile</span>
            <span>🔒 Pago seguro con Mercado Pago</span>
          </div>
        </div>
      </main>

      {/* TABS */}
      <div className="pdp-tabs-bar">
        {TABS.map(function (t) {
          return (
            <button key={t.id} onClick={function () { scrollToTab(t.id) }} className={'pdp-tab' + (activeTab === t.id ? ' active' : '')}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* DESCRIPCION */}
      <section className="pdp-section" id="sec-descripcion">
        <p className="pdp-section-title">Descripción</p>
        <p className="pdp-longdesc">{product.long_description || product.description || 'Próximamente más detalles de este producto.'}</p>
      </section>

      {/* ESPECIFICACIONES */}
      {product.specs && product.specs.length > 0 && (
        <section className="pdp-section" id="sec-especificaciones">
          <p className="pdp-section-title">Especificaciones</p>
          {(function () {
            var groups = {}
            var order = []
            product.specs.forEach(function (s) {
              var g = s.group || 'General'
              if (!groups[g]) { groups[g] = []; order.push(g) }
              groups[g].push(s)
            })
            return order.map(function (g) {
              return (
                <div key={g} className="pdp-spec-group">
                  {order.length > 1 && <p className="pdp-spec-group-title">{g}</p>}
                  <div className="pdp-specs">
                    {groups[g].map(function (s, i) {
                      return (
                        <div className="pdp-spec-row" key={i}>
                          <span className="pdp-spec-label">{s.label}</span>
                          <span className="pdp-spec-value">{s.value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          })()}
        </section>
      )}

      {/* RELACIONADOS */}
      {related.length > 0 && (
        <section className="pdp-section pdp-related">
          <p className="pdp-section-title">También te puede interesar</p>
          <div className="pdp-related-grid">
            {related.map(function (r) {
              var img = (r.images && r.images[0]) || r.image_url
              return (
                <a key={r.id} href={'/tienda/producto?id=' + r.id} target="_blank" rel="noopener noreferrer" className="pdp-related-card">
                  <div className="pdp-related-img">{img ? <img src={img} alt="" /> : <span>📦</span>}</div>
                  <p className="pdp-related-name">{r.name}</p>
                  <p className="pdp-related-price">${r.price.toLocaleString('es-CL')}</p>
                </a>
              )
            })}
          </div>
        </section>
      )}

      <footer className="pdp-footer">
        <p>© {new Date().getFullYear()} Retroke. El karaoke se vive diferente.</p>
      </footer>

      <style>{`
        .retroke-pdp { background: #060309; color: #fff; font-family: 'Manrope', sans-serif; min-height: 100vh; }
        .retroke-pdp * { box-sizing: border-box; }

        .pdp-nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 6vw; position: sticky; top: 0; z-index: 20; background: rgba(6,3,9,0.9); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(139,92,246,0.2); }
        .pdp-logo-img { height: 38px; width: auto; }
        .pdp-back { color: #c3bcd4; text-decoration: none; font-size: 13px; font-weight: 700; }
        .pdp-back:hover { color: #fff; }

        .pdp-top { max-width: 1120px; margin: 0 auto; padding: 46px 6vw 40px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 56px; }

        .pdp-gallery { position: relative; }
        .pdp-main-img { position: relative; aspect-ratio: 1; border-radius: 24px; overflow: hidden; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(139,92,246,0.3); display: flex; align-items: center; justify-content: center; }
        .pdp-main-img img { width: 100%; height: 100%; object-fit: cover; }
        .pdp-placeholder { font-size: 64px; opacity: 0.3; }
        .pdp-glow { position: absolute; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(233,30,140,0.12), transparent 60%); pointer-events: none; }
        .pdp-outstock { position: absolute; top: 16px; right: 16px; background: #E9544A; color: #fff; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; }
        .pdp-thumbs { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
        .pdp-thumb { width: 62px; height: 62px; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(139,92,246,0.3); background: rgba(255,255,255,0.03); padding: 0; cursor: pointer; transition: border-color 0.15s ease; flex-shrink: 0; }
        .pdp-thumb.active { border-color: #F4D03F; box-shadow: 0 0 12px -2px rgba(244,208,63,0.6); }
        .pdp-thumb img { width: 100%; height: 100%; object-fit: cover; }

        .pdp-buybox { display: flex; flex-direction: column; }
        .pdp-category { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 1.5px; text-transform: uppercase; color: #8B5CF6; font-weight: 600; margin-bottom: 12px; }
        .pdp-name { font-family: 'Audiowide', cursive; font-size: clamp(1.4rem, 2.8vw, 1.9rem); line-height: 1.35; margin-bottom: 14px; letter-spacing: 0.3px; }
        .pdp-price { font-family: 'Audiowide', cursive; font-size: 26px; color: #F4D03F; margin-bottom: 20px; text-shadow: 0 0 30px rgba(244,208,63,0.35); }

        .pdp-highlights { list-style: none; padding: 0; margin: 0 0 26px; display: flex; flex-direction: column; gap: 11px; }
        .pdp-highlights li { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: #d7d0e6; line-height: 1.5; }
        .pdp-highlight-dot { width: 7px; height: 7px; border-radius: 999px; background: linear-gradient(90deg, #F4D03F, #E91E8C); margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 8px -1px rgba(244,208,63,0.8); }

        .pdp-qty-row { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
        .pdp-qty-label { font-size: 12.5px; color: #9b92ad; font-weight: 700; }
        .pdp-qty { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(139,92,246,0.3); border-radius: 999px; padding: 6px 10px; }
        .pdp-qty button { width: 24px; height: 24px; border-radius: 999px; border: none; background: rgba(139,92,246,0.3); color: #fff; cursor: pointer; font-size: 14px; }
        .pdp-qty span { font-size: 13.5px; font-weight: 700; min-width: 16px; text-align: center; }

        .pdp-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
        .pdp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px; border-radius: 999px; font-weight: 700; font-size: 13.5px; cursor: pointer; border: none; text-decoration: none; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .pdp-btn-primary { background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff; box-shadow: 0 0 24px -6px rgba(233,30,140,0.7); flex: 1; justify-content: center; }
        .pdp-btn-primary:hover { transform: translateY(-2px); }
        .pdp-btn-ghost { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(139,92,246,0.4); }
        .pdp-btn-disabled { background: rgba(255,255,255,0.04); color: #6c6480; padding: 13px 24px; border-radius: 999px; font-size: 13.5px; font-weight: 700; }

        .pdp-trust { display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: #7a7290; border-top: 1px solid rgba(139,92,246,0.15); padding-top: 16px; }

        .pdp-tabs-bar { position: sticky; top: 65px; z-index: 15; display: flex; gap: 6px; justify-content: center; padding: 10px 6vw; background: rgba(6,3,9,0.92); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(139,92,246,0.2); }
        .pdp-tab { background: none; border: none; color: #9b92ad; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 999px; cursor: pointer; transition: all 0.15s ease; }
        .pdp-tab:hover { color: #fff; }
        .pdp-tab.active { color: #F4D03F; background: rgba(244,208,63,0.1); }

        .pdp-section { max-width: 900px; margin: 0 auto; padding: 46px 6vw; border-top: 1px solid rgba(139,92,246,0.15); }
        .pdp-section-title { font-family: 'Audiowide', cursive; font-size: 16px; color: #F4D03F; margin-bottom: 20px; letter-spacing: 0.5px; }
        .pdp-longdesc { font-size: 14px; color: #c3bcd4; line-height: 1.85; white-space: pre-line; }

        .pdp-spec-group { margin-bottom: 22px; }
        .pdp-spec-group:last-child { margin-bottom: 0; }
        .pdp-spec-group-title { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 1px; text-transform: uppercase; color: #8B5CF6; font-weight: 700; margin-bottom: 10px; }
        .pdp-specs { display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,92,246,0.25); }
        .pdp-spec-row { display: flex; justify-content: space-between; gap: 16px; padding: 13px 18px; font-size: 13px; }
        .pdp-spec-row:nth-child(odd) { background: rgba(255,255,255,0.025); }
        .pdp-spec-label { color: #9b92ad; font-weight: 600; }
        .pdp-spec-value { color: #fff; font-weight: 700; text-align: right; }

        .pdp-related { max-width: 1120px; }
        .pdp-related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 18px; }
        .pdp-related-card { text-decoration: none; color: inherit; border-radius: 16px; overflow: hidden; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(139,92,246,0.25); transition: transform 0.2s ease, border-color 0.2s ease; display: block; }
        .pdp-related-card:hover { transform: translateY(-4px); border-color: rgba(233,30,140,0.5); }
        .pdp-related-img { height: 120px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; }
        .pdp-related-img img { width: 100%; height: 100%; object-fit: cover; }
        .pdp-related-name { font-size: 12.5px; font-weight: 700; padding: 12px 14px 4px; }
        .pdp-related-price { font-family: 'Audiowide', cursive; font-size: 13px; color: #F4D03F; padding: 0 14px 14px; }

        .pdp-footer { text-align: center; padding: 34px 6vw; border-top: 1px solid rgba(139,92,246,0.15); font-size: 12px; color: #6c6480; }

        @media (max-width: 800px) {
          .pdp-top { grid-template-columns: 1fr; gap: 32px; }
          .pdp-tabs-bar { top: 61px; }
        }
      `}</style>
    </div>
  )
}
