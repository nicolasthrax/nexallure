import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/Auth'
import { supabase } from '../lib/supabase'

export default function LoginPage({ t, setPage }) {
  const { signIn } = useAuth()
  const [tab, setTab] = useState('magic') // 'magic' | 'password'

  // Magic-link state
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicError, setMagicError] = useState(null)

  // Password state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState(null)

  const handleMagicSubmit = async (e) => {
    e.preventDefault()
    setMagicError(null)
    setMagicSent(false)

    if (!supabase) {
      setMagicError('Auth not configured')
      return
    }

    setMagicLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: window.location.origin + '/market-guide' },
    })
    setMagicLoading(false)

    if (error) {
      setMagicError(error.message)
      return
    }
    setMagicSent(true)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwError(null)
    setPwLoading(true)

    const { error } = await signIn(email, password)
    setPwLoading(false)

    if (error) {
      setPwError(t.login_error_invalid)
      return
    }

    // AuthProvider's onAuthStateChange fires automatically on successful sign-in.
    setPage('marketGuide')
  }

  const inputStyle = {
    width: '100%',
    height: '48px',
    border: '2px solid var(--rule-strong)',
    background: '#fff',
    color: 'var(--warm-white)',
    fontFamily: "var(--font-body)",
    fontSize: '16px',
    padding: '12px 16px',
    outline: 'none',
    borderRadius: 0,
    boxSizing: 'border-box',
  }

  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: '13px',
    color: 'var(--text-light)',
    letterSpacing: '0.06em',
  }

  // Tab button:
  // underline on the active tab, muted text on the inactive one, no background.
  const tabButtonStyle = (active) => ({
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--signal-gold)' : '2px solid transparent',
    borderRadius: 0,
    padding: '12px 0',
    fontFamily: "var(--font-body)",
    fontSize: '15px',
    fontWeight: active ? 600 : 500,
    letterSpacing: '0.08em',
    color: active ? 'var(--ink)' : 'var(--ink-3)',
    cursor: 'pointer',
    transition: 'color 0.2s ease, border-color 0.2s ease',
  })

  const primaryButtonStyle = (loading) => ({
    width: '100%',
    height: '52px',
    background: loading ? 'rgba(31,79,191,0.48)' : 'var(--signal-gold)',
    color: '#fff',
    border: '1px solid var(--gold-shadow)',
    padding: '14px 28px',
    fontFamily: "var(--font-body)",
    fontSize: '16px',
    fontWeight: 600,
    cursor: loading ? 'wait' : 'pointer',
    letterSpacing: '0.04em',
    marginTop: '4px',
  })

  const errorBoxStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: '14px',
    color: 'var(--danger)',
    background: 'var(--danger-bg)',
    border: '1px solid var(--danger)',
    padding: '10px 14px',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--midnight-navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '440px' }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: '13px',
            color: 'var(--signal-gold)',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {t.login_eyebrow}
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: '44px',
            fontWeight: 800,
            fontStretch: '90%',
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '32px',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {t.login_h1}
        </h1>

        {/* Tab selectors */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '28px',
            borderBottom: '1px solid var(--border-dark)',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'magic'}
            onClick={() => setTab('magic')}
            style={tabButtonStyle(tab === 'magic')}
          >
            {t.login_tab_magic}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'password'}
            onClick={() => setTab('password')}
            style={tabButtonStyle(tab === 'password')}
          >
            {t.login_tab_password}
          </button>
        </div>

        {/* Magic link tab */}
        {tab === 'magic' && (
          <form onSubmit={handleMagicSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-login-magic-label" style={labelStyle}>{t.login_magic_label}</label>
              <input id="f-login-magic-label"
                type="email"
                value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="your@email.com"
              />
            </div>

            {magicError && <div style={errorBoxStyle}>{magicError}</div>}

            {magicSent && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: '14px',
                  color: 'var(--signal-gold)',
                  background: 'rgba(31,79,191,0.10)',
                  border: '1px solid rgba(31,79,191,0.36)',
                  padding: '10px 14px',
                }}
              >
                {t.login_magic_sent}
              </div>
            )}

            <button type="submit" disabled={magicLoading} style={primaryButtonStyle(magicLoading)}>
              {magicLoading ? t.login_loading : t.login_magic_cta}
            </button>
          </form>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-login-magic-label-2" style={labelStyle}>{t.login_magic_label}</label>
              <input id="f-login-magic-label-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="your@email.com"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-login-tab-password" style={labelStyle}>{t.login_tab_password}</label>
              <input id="f-login-tab-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            {pwError && <div style={errorBoxStyle}>{pwError}</div>}

            <button type="submit" disabled={pwLoading} style={primaryButtonStyle(pwLoading)}>
              {pwLoading ? t.login_loading : t.login_password_cta}
            </button>
          </form>
        )}

        {/* Get early access link */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: '15px',
            color: 'var(--signal-gold)',
            textAlign: 'center',
            marginTop: '24px',
            cursor: 'pointer',
          }}
          onClick={() => setPage('register')}
        >
          {t.login_no_account}
        </div>
      </motion.div>
    </div>
  )
}
