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

  async function claimPendingInvites(user) {
    if (!user || !user.email) return
    await supabase
      .from('bar_members')
      .update({ user_id: user.id })
      .eq('invited_email', user.email)
      .is('user_id', null)
  }

  async function loadIsAdmin(userId) {
    if (!userId) {
      setIsGlobalAdmin(false)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_global_admin')
      .eq('id', userId)
      .maybeSingle()
    setIsGlobalAdmin(!!(data && data.is_global_admin))
  }

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      const currentSession = result.data.session
      setSession(currentSession)
      setLoading(false)
      if (currentSession && currentSession.user) {
        claimPendingInvites(currentSession.user)
        loadIsAdmin(currentSession.user.id)
      }
    })

    const sub = supabase.auth.onAuthStateChange(function (event, newSession) {
      setSession(newSession)
      if (newSession && newSession.user) {
        claimPendingInvites(newSession.user)
        loadIsAdmin(newSession.user.id)
      } else {
        setIsGlobalAdmin(false)
      }
    })

    return function () {
      sub.data.subscription.unsubscribe()
    }
  }, [])

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
    loading: loading,
    isGlobalAdmin: isGlobalAdmin,
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
