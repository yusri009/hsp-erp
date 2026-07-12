import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [tenantId, setTenantId] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch tenant info for a given user ID
  async function fetchTenantInfo(userId) {
    const { data, error } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch tenant info:', error.message)
      setTenantId(null)
      setRole(null)
      return
    }

    setTenantId(data.tenant_id)
    setRole(data.role)
  }

  useEffect(() => {
    // Hydrate initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        fetchTenantInfo(currentSession.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchTenantInfo(newSession.user.id)
        } else {
          setTenantId(null)
          setRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Full-screen loading state while resolving session + tenant
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-surface-700 border-t-primary-500 animate-spin" />
          <p className="text-sm text-surface-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, user, tenantId, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
