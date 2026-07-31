import { useEffect, useRef, useState } from 'react'
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

function Reveal(props) {
  var ref = useRef(null)
  var visibleState = useState(false)
  var visible = visibleState[0]
  var setVisible = visibleState[1]
  useEffect(function () {
    var el = ref.current
    if (!el) return
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    observer.observe(el)
    return function () { observer.disconnect() }
  }, [])
  return <div ref={ref} className={'store-reveal' + (visible ? ' visible' : '')}>{props.children}</div>
}

var CATEGORIES = [
  { id: 'todos', label: 'Todos', icon: '✨' },
  { id: 'microfonos', label: 'Micrófonos', icon: '🎤' },
  { id: 'parlantes', label: 'Parlantes y sets', icon: '🔊' },
  { id: 'luces', label: 'Luces', icon: '💡' }
]

function waLink(whatsapp, product) {
  if (!whatsapp) return null
  var digits = whatsapp.replace(/[^0-9]/g, '')
  var text = encodeURIComponent('Hola! Me interesa el producto "' + product.name + '" ($' + product.price.toLocaleString('es-CL') + ') que vi en la tienda de Retroke.')
  return 'https://wa.me/' + digits + '?text=' + text
}

function useCart() {
  var cartState = useState(function () {
    try {
      var saved = window.localStorage.getItem('retroke_cart')
      return saved ? JSON.parse(saved) : []
    } catch (e) { return [] }
  })
  var cart = cartState[0]
  var setCart = cartState[1]

  useEffect(function () {
    try { window.localStorage.setItem('retroke_cart', JSON.stringify(cart)) } catch (e) {}
  }, [cart])

  function addToCart(product) {
    setCart(function (prev) {
      var existing = prev.find(function (i) { return i.id === product.id })
      if (existing) {
        return prev.map(function (i) { return i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i })
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity: 1 }]
    })
  }

  function updateQuantity(id, quantity) {
    if (quantity <= 0) {
      setCart(function (prev) { return prev.filter(function (i) { return i.id !== id }) })
      return
    }
    setCart(function (prev) { return prev.map(function (i) { return i.id === id ? { ...i, quantity: quantity } : i }) })
  }

  return { cart: cart, addToCart: addToCart, updateQuantity: updateQuantity }
}

