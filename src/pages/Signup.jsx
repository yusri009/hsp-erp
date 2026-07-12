import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { Package, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

function Signup() {
  const { session } = useAuth()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirect if already logged in
  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (companyName.trim().length < 2) {
      setError('Company name must be at least 2 characters.')
      return
    }

    setLoading(true)

    try {
      // 1. Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      const userId = authData.user?.id
      if (!userId) {
        throw new Error('Signup succeeded but no user ID was returned.')
      }

      // 2. Create the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({ name: companyName.trim() })
        .select()
        .single()

      if (tenantError) throw tenantError

      // 3. Link user to tenant
      const { error: linkError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: userId,
          role: 'owner',
        })

      if (linkError) throw linkError

      // If email confirmation is required, show success message
      // If auto-confirmed, the auth state change will handle redirect
      if (authData.session) {
        // Auto-confirmed — auth listener will redirect
        return
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md glass-card p-8 animate-fade-in relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-surface-50 tracking-tight">HSP ERP</h1>
          <p className="text-xs text-surface-400 font-medium uppercase tracking-widest mt-1">Wholesale Management</p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-surface-100 mb-2">Check your email</h2>
            <p className="text-sm text-surface-400 mb-6">
              We've sent a confirmation link to <span className="text-surface-200 font-medium">{email}</span>. Please verify your email to get started.
            </p>
            <Link to="/login" className="btn-primary inline-flex">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Heading */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-surface-100">Create your account</h2>
              <p className="text-sm text-surface-400 mt-1">Get started with your organization</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm animate-slide-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-company" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Company Name
                </label>
                <input
                  id="signup-company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                  placeholder="Acme Wholesale Ltd."
                  autoComplete="organization"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-surface-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default Signup
