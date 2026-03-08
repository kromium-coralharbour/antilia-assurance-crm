'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // If already logged in, go straight to dashboard
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard'
      } else {
        setChecking(false)
      }
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  if (checking) {
    return <div style={{ minHeight: '100vh', background: '#0a0f1e' }} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Background rings */}
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        {[600, 450, 300, 160].map((size, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: size, height: size,
            borderRadius: '50%',
            border: `1px solid rgba(201,147,58,${0.04 + i * 0.03})`,
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <svg width="48" height="48" viewBox="0 0 38 38" fill="none" style={{ margin: '0 auto 1rem' }}>
            <circle cx="19" cy="19" r="17" stroke="#c9933a" strokeWidth="1.2"/>
            <circle cx="19" cy="19" r="10" stroke="#c9933a" strokeWidth="0.8" strokeDasharray="3 2"/>
            <circle cx="19" cy="19" r="3.5" fill="#c9933a"/>
            <path d="M19 4 Q26 14 19 19 Q12 24 19 34" stroke="#e8b04a" strokeWidth="1" fill="none" opacity="0.6"/>
          </svg>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            Antillia
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9933a', marginTop: '2px' }}>
            Assurance Group · CRM
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', padding: '2.5rem' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.7rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#8fa3b8', marginBottom: '1.8rem' }}>
            Sign in to your account
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label className="crm-label">Email Address</label>
              <input
                className="crm-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div style={{ marginBottom: '1.8rem' }}>
              <label className="crm-label">Password</label>
              <input
                className="crm-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#fc8181', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(201,147,58,0.06)', border: '1px solid rgba(201,147,58,0.1)', fontSize: '0.78rem', color: '#8fa3b8', lineHeight: 1.6 }}>
            <strong style={{ color: '#c9933a', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}>SETUP:</strong><br />
            Create a user in your Supabase Auth dashboard, then sign in here.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a5a6a' }}>
          Caribbean Property & Catastrophe Insurance · Confidential
        </div>
      </div>
    </div>
  )
}
