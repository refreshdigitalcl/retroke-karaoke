import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  var sessionState = useState(null)
  var session = sessionState[0]
  var setSession = sessionState[1]

  var loadingState = useState(true)
  var loading = loadingState[0]
  var setLoading = loadingState[1]

  var isGlobalAdminState = useState(false)
  var isGlobalAdmin = isGlobalAdminState[0]
  var setIsGlobalAdmin = isGlobalAdminState[1]

  var adminCheckedState = useState(false)
  var adminChecked = adminCheckedState[0]
  var setAdminChecked = adminCheckedState[1]

  var debugState = useState(null)
  var debugInfo = debugState[0]
  var setDebugInfo = debugState[1]

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      setSession(result.data.session)
      setLoading(false)
    })

    var sub = supabase.auth.onAuthStateChange(function (event, newSession) {
      setSession(newSession)
    })

    return function () {
      sub.data.subscription.unsubscribe()
    }
  }, [])

  var userId = session && session.user ? session.user.id : null
  var userEmail = session && session.user ? session.user.email : null

  useEffect(function () {
    var cancelled = false

    if (!userId) {
      setIsGlobalAdmin(false)
      setAdminChecked(true)
      setDebugInfo(null)
      return
    }

    setAdminChecked(false)

    if (userEmail) {
      supabase
        .from('bar_members')
        .update({ user_id: userId })
        .eq('invited_email', userEmail)
        .is('user_id', null)
        .then(function () {})
    }

    supabase
      .from('profiles')
      .select('is_global_admin')
      .eq('id', userId)
      .maybeSingle()
      .then(function (result) {
        if (cancelled) return
        var admin = !!(result.data && result.data.is_global_admin)
        setIsGlobalAdmin(admin)
        setAdminChecked(true)
        setDebugInfo({
          userId: userId,
          userEmail: userEmail,
          rawData: JSON.stringify(result.data),
          rawError: result.error ? JSON.stringify(result.error) : 'ninguno'
        })
      })
      .catch(function (err) {
        if (cancelled) return
        setIsGlobalAdmin(false)
        setAdminChecked(true)
        setDebugInfo({
          userId: userId,
          userEmail: userEmail,
          rawData: 'excepcion capturada',
          rawError: String(err)
        })
      })

    return function () {
      cancelled = true
    }
  }, [userId, userEmail])

  function signInWithEmail(email) {
    return supabase.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    })
  }

  function signOut() {
    return supabase.auth.signOut()
  }

  var value = {
    session: session,
    loading: loading || (!!userId && !adminChecked),
    isGlobalAdmin: isGlobalAdmin,
    debugInfo: debugInfo,
    signInWithEmail: signInWithEmail,
    signOut: signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  var ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