function ProductCard(props) {
  var p = props.product
  var whatsapp = props.whatsapp
  var onAdd = props.onAdd
  var link = waLink(whatsapp, p)

  return (
    <div className="pcard">
      <div className="pcard-img">
        {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" /> : <span className="pcard-placeholder">📦</span>}
        {!p.in_stock && <span className="pcard-badge">Sin stock</span>}
        <span className="pcard-glow" />
      </div>
      <div className="pcard-body">
        <p className="pcard-name">{p.name}</p>
        {p.description && <p className="pcard-desc">{p.description}</p>}
        <p className="pcard-price">${p.price.toLocaleString('es-CL')}</p>
        {p.in_stock ? (
          <div className="pcard-actions">
            <button onClick={onAdd} className="pbtn pbtn-primary">🛒 Agregar</button>
            {link && <a href={link} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-ghost" title="Consultar por WhatsApp">💬</a>}
          </div>
        ) : (
          <button className="pbtn pbtn-disabled" disabled>Sin stock</button>
        )}
      </div>
    </div>
  )
}

function CartDrawer(props) {
  var cart = props.cart
  var updateQuantity = props.updateQuantity
  var settings = props.settings
  var onClose = props.onClose

  var stepState = useState('cart')
  var step = stepState[0]
  var setStep = stepState[1]

  var nameState = useState('')
  var name = nameState[0]; var setName = nameState[1]
  var phoneState = useState('')
  var phone = phoneState[0]; var setPhone = phoneState[1]
  var emailState = useState('')
  var email = emailState[0]; var setEmail = emailState[1]
  var addressState = useState('')
  var address = addressState[0]; var setAddress = addressState[1]
  var cityState = useState('')
  var city = cityState[0]; var setCity = cityState[1]
  var regionState = useState('')
  var region = regionState[0]; var setRegion = regionState[1]

  var submittingState = useState(false)
  var submitting = submittingState[0]; var setSubmitting = submittingState[1]
  var errorState = useState('')
  var error = errorState[0]; var setError = errorState[1]

  var subtotal = cart.reduce(function (sum, i) { return sum + i.price * i.quantity }, 0)
  var threshold = settings.free_shipping_threshold || 50000
  var flatFee = settings.shipping_flat_fee || 3990
  var shipping = subtotal >= threshold ? 0 : flatFee
  var total = subtotal + shipping
  var missing = Math.max(0, threshold - subtotal)

  function handleCheckout() {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !region.trim()) {
      setError('Completa todos los datos de envío para continuar.')
      return
    }
    setSubmitting(true)
    setError('')
    fetch('/api/create-store-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(function (i) { return { id: i.id, quantity: i.quantity } }),
        customer: { name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim(), city: city.trim(), region: region.trim() }
      })
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.error) { setSubmitting(false); setError(data.error); return }
        window.localStorage.removeItem('retroke_cart')
        window.location.href = data.init_point
      })
      .catch(function () { setSubmitting(false); setError('No se pudo iniciar el pago. Intenta de nuevo.') })
  }

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={function (e) { e.stopPropagation() }}>
        <div className="cart-header">
          <p className="cart-title">{step === 'cart' ? 'Tu carrito' : 'Datos de envío'}</p>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <span>🛒</span>
            <p>Tu carrito está vacío</p>
          </div>
        ) : step === 'cart' ? (
          <>
            <div className="cart-items">
              {cart.map(function (i) {
                return (
                  <div className="cart-item" key={i.id}>
                    <div className="cart-item-img">{i.image_url ? <img src={i.image_url} alt="" /> : <span>📦</span>}</div>
                    <div className="cart-item-info">
                      <p className="cart-item-name">{i.name}</p>
                      <p className="cart-item-price">${i.price.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="cart-qty">
                      <button onClick={function () { updateQuantity(i.id, i.quantity - 1) }}>−</button>
                      <span>{i.quantity}</span>
                      <button onClick={function () { updateQuantity(i.id, i.quantity + 1) }}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cart-totals">
              {missing > 0 ? (
                <p className="cart-shipping-hint">Agrega ${missing.toLocaleString('es-CL')} más y el envío es gratis 🚚</p>
              ) : (
                <p className="cart-shipping-hint success">🎉 ¡Envío gratis!</p>
              )}
              <div className="cart-row"><span>Subtotal</span><span>${subtotal.toLocaleString('es-CL')}</span></div>
              <div className="cart-row"><span>Envío</span><span>{shipping === 0 ? 'Gratis' : '$' + shipping.toLocaleString('es-CL')}</span></div>
              <div className="cart-row cart-row-total"><span>Total</span><span>${total.toLocaleString('es-CL')}</span></div>
            </div>
            <button className="pbtn pbtn-primary full" onClick={function () { setStep('form') }}>Continuar →</button>
          </>
        ) : (
          <>
            <div className="cart-form">
              <input value={name} onChange={function (e) { setName(e.target.value) }} placeholder="Nombre completo" className="cart-input" />
              <input value={phone} onChange={function (e) { setPhone(e.target.value) }} placeholder="Teléfono" className="cart-input" />
              <input value={email} onChange={function (e) { setEmail(e.target.value) }} placeholder="Correo (opcional)" className="cart-input" />
              <input value={address} onChange={function (e) { setAddress(e.target.value) }} placeholder="Dirección (calle, número, depto)" className="cart-input" />
              <div className="cart-input-row">
                <input value={city} onChange={function (e) { setCity(e.target.value) }} placeholder="Comuna" className="cart-input" />
                <input value={region} onChange={function (e) { setRegion(e.target.value) }} placeholder="Región" className="cart-input" />
              </div>
              {error && <p className="cart-error">{error}</p>}
            </div>
            <div className="cart-form-actions">
              <button className="pbtn pbtn-ghost" onClick={function () { setStep('cart') }}>← Volver</button>
              <button className="pbtn pbtn-primary" onClick={handleCheckout} disabled={submitting}>
                {submitting ? 'Redirigiendo...' : '🔒 Pagar $' + total.toLocaleString('es-CL')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function StorePage() {
  useGoogleFonts()

  var productsState = useState(null)
  var products = productsState[0]; var setProducts = productsState[1]
  var whatsappState = useState('')
  var whatsapp = whatsappState[0]; var setWhatsapp = whatsappState[1]
  var settingsState = useState({})
  var settings = settingsState[0]; var setSettings = settingsState[1]
  var categoryState = useState('todos')
  var category = categoryState[0]; var setCategory = categoryState[1]
  var cartOpenState = useState(false)
  var cartOpen = cartOpenState[0]; var setCartOpen = cartOpenState[1]

  var cartHook = useCart()
  var cart = cartHook.cart
  var addToCart = cartHook.addToCart
  var updateQuantity = cartHook.updateQuantity

  useEffect(function () {
    supabase.from('store_products').select('*').eq('is_active', true).order('sort_order').order('created_at', { ascending: false })
      .then(function (result) { setProducts(result.data || []) })
    supabase.from('store_settings').select('whatsapp_number, shipping_flat_fee, free_shipping_threshold').eq('id', 1).maybeSingle()
      .then(function (result) {
        if (result.data) { setWhatsapp(result.data.whatsapp_number || ''); setSettings(result.data) }
      })
  }, [])

  var filtered = products ? products.filter(function (p) { return category === 'todos' || p.category === category }) : []
  var cartCount = cart.reduce(function (sum, i) { return sum + i.quantity }, 0)

  return (
    <div className="retroke-store">
      <nav className="store-nav">
        <a href="/inicio" className="store-logo-link">
          <img src="/landing/retroke-logo.png" alt="Retroke" className="store-logo-img" />
        </a>
        <div className="store-nav-actions">
          <a href="/precios" className="store-navlink">Planes</a>
          <button className="store-cart-btn" onClick={function () { setCartOpen(true) }}>
            🛒{cartCount > 0 && <span className="store-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      <header className="store-hero">
        <div className="store-glow glow-magenta" />
        <div className="store-glow glow-purple" />
        <div className="store-scanlines" />
        <p className="store-eyebrow">✨ Equípate para el show</p>
        <h1 className="store-title">TIENDA RETROKE</h1>
        <p className="store-sub">
          Micrófonos, parlantes y luces para llevar tu karaoke al siguiente nivel —
          en casa, en tu bar, o donde sea que armes el show.
        </p>
        {settings.free_shipping_threshold ? (
          <p className="store-shipping-banner">
            🚚 Envío gratis en pedidos sobre ${Number(settings.free_shipping_threshold).toLocaleString('es-CL')}
          </p>
        ) : null}
      </header>

      <div className="store-filters">
        {CATEGORIES.map(function (c) {
          return (
            <button key={c.id} onClick={function () { setCategory(c.id) }} className={'store-filter' + (category === c.id ? ' active' : '')}>
              <span>{c.icon}</span> {c.label}
            </button>
          )
        })}
      </div>

      <main className="store-main">
        {products === null ? (
          <div className="store-loading">
            <div className="store-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="store-empty-state">
            <span>🎤</span>
            <p>Todavía no hay productos en esta categoría.</p>
            <p className="dim">Vuelve pronto ✨</p>
          </div>
        ) : (
          <div className="store-grid">
            {filtered.map(function (p, i) {
              return (
                <Reveal key={p.id}>
                  <ProductCard product={p} whatsapp={whatsapp} onAdd={function () { addToCart(p); setCartOpen(true) }} />
                </Reveal>
              )
            })}
          </div>
        )}
      </main>

      {cartOpen && <CartDrawer cart={cart} updateQuantity={updateQuantity} settings={settings} onClose={function () { setCartOpen(false) }} />}

      <footer className="store-footer">
        <p>© {new Date().getFullYear()} Retroke. El karaoke se vive diferente.</p>
      </footer>

      <style>{`
        .retroke-store { background: #060309; color: #fff; font-family: 'Manrope', sans-serif; min-height: 100vh; overflow-x: hidden; }
        .retroke-store * { box-sizing: border-box; }
        .store-reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .store-reveal.visible { opacity: 1; transform: translateY(0); }

        .store-nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 6vw; position: sticky; top: 0; z-index: 30; background: rgba(6,3,9,0.85); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(139,92,246,0.2); }
        .store-logo-img { height: 40px; width: auto; display: block; }
        .store-nav-actions { display: flex; align-items: center; gap: 18px; }
        .store-navlink { color: #c3bcd4; text-decoration: none; font-size: 13.5px; font-weight: 700; }
        .store-navlink:hover { color: #fff; }
        .store-cart-btn { position: relative; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(139,92,246,0.5); border-radius: 999px; width: 42px; height: 42px; font-size: 17px; cursor: pointer; transition: border-color 0.15s ease, transform 0.15s ease; }
        .store-cart-btn:hover { border-color: #E91E8C; transform: translateY(-1px); }
        .store-cart-badge { position: absolute; top: -5px; right: -5px; background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff; font-size: 10px; font-weight: 800; width: 19px; height: 19px; border-radius: 999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px -1px rgba(233,30,140,0.8); }

        .store-hero { position: relative; text-align: center; padding: 74px 6vw 44px; overflow: hidden; }
        .store-glow { position: absolute; width: 28rem; height: 28rem; border-radius: 999px; filter: blur(95px); opacity: 0.3; pointer-events: none; }
        .glow-magenta { background: #E91E8C; top: -7rem; left: -7rem; }
        .glow-purple { background: #8B5CF6; top: -7rem; right: -7rem; }
        .store-scanlines { position: absolute; inset: 0; pointer-events: none; opacity: 0.04; background-image: repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px); }
        .store-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #F4D03F; margin-bottom: 16px; font-weight: 600; position: relative; z-index: 2; }
        .store-title { font-family: 'Audiowide', cursive; font-size: clamp(2.1rem, 5.5vw, 3.4rem); margin-bottom: 16px; position: relative; z-index: 2; letter-spacing: 1px; background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 60px rgba(233,30,140,0.3); }
        .store-sub { font-size: 15.5px; color: #c3bcd4; max-width: 520px; margin: 0 auto; line-height: 1.7; position: relative; z-index: 2; }
        .store-shipping-banner { display: inline-block; margin-top: 20px; padding: 9px 20px; border-radius: 999px; background: rgba(126,217,87,0.1); border: 1.5px solid rgba(126,217,87,0.4); color: #7ED957; font-size: 12.5px; font-weight: 700; position: relative; z-index: 2; }

        .store-filters { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; padding: 0 6vw 40px; }
        .store-filter { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 999px; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(139,92,246,0.3); color: #c3bcd4; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .store-filter:hover { border-color: rgba(233,30,140,0.5); color: #fff; }
        .store-filter.active { border-color: #F4D03F; color: #F4D03F; background: rgba(244,208,63,0.1); box-shadow: 0 0 20px -6px rgba(244,208,63,0.6); }

        .store-main { padding: 0 6vw 90px; max-width: 1240px; margin: 0 auto; min-height: 300px; }
        .store-loading { display: flex; justify-content: center; padding: 80px 0; }
        .store-spinner { width: 32px; height: 32px; border: 3px solid rgba(139,92,246,0.25); border-top-color: #E91E8C; border-radius: 999px; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .store-empty-state { text-align: center; padding: 70px 0; color: #9b92ad; }
        .store-empty-state span { font-size: 40px; display: block; margin-bottom: 14px; }
        .store-empty-state .dim { font-size: 13px; color: #6c6480; margin-top: 4px; }

        .store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 22px; }

        .pcard { border-radius: 22px; overflow: hidden; background: linear-gradient(160deg, rgba(139,92,246,0.08), rgba(255,255,255,0.02)); border: 1.5px solid rgba(139,92,246,0.28); transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
        .pcard:hover { transform: translateY(-6px); border-color: rgba(233,30,140,0.55); box-shadow: 0 20px 50px -20px rgba(233,30,140,0.4); }
        .pcard-img { position: relative; height: 180px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .pcard-img img { width: 100%; height: 100%; object-fit: cover; }
        .pcard-placeholder { font-size: 42px; opacity: 0.35; }
        .pcard-glow { position: absolute; inset: 0; background: radial-gradient(circle at 50% 100%, rgba(233,30,140,0.15), transparent 70%); pointer-events: none; }
        .pcard-badge { position: absolute; top: 12px; right: 12px; background: #E9544A; color: #fff; font-size: 10px; font-weight: 800; padding: 5px 11px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.3px; }
        .pcard-body { padding: 18px 18px 20px; }
        .pcard-name { font-weight: 800; font-size: 14.5px; margin-bottom: 6px; line-height: 1.3; }
        .pcard-desc { font-size: 12.5px; color: #a79fbb; line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pcard-price { font-family: 'Audiowide', cursive; font-size: 18px; color: #F4D03F; margin-bottom: 14px; }
        .pcard-actions { display: flex; gap: 8px; }

        .pbtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 999px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; padding: 11px 18px; transition: transform 0.15s ease, box-shadow 0.15s ease; text-decoration: none; }
        .pbtn.full { width: 100%; }
        .pbtn-primary { background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff; box-shadow: 0 0 20px -6px rgba(233,30,140,0.7); flex: 1; }
        .pbtn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 26px -6px rgba(233,30,140,0.9); }
        .pbtn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .pbtn-ghost { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(139,92,246,0.4); padding: 11px 14px; }
        .pbtn-ghost:hover { border-color: #8B5CF6; }
        .pbtn-disabled { background: rgba(255,255,255,0.04); color: #6c6480; width: 100%; cursor: not-allowed; }

        .store-footer { text-align: center; padding: 34px 6vw; border-top: 1px solid rgba(139,92,246,0.15); font-size: 12px; color: #6c6480; }

        .cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: flex-end; backdrop-filter: blur(2px); }
        .cart-drawer { width: min(420px, 100%); height: 100%; background: #0b0710; border-left: 1.5px solid rgba(139,92,246,0.35); overflow-y: auto; padding: 22px; display: flex; flex-direction: column; }
        .cart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .cart-title { font-family: 'Audiowide', cursive; font-size: 16px; }
        .cart-close { background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3); width: 30px; height: 30px; border-radius: 999px; color: #c3bcd4; font-size: 14px; cursor: pointer; }
        .cart-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6c6480; gap: 10px; }
        .cart-empty span { font-size: 36px; opacity: 0.5; }

        .cart-items { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
        .cart-item { display: flex; align-items: center; gap: 12px; }
        .cart-item-img { width: 50px; height: 50px; border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item-info { flex: 1; min-width: 0; }
        .cart-item-name { font-size: 13px; font-weight: 700; }
        .cart-item-price { font-size: 12px; color: #9b92ad; }
        .cart-qty { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border-radius: 999px; padding: 4px 8px; }
        .cart-qty button { width: 22px; height: 22px; border-radius: 999px; border: none; background: rgba(139,92,246,0.25); color: #fff; cursor: pointer; font-size: 14px; }
        .cart-qty span { font-size: 13px; font-weight: 700; min-width: 14px; text-align: center; }

        .cart-totals { border-top: 1px solid rgba(139,92,246,0.25); padding-top: 16px; margin-bottom: 16px; }
        .cart-shipping-hint { font-size: 11.5px; color: #F4D03F; margin-bottom: 10px; font-weight: 600; }
        .cart-shipping-hint.success { color: #7ED957; }
        .cart-row { display: flex; justify-content: space-between; font-size: 13px; color: #c3bcd4; margin-bottom: 6px; }
        .cart-row-total { font-family: 'Audiowide', cursive; font-size: 16px; color: #F4D03F; margin-top: 8px; }

        .cart-form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .cart-input { height: 44px; border-radius: 12px; padding: 0 14px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(139,92,246,0.3); color: #fff; font-size: 13px; outline: none; }
        .cart-input:focus { border-color: #8B5CF6; }
        .cart-input-row { display: flex; gap: 10px; }
        .cart-input-row .cart-input { flex: 1; }
        .cart-error { color: #E9544A; font-size: 12px; }
        .cart-form-actions { display: flex; gap: 10px; margin-top: auto; }

        @media (max-width: 560px) {
          .store-title { font-size: 1.9rem; }
        }
      `}</style>
    </div>
  )
}
