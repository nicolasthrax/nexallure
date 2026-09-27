import Turnstile from 'react-turnstile'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MultiSelect from '../components/MultiSelect'
import ConsentCheckbox from '../components/ConsentCheckbox'
import { submitForm } from '../lib/submitForm'
import { supabase } from '../lib/supabase'

export default function RegisterPage({ t, setPage }) {
  const [industry, setIndustry] = useState('')
  const [industryOther, setIndustryOther] = useState('')
  const [size, setSize] = useState('')
  const [markets, setMarkets] = useState([])
  const [volume, setVolume] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmError, setConfirmError] = useState('')

  const [consent, setConsent] = useState(false)
  const [crossBorderConsent, setCrossBorderConsent] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [crossBorderConsentError, setCrossBorderConsentError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [turnstileToken, setTurnstileToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setConsentError('')
    setCrossBorderConsentError('')
    setConfirmError('')

    if (password !== confirmPassword) {
      setConfirmError(t.form_field_confirm_error)
      return
    }

    if (!consent) {
      setConsentError(t.consent_required)
      return
    }
    if (!crossBorderConsent) {
      setCrossBorderConsentError(t.cross_border_consent_required)
      return
    }

    if (!turnstileToken) {
      setErrorMsg('Please complete the security verification.')
      return
    }

    setSubmitting(true)
    const payload = {
      company_name: companyName,
      industry: industry === 'other' ? `Other: ${industryOther}` : industry,
      factory_size: size,
      target_markets: markets.join(', '),
      annual_export_volume: volume,
      contact_email: email,
      consent_given: true,
      privacy_terms_consent_given: true,
      privacy_terms_consent_text: t.consent_label,
      cross_border_consent_given: true,
      cross_border_consent_text: t.cross_border_consent_label,
      language: t._lang || '',
      "cf-turnstile-response": turnstileToken
    }

    const result = await submitForm('Supplier Application', payload)
    setSubmitting(false)

    if (result.ok) {
      setSubmitted(true)
      // crypto.randomUUID() is universally available in secure (HTTPS) contexts.
      // No Math.random() fallback — predictable tokens are unacceptable.
      try {
        const token = crypto.randomUUID()
        localStorage.setItem('nexallure_device_token', token)
      } catch (e) {
        console.warn('Could not save device token', e)
      }

      if (supabase) {
        supabase.auth.signUp({ email, password }).then(({ error }) => {
          if (!error) {
            supabase.auth.signInWithPassword({ email, password })
          }
        })
      }
      return
    }
    setErrorMsg(result.notConfigured ? t.form_error_not_configured : t.form_error)
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    letterSpacing: '0.12em',
    color: 'rgba(238,233,221,0.55)',
    marginBottom: '8px',
    fontFamily: "'IBM Plex Mono', monospace",
  }

  const inputBase = {
    width: '100%',
    background: '#1D2027',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '4px',
    padding: '14px 16px',
    color: 'var(--on-ink)',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: "'IBM Plex Sans', sans-serif",
  }

  const handleFocus = (e) => { e.target.style.borderColor = 'var(--seal-on-ink)' }
  const handleBlur = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }

  const selectStyle = {
    ...inputBase,
    appearance: 'none',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f0e6cc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '16px',
    paddingRight: '40px',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--midnight-navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '640px' }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            color: 'var(--signal-gold)',
            letterSpacing: '0.15em',
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Early Access
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: '32px',
            color: 'var(--warm-white)',
            textAlign: 'center',
            marginBottom: '40px',
            letterSpacing: '-0.01em',
          }}
        >
          Join Nexallure
        </h1>

        {submitted ? (
          <div style={{ padding: '24px', border: '1px solid var(--green)', background: 'var(--green-bg)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'var(--green)' }}>
              {t.form_success}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field1_label}</label>
              <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field3_label}</label>
              <select required value={industry} onChange={(e) => setIndustry(e.target.value)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="" disabled style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.form_field3_placeholder}</option>
                <option value="automotive" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_automotive}</option>
                <option value="electronics" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_electronics}</option>
                <option value="machinery" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_machinery}</option>
                <option value="textiles" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_textiles}</option>
                <option value="chemicals" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_chemicals}</option>
                <option value="pharma" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_pharma}</option>
                <option value="food" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_food}</option>
                <option value="logistics" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_logistics}</option>
                <option value="other" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.industry_other}</option>
              </select>
            </div>

            <AnimatePresence>
              {industry === 'other' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                    <label style={labelStyle}>{t.form_field3_other_placeholder}</label>
                    <input type="text" required value={industryOther} onChange={(e) => setIndustryOther(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field4_label}</label>
              <select required value={size} onChange={(e) => setSize(e.target.value)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="" disabled style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.form_field4_placeholder}</option>
                <option value="size_1" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.size_1}</option>
                <option value="size_2" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.size_2}</option>
                <option value="size_3" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.size_3}</option>
                <option value="size_4" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.size_4}</option>
                <option value="size_5" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.size_5}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field5_label}</label>
              <MultiSelect selected={markets} onChange={setMarkets} t={t} variant="dark" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field6_label}</label>
              <select required value={volume} onChange={(e) => setVolume(e.target.value)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="" disabled style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.form_field6_placeholder}</option>
                <option value="volume_1" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.volume_1}</option>
                <option value="volume_2" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.volume_2}</option>
                <option value="volume_3" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.volume_3}</option>
                <option value="volume_4" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.volume_4}</option>
                <option value="volume_5" style={{ background: '#1D2027', color: 'var(--on-ink)' }}>{t.volume_5}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field7_label}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field_password_label}</label>
              <input type="password" required minLength={8} placeholder={t.form_field_password_placeholder} value={password} onChange={(e) => setPassword(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>{t.form_field_confirm_label}</label>
              <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (confirmError) setConfirmError('') }} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
              {confirmError && (
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#e05555' }}>
                  {confirmError}
                </div>
              )}
            </div>

            <ConsentCheckbox
              t={t}
              checked={consent}
              onChange={(v) => { setConsent(v); if (v) setConsentError('') }}
              onNavigate={(target) => setPage?.(target)}
              error={consentError}
            />
            <ConsentCheckbox
              t={t}
              label={t.cross_border_consent_label}
              checked={crossBorderConsent}
              onChange={(v) => { setCrossBorderConsent(v); if (v) setCrossBorderConsentError('') }}
              onNavigate={(target) => setPage?.(target)}
              error={crossBorderConsentError}
            />

            <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
              <Turnstile
                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
                onError={() => setTurnstileToken('')}
              />
            </div>

            {errorMsg && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#e05555', background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: '4px', padding: '10px 12px' }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: 'var(--seal-on-ink)',
                color: '#0d1117',
                border: 'none',
                borderRadius: '4px',
                padding: '16px',
                fontSize: '13px',
                fontWeight: '600',
                letterSpacing: '0.12em',
                cursor: submitting ? 'wait' : 'pointer',
                transition: 'opacity 0.2s ease',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
              onMouseEnter={(e) => { if (!submitting) e.target.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.target.style.opacity = '1' }}
            >
              {submitting ? t.form_submitting : t.form_submit}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-8" style={{ color: 'rgba(238,233,221,0.4)' }}>
          Already have an account?{' '}
          <span
            onClick={() => setPage?.('login')}
            className="underline underline-offset-4 transition-colors cursor-pointer"
            style={{ color: 'rgba(238,233,221,0.7)' }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--on-ink)' }}
            onMouseLeave={(e) => { e.target.style.color = 'rgba(238,233,221,0.7)' }}
          >
            Sign in →
          </span>
        </p>
      </motion.div>
    </div>
  )
}
