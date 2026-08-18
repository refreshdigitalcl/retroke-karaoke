import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

var GROUPS = [
  { type: 'HOME', emoji: '🏠', label: 'Home', desc: 'Karaoke en casa, con amigos y familia' },
  { type: 'BAR', emoji: '🍹', label: 'Bar', desc: 'Para locales y negocios de karaoke' },
  { type: 'DJ', emoji: '🎧', label: 'DJ Pro', desc: 'Para DJs que llevan karaoke a eventos' }
]

var FEATURE_COPY = {
  HOME: {
    FREE: [
      'Hasta 10 participantes por sesión',
      'Registro desde el celular',
      'Reacciones con emojis',
      'Calificación del público',
      'Cola de participantes',
      'Música de fondo (1 canción fija)',
      'Display para TV'
    ],
    PRO: [
      'Participantes ilimitados',
      'Retroke Live: transmite tu fiesta en vivo a Retroke World',
      'Análisis vocal Retroke Score',
      'Stickers en reacciones',
      'Música de fondo Retroke Songs',
      'Datos curiosos del artista',
      'Frases de calificación variadas',
      'Logo propio',
      'Vista previa de video',
      'Estadísticas avanzadas',
      'Historial de sesiones'
    ]
  },
  BAR: {
    FREE: [
      'Participantes ilimitados por sesión',
      'Panel DJ y display principal',
      'Registro desde QR',
      'Reacciones con emojis',
      'Calificaciones del público',
      'Música de fondo (1 canción fija)'
    ],
    PRO: [
      'Retroke Live: transmite el show en vivo a Retroke World',
      'Stickers en reacciones',
      'Música de fondo Retroke Songs',
      'Datos curiosos del artista',
      'Frases de calificación variadas',
      'Logo propio del local',
      'Vista previa de video',
      'Estadísticas y analítica avanzada',
      'Múltiples locales',
      'Historial'
    ]
  },
  DJ: {
    FREE: [
      'Hasta 2 eventos al mes',
      'Panel DJ completo',
      'Reacciones con emojis',
      'Calificaciones del público',
      'Música de fondo (1 canción fija)'
    ],
    PRO: [
      'Eventos ilimitados',
      'Retroke Live: transmite tus eventos en vivo a Retroke World',
      'Stickers en reacciones',
      'Música de fondo Retroke Songs',
      'Datos curiosos del artista',
      'Frases de calificación variadas',
      'Logo propio',
      'Vista previa de video',
      'Estadísticas avanzadas'
    ]
  }
}

// Tabla comparativa detallada: fila por fila, Free vs PRO, para cada modalidad.
// free/pro pueden ser: true (incluido), false (no incluido), o un texto (valor especifico).
var COMPARISON_TABLE = {
  HOME: [
    { label: 'Precio', free: 'Gratis', pro: '$8.990/mes' },
    { label: 'Participantes por sesión', free: '10', pro: 'Ilimitados' },
    { label: 'Cola de canciones', free: true, pro: true },
    { label: 'Calificación del público', free: true, pro: true },
    { label: 'Reacciones con emojis', free: true, pro: true },
    { label: 'Retroke Live (transmisión en vivo a Retroke World)', free: false, pro: true },
    { label: 'Stickers en reacciones', free: false, pro: true },
    { label: 'Música de fondo', free: '1 canción fija', pro: 'Retroke Songs' },
    { label: 'Datos curiosos del artista', free: false, pro: true },
    { label: 'Frases de calificación variadas', free: false, pro: true },
    { label: 'Logo propio', free: false, pro: true },
    { label: 'Vista previa de video', free: false, pro: true },
    { label: 'Estadísticas avanzadas', free: false, pro: true },
    { label: 'Historial de sesiones', free: false, pro: true },
    { label: 'Análisis vocal (Retroke Score)', free: false, pro: true }
  ],
  BAR: [
    { label: 'Precio', free: 'Gratis', pro: '$24.990/mes' },
    { label: 'Participantes por sesión', free: 'Ilimitados', pro: 'Ilimitados' },
    { label: 'Cola de canciones', free: true, pro: true },
    { label: 'Calificación del público', free: true, pro: true },
    { label: 'Reacciones con emojis', free: true, pro: true },
    { label: 'Retroke Live (transmisión en vivo a Retroke World)', free: false, pro: true },
    { label: 'Stickers en reacciones', free: false, pro: true },
    { label: 'Música de fondo', free: '1 canción fija', pro: 'Retroke Songs' },
    { label: 'Datos curiosos del artista', free: false, pro: true },
    { label: 'Frases de calificación variadas', free: false, pro: true },
    { label: 'Logo propio del local', free: false, pro: true },
    { label: 'Vista previa de video', free: false, pro: true },
    { label: 'Estadísticas avanzadas', free: false, pro: true },
    { label: 'Analítica avanzada', free: false, pro: true },
    { label: 'Múltiples locales', free: false, pro: true },
    { label: 'Historial', free: false, pro: true }
  ],
  DJ: [
    { label: 'Precio', free: 'Gratis', pro: '$19.990/mes' },
    { label: 'Eventos por mes', free: '2', pro: 'Ilimitados' },
    { label: 'Cola de canciones', free: true, pro: true },
    { label: 'Calificación del público', free: true, pro: true },
    { label: 'Reacciones con emojis', free: true, pro: true },
    { label: 'Retroke Live (transmisión en vivo a Retroke World)', free: false, pro: true },
    { label: 'Stickers en reacciones', free: false, pro: true },
    { label: 'Música de fondo', free: '1 canción fija', pro: 'Retroke Songs' },
    { label: 'Datos curiosos del artista', free: false, pro: true },
    { label: 'Frases de calificación variadas', free: false, pro: true },
    { label: 'Logo propio', free: false, pro: true },
    { label: 'Vista previa de video', free: false, pro: true },
    { label: 'Estadísticas avanzadas', free: false, pro: true }
  ]
}

