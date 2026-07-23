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

  function signInWithEmail(email) {
    return supabase.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: window.location.origin + '/dj' }
    })
  }

  function signOut() {
    return supabase.auth.signOut()
  }

  var value = {
    session: session,
    loading: loading,
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
