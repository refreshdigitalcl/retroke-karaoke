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
      'Reacciones en tiempo real',
      'Calificación del público',
      'Cola de participantes',
      'Display para TV',
      'Branding de Retroke'
    ],
    PRO: [
      'Todo lo de Home Basic',
      'Home Mic (el celular como micrófono)',
      'Vocal Score básico',
      'Historial de sesiones',
      'Estadísticas personales',
      'Sin publicidad',
      'Acceso prioritario a nuevas funciones'
    ]
  },
  BAR: {
    FREE: [
      'Panel DJ',
      'Display principal',
      'Registro desde QR',
      'Reacciones',
      'Calificaciones',
      'Branding de Retroke'
    ],
    PRO: [
      'Todo lo de Bar Free',
      'Participantes ilimitados',
      'Multi-Bar (Workspaces)',
      'Branding del local',
      'Dashboard profesional',
      'Estadísticas completas',
      'Rankings e historial',
      'Soporte prioritario'
    ]
  },
  DJ: {
    FREE: [
      'Perfil de DJ',
      'Panel DJ',
      'Configuración personal',
      'Crear eventos (número limitado al mes)',
      'Registro de participantes'
    ],
    PRO: [
      'Todo lo de DJ Free',
      'Eventos ilimitados',
      'Perfil profesional',
      'Branding del DJ',
      'Dashboard y estadísticas',
      'Historial completo',
      'Soporte prioritario'
    ]
  }
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
          <p className="text-xs md:text-sm tracking-[6px] uppercase font-bold mb-3" style={{ color: '#F4D03F' }}>
            ✨ Retroke
          </p>
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
                  <button
                    className="h-12 rounded-xl font-bold text-white"
                    style={{
                      background: isPro ? 'linear-gradient(90deg, #E91E8C, #8B5CF6)' : 'rgba(139,92,246,0.2)',
                      border: isPro ? 'none' : '2px solid rgba(139,92,246,0.5)'
                    }}
                  >
                    {plan.price_monthly > 0 ? 'Comenzar prueba gratis' : 'Empezar gratis'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-neutral-500 mt-10">
          Los pagos en línea llegan muy pronto. Escríbenos si quieres activar tu plan Pro ahora.
        </p>
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
      `}</style>
    </div>
  )
}