function CellValue(props) {
  var v = props.value
  var isPro = props.isPro
  if (v === true) {
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full"
        style={{ background: isPro ? 'rgba(126,217,87,0.18)' : 'rgba(139,92,246,0.18)', color: isPro ? '#7ED957' : '#8B5CF6' }}
      >
        ✓
      </span>
    )
  }
  if (v === false) {
    return <span className="text-neutral-600">—</span>
  }
  return (
    <span className="font-bold" style={{ color: isPro ? '#F4D03F' : '#c9c3d6', fontSize: '13.5px' }}>
      {v}
    </span>
  )
}

function formatPrice(value) {
  if (!value || value === 0) return 'Gratis'
  return '$' + Number(value).toLocaleString('es-CL')
}

export default function PricingPage() {
  var plansState = useState(null)
  var plans = plansState[0]
  var setPlans = plansState[1]

  var activeGroupState = useState('BAR')
  var activeGroup = activeGroupState[0]
  var setActiveGroup = activeGroupState[1]

  useEffect(function () {
    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(function (result) {
        setPlans(result.data || [])
      })
  }, [])

  var groupPlans = plans
    ? plans.filter(function (p) { return p.workspace_type === activeGroup }).sort(function (a, b) { return a.sort_order - b.sort_order })
    : []

  return (
    <div className="min-h-screen relative overflow-hidden bg-black px-6 py-14 md:px-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.7) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="pointer-events-none fixed -top-40 -left-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#E91E8C' }} />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#8B5CF6' }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <img
            src="/landing/retroke-logo.png"
            alt="Retroke"
            className="mx-auto mb-6"
            style={{ width: 'min(240px, 55vw)', height: 'auto', filter: 'drop-shadow(0 0 24px rgba(233,30,140,0.5)) drop-shadow(0 0 46px rgba(139,92,246,0.35))' }}
          />
          <h1 className="pricing-title text-3xl md:text-5xl font-extrabold mb-4">
            Elige el plan perfecto para tu karaoke
          </h1>
          <p className="text-base md:text-lg text-neutral-300 max-w-xl mx-auto">
            Empieza gratis. Sube de nivel cuando quieras más funciones, sin ataduras.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 mb-10 flex-wrap">
          {GROUPS.map(function (g) {
            var isActive = activeGroup === g.type
            return (
              <button
                key={g.type}
                onClick={function () { setActiveGroup(g.type) }}
                className="px-5 py-2.5 rounded-full text-sm font-bold transition-all"
                style={{
                  background: isActive ? 'linear-gradient(90deg, #E91E8C, #8B5CF6)' : 'rgba(20,15,30,0.7)',
                  border: '2px solid ' + (isActive ? 'transparent' : 'rgba(139,92,246,0.4)'),
                  color: '#fff',
                  boxShadow: isActive ? '0 0 20px -4px rgba(233,30,140,0.7)' : 'none'
                }}
              >
                {g.emoji} {g.label}
              </button>
            )
          })}
        </div>

        {plans === null && (
          <p className="text-center text-neutral-400">Cargando planes...</p>
        )}

        {plans !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {groupPlans.map(function (plan) {
              var isPro = plan.code === 'PRO'
              var features = (FEATURE_COPY[activeGroup] && FEATURE_COPY[activeGroup][plan.code]) || []
              return (
                <div
                  key={plan.id}
                  className="rounded-3xl p-7 md:p-8 flex flex-col plan-card-in"
                  style={{
                    background: isPro ? 'linear-gradient(160deg, rgba(139,92,246,0.16), rgba(233,30,140,0.10))' : 'rgba(15,10,20,0.75)',
                    border: '2px solid ' + (isPro ? 'rgba(244,208,63,0.7)' : 'rgba(139,92,246,0.35)'),
                    boxShadow: isPro ? '0 0 40px -8px rgba(244,208,63,0.55)' : 'none'
                  }}
                >
                  {isPro && (
                    <span
                      className="self-start text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                      style={{ background: '#F4D03F', color: '#0a0a0a' }}
                    >
                      ⭐ Recomendado
                    </span>
                  )}
                  <p className="text-xl font-extrabold text-white mb-1">{plan.name}</p>
                  <p className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: isPro ? '#F4D03F' : '#fff' }}>
                    {formatPrice(plan.price_monthly)}
                    {plan.price_monthly > 0 && <span className="text-base font-medium text-neutral-400"> / mes</span>}
                  </p>
                  {plan.trial_days > 0 && (
                    <p className="text-sm font-semibold mb-4" style={{ color: '#7ED957' }}>
                      🎁 {plan.trial_days} días de prueba gratis
                    </p>
                  )}
                  {!isPro && (
                    <p className="text-sm font-semibold mb-4" style={{ color: '#7ED957' }}>
                      🎁 Incluye 24 horas de la versión PRO
                    </p>
                  )}
                  <div className="flex flex-col gap-2.5 mt-4 mb-8 flex-1">
                    {features.map(function (f, i) {
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span style={{ color: isPro ? '#7ED957' : '#8B5CF6' }}>✓</span>
                          <span className="text-sm text-neutral-200">{f}</span>
                        </div>
                      )
                    })}
                  </div>
                  <a
                    href={'/comenzar?plan=' + plan.id}
                    className="h-12 rounded-xl font-bold text-white flex items-center justify-center"
                    style={{
                      background: isPro ? 'linear-gradient(90deg, #E91E8C, #8B5CF6)' : 'rgba(139,92,246,0.2)',
                      border: isPro ? 'none' : '2px solid rgba(139,92,246,0.5)'
                    }}
                  >
                    {isPro ? 'Elegir Plan PRO' : 'Empezar gratis'}
                  </a>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-neutral-500 mt-10">
          Los pagos en línea llegan muy pronto. Escríbenos si quieres activar tu plan Pro ahora.
        </p>

        {/* TABLA COMPARATIVA DETALLADA */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <p className="text-xs md:text-sm tracking-[5px] uppercase font-bold mb-3" style={{ color: '#8B5CF6' }}>
              ⚡ Todo en detalle
            </p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white">
              Planes adecuados para tí.
            </h2>
          </div>

          <div className="comparison-wrap rounded-3xl overflow-hidden border-2" style={{ borderColor: 'rgba(139,92,246,0.4)' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="comparison-th-label"></th>
                  <th className="comparison-th">
                    <span className="text-sm font-extrabold text-white">Free</span>
                  </th>
                  <th className="comparison-th comparison-th-pro">
                    <span
                      className="inline-flex items-center gap-1.5 text-sm font-extrabold"
                      style={{ color: '#F4D03F' }}
                    >
                      ⭐ PRO
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(COMPARISON_TABLE[activeGroup] || []).map(function (row, i) {
                  return (
                    <tr key={i} className="comparison-row">
                      <td className="comparison-td-label">{row.label}</td>
                      <td className="comparison-td">
                        <CellValue value={row.free} isPro={false} />
                      </td>
                      <td className="comparison-td comparison-td-pro">
                        <CellValue value={row.pro} isPro={true} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-8">
            <a
              href={'/comenzar?plan=' + (groupPlans.find(function (p) { return p.code === 'PRO' }) || {}).id}
              className="h-12 px-8 rounded-xl font-bold text-white flex items-center justify-center"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)', boxShadow: '0 0 30px -8px rgba(233,30,140,0.7)' }}
            >
              ⭐ Elegir Plan PRO
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .pricing-title {
          background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6, #F4D03F);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: pricingGradient 6s linear infinite;
        }
        @keyframes pricingGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        .plan-card-in {
          animation: planCardIn 0.4s ease-out both;
        }
        @keyframes planCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .comparison-wrap {
          background: rgba(12,8,20,0.9);
          box-shadow: 0 0 50px -14px rgba(139,92,246,0.5);
        }
        .comparison-th-label { width: 46%; }
        .comparison-th {
          padding: 16px 14px;
          text-align: center;
          background: rgba(139,92,246,0.08);
          border-bottom: 2px solid rgba(139,92,246,0.35);
        }
        .comparison-th-pro {
          background: linear-gradient(180deg, rgba(244,208,63,0.14), rgba(233,30,140,0.08));
          border-bottom: 2px solid rgba(244,208,63,0.5);
        }
        .comparison-row {
          border-bottom: 1px solid rgba(139,92,246,0.14);
          transition: background 0.15s ease;
        }
        .comparison-row:hover {
          background: rgba(139,92,246,0.06);
        }
        .comparison-row:last-child {
          border-bottom: none;
        }
        .comparison-td-label {
          padding: 13px 18px;
          font-size: 13.5px;
          font-weight: 600;
          color: #d4cee0;
        }
        .comparison-td {
          padding: 13px 14px;
          text-align: center;
        }
        .comparison-td-pro {
          background: rgba(244,208,63,0.04);
          box-shadow: inset 1px 0 0 rgba(244,208,63,0.15);
        }
        @media (max-width: 640px) {
          .comparison-td-label, .comparison-th-label { font-size: 11.5px; }
          .comparison-td, .comparison-th { padding: 10px 6px; }
        }
      `}</style>
    </div>
  )
}
