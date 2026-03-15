import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import SplashScreen from '@/components/SplashScreen'
import { Eye, EyeOff, LogIn } from 'lucide-react'

type Stage = 'splash' | 'login' | 'logging-in' | 'post-login-splash' | 'done'

export default function LoginPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('splash')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // After initial splash completes, show login form
  function onSplashDone() {
    setStage('login')
  }

  // After post-login splash completes, navigate to dashboard
  function onPostLoginSplashDone() {
    router.push('/')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password'); return }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password'
        : authError.message)
      setLoading(false)
      return
    }

    // Show post-login splash before entering dashboard
    setStage('post-login-splash')
  }

  // Initial splash screen
  if (stage === 'splash') {
    return <SplashScreen onComplete={onSplashDone} duration={2200} />
  }

  // Post-login splash
  if (stage === 'post-login-splash') {
    return <SplashScreen onComplete={onPostLoginSplashDone} duration={1800} />
  }

  return (
    <>
      <Head>
        <title>Sign In — Coraléa CRM</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Subtle background texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,169,110,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Login card */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          position: 'relative',
          animation: 'loginFadeUp 0.7s ease forwards',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* Monogram ring */}
            <div style={{
              width: 64, height: 64,
              borderRadius: '50%',
              border: '1.5px solid rgba(201,169,110,0.5)',
              background: 'rgba(201,169,110,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 32px rgba(201,169,110,0.08)',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                color: 'var(--gold)',
                letterSpacing: '0.05em',
                lineHeight: 1,
              }}>C</span>
            </div>

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              letterSpacing: '0.36em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              Coraléa
            </div>

            {/* Gold line */}
            <div style={{
              width: 60,
              height: 1,
              background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
              margin: '10px auto',
            }} />

            <div style={{
              fontFamily: 'var(--font-editorial)',
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              letterSpacing: '0.18em',
            }}>
              Private Retreat · CRM
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              fontFamily: 'var(--font-editorial)',
              fontSize: 22,
              fontWeight: 300,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}>
              Welcome back
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
              Sign in to access the property dashboard
            </div>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="form-group">
                <label>Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@coralea.bb"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      padding: 4, display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  fontSize: 13,
                  marginBottom: 20,
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? 'var(--gold-dim)' : 'var(--gold)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-inverse)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 150ms ease',
                }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'currentColor',
                          animation: `loginDot 1.2s ${i * 0.2}s infinite`,
                          display: 'inline-block',
                        }} />
                      ))}
                    </span>
                    Signing in
                  </>
                ) : (
                  <><LogIn size={14} /> Sign In</>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}>
            Coraléa Private Retreat · West Coast, Barbados
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginDot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30%            { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </>
  )
}
