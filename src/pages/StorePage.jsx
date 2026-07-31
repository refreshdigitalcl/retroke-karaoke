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

var CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'microfonos', label: '🎤 Micrófonos' },
  { id: 'parlantes', label: '🔊 Parlantes y sets' },
  { id: 'luces', label: '✨ Luces' }
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
    } catch (e) {
      return []
    }
  })
  var cart = cartState[0]
  var setCart = cartState[1]

  useEffect(function () {
    try {
      window.localStorage.setItem('retroke_cart', JSON.stringify(cart))
    } catch (e) {}
  }, [cart])

  function addToCart(product) {
    setCart(function (prev) {
      var existing = prev.find(function (i) { return i.id === product.id })
      if (existing) {
        return prev.map(function (i) {
          return i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        })
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity: 1 }]
    })
  }

  function updateQuantity(id, quantity) {
    if (quantity <= 0) {
      setCart(function (prev) { return prev.filter(function (i) { return i.id !== id }) })
      return
    }
    setCart(function (prev) { return prev.map(function (i) { return i.id === id ? { ...i, quantity: quantity } : i } ) })
  }

  function clearCart() { setCart([]) }

  return { cart, addToCart, updateQuantity, clearCart }
}

function CheckoutDrawer(props) {
  var cart = props.cart
  var updateQuantity = props.updateQuantity
  var settings = props.settings
  var onClose = props.onClose

  var nameState = useState('')
  var name = nameState[0]
  var setName = nameState[1]
  var phoneState = useState('')
  var phone = phoneState[0]
  var setPhone = phoneState[1]
  var emailState = useState('')
  var email = emailState[0]
  var setEmail = emailState[1]
  var addressState = useState('')
  var address = addressState[0]
  var setAddress = addressState[1]
  var cityState = useState('')
  var city = cityState[0]
  var setCity = cityState[1]
  var regionState = useState('')
  var region = regionState[0]
  var setRegion = regionState[1]

  var submittingState = useState(false)
  var submitting = submittingState[0]
  var setSubmitting = submittingState[1]
  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  var subtotal = cart.reduce(function (sum, i) { return sum + i.price * i.quantity }, 0)
  var threshold = settings.free_shipping_threshold || 50000
  var flatFee = settings.shipping_flat_fee || 3990
  var shipping = subtotal >= threshold ? 0 : flatFee
  var total = subtotal + shipping

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
        if (data.error) {
          setSubmitting(false)
          setError(data.error)
          return
        }
        window.localStorage.removeItem('retroke_cart')
        window.location.href = data.init_point
      })
      .catch(function () {
        setSubmitting(false)
        setError('No se pudo iniciar el pago. Intenta de nuevo.')
      })
  }

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={function (e) { e.stopPropagation() }}>
        <div className="cart-drawer-header">
          <p className="cart-drawer-title">Tu carrito</p>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {cart.length === 0 ? (
          <p className="store-empty">Tu carrito está vacío.</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(function (i) {
                return (
                  <div className="cart-item" key={i.id}>
                    <div className="cart-item-img">
                      {i.image_url ? <img src={i.image_url} alt="" /> : <span>📦</span>}
                    </div>
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
              <div className="cart-total-row"><span>Subtotal</span><span>${subtotal.toLocaleString('es-CL')}</span></div>
              <div className="cart-total-row">
                <span>Envío</span>
                <span>{shipping === 0 ? 'Gratis 🎉' : '$' + shipping.toLocaleString('es-CL')}</span>
              </div>
              {shipping > 0 && (
                <p className="cart-shipping-note">
                  Envío gratis en pedidos sobre ${threshold.toLocaleString('es-CL')}
                </p>
              )}
              <div className="cart-total-row cart-total-final"><span>Total</span><span>${total.toLocaleString('es-CL')}</span></div>
            </div>

            <div className="cart-form">
              <p className="cart-form-title">Datos de envío</p>
              <input value={name} onChange={function (e) { setName(e.target.value) }} placeholder="Nombre completo" className="cart-input" />
              <input value={phone} onChange={function (e) { setPhone(e.target.value) }} placeholder="Teléfono" className="cart-input" />
              <input value={email} onChange={function (e) { setEmail(e.target.value) }} placeholder="Correo (opcional)" className="cart-input" />
              <input value={address} onChange={function (e) { setAddress(e.target.value) }} placeholder="Dirección (calle, número, depto)" className="cart-input" />
              <div className="cart-input-row">
                <input value={city} onChange={function (e) { setCity(e.target.value) }} placeholder="Comuna" className="cart-input" />
                <input value={region} onChange={function (e) { setRegion(e.target.value) }} placeholder="Región" className="cart-input" />
              </div>
              {error && <p className="cart-error">{error}</p>}
              <button onClick={handleCheckout} disabled={submitting} className="store-btn store-btn-primary full">
                {submitting ? 'Redirigiendo a Mercado Pago...' : '🔒 Pagar con Mercado Pago'}
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
  var products = productsState[0]
  var setProducts = productsState[1]

  var whatsappState = useState('')
  var whatsapp = whatsappState[0]
  var setWhatsapp = whatsappState[1]

  var settingsState = useState({})
  var settings = settingsState[0]
  var setSettings = settingsState[1]

  var categoryState = useState('todos')
  var category = categoryState[0]
  var setCategory = categoryState[1]

  var cartOpenState = useState(false)
  var cartOpen = cartOpenState[0]
  var setCartOpen = cartOpenState[1]

  var cartHook = useCart()
  var cart = cartHook.cart
  var addToCart = cartHook.addToCart
  var updateQuantity = cartHook.updateQuantity

  useEffect(function () {
    supabase
      .from('store_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('created_at', { ascending: false })
      .then(function (result) {
        setProducts(result.data || [])
      })
    supabase
      .from('store_settings')
      .select('whatsapp_number, shipping_flat_fee, free_shipping_threshold')
      .eq('id', 1)
      .maybeSingle()
      .then(function (result) {
        if (result.data) {
          setWhatsapp(result.data.whatsapp_number || '')
          setSettings(result.data)
        }
      })
  }, [])

  var filtered = products ? products.filter(function (p) {
    return category === 'todos' || p.category === category
  }) : []

  var cartCount = cart.reduce(function (sum, i) { return sum + i.quantity }, 0)

  return (
    <div className="retroke-store">
      <nav className="store-nav">
        <a href="/inicio" className="store-logo-link">
          <img src="/landing/retroke-logo.png" alt="Retroke" className="store-logo-img" />
        </a>
        <div className="store-nav-actions">
          <a href="/precios" className="store-btn store-btn-ghost small">Ver planes</a>
          <button className="store-cart-btn" onClick={function () { setCartOpen(true) }}>
            🛒 {cartCount > 0 && <span className="store-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      <header className="store-hero">
        <div className="store-glow glow-magenta" />
        <div className="store-glow glow-purple" />
        <p className="store-eyebrow">✨ Equípate para el show</p>
        <h1 className="store-title">TIENDA RETROKE</h1>
        <p className="store-sub">
          Micrófonos, parlantes y luces para llevar tu karaoke al siguiente nivel —
          en casa, en tu bar, o donde sea que armes el show.
        </p>
        {settings.free_shipping_threshold && (
          <p className="store-shipping-banner">
            🚚 Envío gratis en pedidos sobre ${Number(settings.free_shipping_threshold).toLocaleString('es-CL')}
          </p>
        )}
      </header>

      <div className="store-filters">
        {CATEGORIES.map(function (c) {
          return (
            <button
              key={c.id}
              onClick={function () { setCategory(c.id) }}
              className={'store-filter' + (category === c.id ? ' active' : '')}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      <main className="store-grid-wrap">
        {products === null ? (
          <p className="store-empty">Cargando productos...</p>
        ) : filtered.length === 0 ? (
          <p className="store-empty">Todavía no hay productos en esta categoría. Vuelve pronto ✨</p>
        ) : (
          <div className="store-grid">
            {filtered.map(function (p) {
              var link = waLink(whatsapp, p)
              return (
                <div className="store-card" key={p.id}>
                  <div className="store-card-img">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" />
                    ) : (
                      <span className="store-card-placeholder">📦</span>
                    )}
                    {!p.in_stock && <span className="store-badge-outstock">Sin stock</span>}
                  </div>
                  <div className="store-card-body">
                    <p className="store-card-name">{p.name}</p>
                    {p.description && <p className="store-card-desc">{p.description}</p>}
                    <p className="store-card-price">${p.price.toLocaleString('es-CL')}</p>
                    {p.in_stock ? (
                      <>
                        <button onClick={function () { addToCart(p); setCartOpen(true) }} className="store-btn store-btn-primary full">
                          🛒 Agregar al carrito
                        </button>
                        {link && (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="store-btn store-btn-ghost full small">
                            💬 Consultar por WhatsApp
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="store-btn store-btn-disabled full">Sin stock</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {cartOpen && (
        <CheckoutDrawer
          cart={cart}
          updateQuantity={updateQuantity}
          settings={settings}
          onClose={function () { setCartOpen(false) }}
        />
      )}

      <footer className="store-footer">
        <p>© {new Date().getFullYear()} Retroke. El karaoke se vive diferente.</p>
      </footer>

      <style>{`
        .retroke-store { background: #060309; color: #fff; font-family: 'Manrope', sans-serif; min-height: 100vh; }
        .retroke-store * { box-sizing: border-box; }

        .store-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 6vw; position: sticky; top: 0; z-index: 20; background: rgba(6,3,9,0.85); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(139,92,246,0.2); }
        .store-logo-img { height: 40px; width: auto; display: block; }

        .store-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 700; font-size: 13.5px; text-decoration: none; padding: 10px 20px; cursor: pointer; border: none; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .store-btn.small { padding: 8px 16px; font-size: 12.5px; }
        .store-btn.full { width: 100%; margin-top: 14px; }
        .store-btn-primary { background: linear-gradient(90deg, #25D366, #1EBE5A); color: #06210f; box-shadow: 0 0 20px -4px rgba(37,211,102,0.6); }
        .store-btn-primary:hover { transform: translateY(-2px); }
        .store-btn-ghost { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(139,92,246,0.5); }
        .store-btn-disabled { background: rgba(255,255,255,0.05); color: #7a7290; cursor: not-allowed; }

        .store-hero { position: relative; text-align: center; padding: 70px 6vw 40px; overflow: hidden; }
        .store-glow { position: absolute; width: 26rem; height: 26rem; border-radius: 999px; filter: blur(90px); opacity: 0.3; pointer-events: none; }
        .glow-magenta { background: #E91E8C; top: -6rem; left: -6rem; }
        .glow-purple { background: #8B5CF6; top: -6rem; right: -6rem; }
        .store-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #F4D03F; margin-bottom: 16px; font-weight: 600; position: relative; z-index: 2; }
        .store-title { font-family: 'Audiowide', cursive; font-size: clamp(2rem, 5vw, 3.2rem); margin-bottom: 16px; position: relative; z-index: 2; background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .store-sub { font-size: 15.5px; color: #c3bcd4; max-width: 520px; margin: 0 auto; line-height: 1.7; position: relative; z-index: 2; }

        .store-filters { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; padding: 0 6vw 36px; }
        .store-filter { padding: 9px 18px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(139,92,246,0.3); color: #c3bcd4; font-size: 13px; font-weight: 700; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease; }
        .store-filter.active { border-color: #F4D03F; color: #F4D03F; background: rgba(244,208,63,0.1); }

        .store-grid-wrap { padding: 0 6vw 80px; max-width: 1200px; margin: 0 auto; }
        .store-empty { text-align: center; color: #9b92ad; font-size: 14px; padding: 60px 0; }
        .store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 22px; }
        .store-card { border-radius: 20px; overflow: hidden; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(139,92,246,0.3); transition: transform 0.2s ease, border-color 0.2s ease; }
        .store-card:hover { transform: translateY(-5px); border-color: #E91E8C; }
        .store-card-img { position: relative; height: 170px; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; }
        .store-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .store-card-placeholder { font-size: 40px; opacity: 0.4; }
        .store-badge-outstock { position: absolute; top: 10px; right: 10px; background: #E9544A; color: #fff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; }
        .store-card-body { padding: 18px 18px 20px; }
        .store-card-name { font-weight: 800; font-size: 14.5px; margin-bottom: 6px; }
        .store-card-desc { font-size: 12.5px; color: #a79fbb; line-height: 1.5; margin-bottom: 10px; }
        .store-card-price { font-family: 'Audiowide', cursive; font-size: 17px; color: #F4D03F; }

        .store-footer { text-align: center; padding: 30px 6vw; border-top: 1px solid rgba(139,92,246,0.15); font-size: 12px; color: #6c6480; }

        .store-nav-actions { display: flex; align-items: center; gap: 12px; }
        .store-cart-btn { position: relative; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(139,92,246,0.5); border-radius: 999px; width: 40px; height: 40px; font-size: 17px; cursor: pointer; }
        .store-cart-badge { position: absolute; top: -4px; right: -4px; background: #E91E8C; color: #fff; font-size: 10px; font-weight: 800; width: 18px; height: 18px; border-radius: 999px; display: flex; align-items: center; justify-content: center; }
        .store-shipping-banner { display: inline-block; margin-top: 18px; padding: 8px 18px; border-radius: 999px; background: rgba(126,217,87,0.12); border: 1.5px solid rgba(126,217,87,0.4); color: #7ED957; font-size: 12.5px; font-weight: 700; position: relative; z-index: 2; }
        .store-btn.small.full { margin-top: 8px; }

        .cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 100; display: flex; justify-content: flex-end; }
        .cart-drawer { width: min(420px, 100%); height: 100%; background: #0d0813; border-left: 1.5px solid rgba(139,92,246,0.3); overflow-y: auto; padding: 22px; }
        .cart-drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .cart-drawer-title { font-family: 'Audiowide', cursive; font-size: 17px; }
        .cart-close { background: none; border: none; color: #c3bcd4; font-size: 18px; cursor: pointer; }
        .cart-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .cart-item { display: flex; align-items: center; gap: 12px; }
        .cart-item-img { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item-info { flex: 1; min-width: 0; }
        .cart-item-name { font-size: 13px; font-weight: 700; }
        .cart-item-price { font-size: 12px; color: #9b92ad; }
        .cart-qty { display: flex; align-items: center; gap: 8px; }
        .cart-qty button { width: 24px; height: 24px; border-radius: 999px; border: 1.5px solid rgba(139,92,246,0.4); background: none; color: #fff; cursor: pointer; font-size: 14px; }
        .cart-qty span { font-size: 13px; font-weight: 700; min-width: 16px; text-align: center; }

        .cart-totals { border-top: 1px solid rgba(139,92,246,0.25); padding-top: 14px; margin-bottom: 20px; }
        .cart-total-row { display: flex; justify-content: space-between; font-size: 13px; color: #c3bcd4; margin-bottom: 6px; }
        .cart-total-final { font-family: 'Audiowide', cursive; font-size: 16px; color: #F4D03F; margin-top: 8px; }
        .cart-shipping-note { font-size: 11px; color: #7a7290; margin-bottom: 6px; }

        .cart-form { display: flex; flex-direction: column; gap: 10px; }
        .cart-form-title { font-weight: 800; font-size: 13.5px; margin-bottom: 2px; }
        .cart-input { height: 42px; border-radius: 10px; padding: 0 12px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(139,92,246,0.3); color: #fff; font-size: 13px; outline: none; }
        .cart-input-row { display: flex; gap: 10px; }
        .cart-input-row .cart-input { flex: 1; }
        .cart-error { color: #E9544A; font-size: 12px; }
      `}</style>
    </div>
  )
}
