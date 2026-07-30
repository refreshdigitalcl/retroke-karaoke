import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function SignupPage() {
  var auth = useAuth()

  var planState = useState(null)
  var plan = planState[0]
  var setPlan = planState[1]

  var nameState = useState('')
  var name = nameState[0]
  var setName = nameState[1]

  var emailState = useState('')
  var email = emailState[0]
  var setEmail = emailState[1]

  var passwordState = useState('')
  var password = passwordState[0]
  var setPassword = passwordState[1]

  var statusState = useState('idle')
  var status = statusState[0]
  var setStatus = statusState[1]

  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  useEffect(function () {
    var params = new URLSearchParams(window.location.search)
    var planId = params.get('plan')
    if (params.get('error') === 'pago_fallido') {
      setError('El pago no se completo. Puedes intentar de nuevo.')
    }
    if (!planId) return
    supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
      .then(function (result) {
        if (result.data) setPlan(result.data)
      })
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!plan) {
      setError('No se selecciono ningun plan. Vuelve a la pagina de precios.')
      return
    }
    setStatus('creating')
    setError('')

    auth
      .signUpWithPassword(email, password)
      .then(function (signUpResult) {
        if (signUpResult.error) throw signUpResult.error
        var userId = signUpResult.data.user && signUpResult.data.user.id
        if (!userId) throw new Error('No se pudo crear el usuario')

        var slug = slugify(name) + '-' + Math.random().toString(36).slice(2, 6)

        return supabase
          .from('workspaces')
          .insert({
            name: name,
            type: plan.workspace_type,
            plan: plan.code,
            status: 'ACTIVE',
            owner_id: userId
          })
          .select()
          .single()
          .then(function (wsResult) {
            if (wsResult.error) throw wsResult.error
            var workspace = wsResult.data

            var chain = supabase.from('workspace_members').insert({
              workspace_id: workspace.id,
              user_id: userId,
              role: 'owner'
            })

            if (plan.workspace_type === 'BAR') {
              chain = chain.then(function () {
                return supabase.from('bars').insert({
                  name: name,
                  slug: slug,
                  workspace_id: workspace.id,
                  is_active: true
                })
              })
            }

            return chain.then(function () {
              return supabase
                .from('subscriptions')
                .insert({
                  workspace_id: workspace.id,
                  plan_id: plan.id,
                  status: plan.price_monthly > 0 ? 'pending' : 'active'
                })
                .select()
                .single()
            })
          })
      })
      .then(function (subResult) {
        if (subResult.error) throw subResult.error
        var subscription = subResult.data

        return supabase
          .from('licenses')
          .insert({ workspace_id: subscription.workspace_id, subscription_id: subscription.id })
          .then(function () {
            return subscription
          })
      })
      .then(function (subscription) {
        if (plan.price_monthly <= 0) {
          setStatus('done_free')
          return null
        }
        setStatus('redirecting')
        return fetch('/api/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_id: subscription.id })
        })
          .then(function (res) { return res.json() })
          .then(function (data) {
            if (data.init_point) {
              window.location.href = data.init_point
            } else {
              throw new Error(data.error || 'No se pudo iniciar el pago')
            }
          })
      })
      .catch(function (err) {
        setStatus('idle')
        setError(err.message || 'Ocurrio un error. Intenta de nuevo.')
      })
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center px-6 py-14">
      <div className="pointer-events-none fixed -top-40 -left-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#E91E8C' }} />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#8B5CF6' }} />

      <div
        className="relative z-10 max-w-md w-full rounded-3xl p-8"
        style={{ background: 'rgba(15,10,20,0.9)', border: '2px solid rgba(139,92,246,0.5)', boxShadow: '0 0 40px -8px rgba(139,92,246,0.5)' }}
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#F4D03F' }}>✨ Retroke</p>
        <h1 className="text-2xl font-extrabold text-white mb-1">Crea tu cuenta</h1>
        {plan ? (
          <p className="text-sm mb-6" style={{ color: '#7ED957' }}>
            Plan seleccionado: <strong>{plan.name}</strong>
            {plan.price_monthly > 0 ? ' — $' + Number(plan.price_monthly).toLocaleString('es-CL') + '/mes' : ' — Gratis'}
            {plan.trial_days > 0 ? ' (con ' + plan.trial_days + ' dias de prueba)' : ''}
          </p>
        ) : (
          <p className="text-sm mb-6 text-neutral-400">
            Ve a la <a href="/precios" className="underline">pagina de precios</a> para elegir un plan primero.
          </p>
        )}

        {status === 'done_free' ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-lg font-bold text-white mb-2">Tu cuenta esta lista</p>
            <p className="text-sm text-neutral-400 mb-5">Ya puedes ingresar y empezar a usar Retroke.</p>
            <a
              href="/dj"
              className="inline-block h-11 px-6 rounded-xl font-bold text-white leading-[44px]"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              Ir a mi panel
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <input
              type="text"
              placeholder="Nombre de tu bar, sala o marca"
              value={name}
              onChange={function (e) { setName(e.target.value) }}
              required
              className="h-12 rounded-xl px-4 border outline-none text-sm text-white"
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(139,92,246,0.4)' }}
            />
            <input
              type="email"
              placeholder="Tu correo"
              value={email}
              onChange={function (e) { setEmail(e.target.value) }}
              required
              className="h-12 rounded-xl px-4 border outline-none text-sm text-white"
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(139,92,246,0.4)' }}
            />
            <input
              type="password"
              placeholder="Crea una contraseña"
              value={password}
              onChange={function (e) { setPassword(e.target.value) }}
              required
              minLength={6}
              className="h-12 rounded-xl px-4 border outline-none text-sm text-white"
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(139,92,246,0.4)' }}
            />

            {error && <p className="text-xs" style={{ color: '#E9544A' }}>{error}</p>}

            <button
              type="submit"
              disabled={!plan || status === 'creating' || status === 'redirecting'}
              className="h-12 rounded-xl font-bold text-white disabled:opacity-50 mt-1"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              {status === 'creating' ? 'Creando tu cuenta...' : status === 'redirecting' ? 'Llevandote al pago...' : plan && plan.price_monthly > 0 ? 'Continuar al pago' : 'Crear cuenta gratis'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
