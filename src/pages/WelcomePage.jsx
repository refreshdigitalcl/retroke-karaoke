import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function WelcomePage() {
  var statusState = useState('checking')
  var status = statusState[0]
  var setStatus = statusState[1]

  var workspaceIdState = useState(null)
  var workspaceId = workspaceIdState[0]
  var setWorkspaceId = workspaceIdState[1]

  var isPending = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pending') === '1'

  useEffect(function () {
    var params = new URLSearchParams(window.location.search)
    var subId = params.get('sub')
    if (!subId) {
      setStatus('unknown')
      return
    }

    var attempts = 0
    function check() {
      attempts = attempts + 1
      supabase
        .from('subscriptions')
        .select('status, workspace_id')
        .eq('id', subId)
        .single()
        .then(function (result) {
          if (result.data && result.data.workspace_id) {
            setWorkspaceId(result.data.workspace_id)
          }
          if (result.data && result.data.status === 'active') {
            setStatus('active')
          } else if (attempts < 8) {
            setTimeout(check, 2000)
          } else {
            setStatus('waiting')
          }
        })
        .catch(function () {
          setStatus('unknown')
        })
    }
    check()
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center px-6">
      <div className="pointer-events-none fixed -top-40 -left-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#7ED957' }} />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#8B5CF6' }} />

      <div
        className="relative z-10 max-w-md w-full rounded-3xl p-9 text-center"
        style={{ background: 'rgba(15,10,20,0.9)', border: '2px solid rgba(126,217,87,0.5)', boxShadow: '0 0 40px -8px rgba(126,217,87,0.5)' }}
      >
        {status === 'checking' && (
          <>
            <p className="text-5xl mb-4">⏳</p>
            <p className="text-xl font-bold text-white mb-2">Confirmando tu pago...</p>
            <p className="text-sm text-neutral-400">Esto toma solo unos segundos.</p>
          </>
        )}

        {status === 'active' && (
          <>
            <p className="text-6xl mb-4">🎉</p>
            <p className="text-2xl font-extrabold text-white mb-2">¡Bienvenido a Retroke!</p>
            <p className="text-sm text-neutral-300 mb-6">Tu cuenta ya está lista y tu plan activado.</p>
            <a
              href={workspaceId ? ("/dj?ws=" + workspaceId) : "/dj"}
              className="inline-block h-12 px-8 rounded-xl font-bold text-white leading-[48px]"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              Ir a mi panel
            </a>
          </>
        )}

        {status === 'waiting' && (
          <>
            <p className="text-5xl mb-4">🕓</p>
            <p className="text-xl font-bold text-white mb-2">
              {isPending ? 'Tu pago está pendiente' : 'Estamos confirmando tu pago'}
            </p>
            <p className="text-sm text-neutral-400 mb-6">
              Puede tomar unos minutos más. Ya puedes entrar a tu panel, tu plan se activará apenas se confirme.
            </p>
            <a
              href={workspaceId ? ("/dj?ws=" + workspaceId) : "/dj"}
              className="inline-block h-12 px-8 rounded-xl font-bold text-white leading-[48px]"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              Ir a mi panel
            </a>
          </>
        )}

        {status === 'unknown' && (
          <>
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-2xl font-extrabold text-white mb-2">¡Gracias!</p>
            <p className="text-sm text-neutral-300 mb-6">
              Si tu pago fue aprobado, tu cuenta se activará en breve.
            </p>
            <a
              href={workspaceId ? ("/dj?ws=" + workspaceId) : "/dj"}
              className="inline-block h-12 px-8 rounded-xl font-bold text-white leading-[48px]"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              Ir a mi panel
            </a>
          </>
        )}
      </div>
    </div>
  )
}
