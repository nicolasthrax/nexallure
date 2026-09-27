import Turnstile from 'react-turnstile'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MultiSelect from './MultiSelect'
import ConsentCheckbox from './ConsentCheckbox'
import { submitForm } from '../lib/submitForm'
import { supabase } from '../lib/supabase'

export default function SupplierForm({ t, setPage }) {
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

  // 1. Tracks the Turnstile verification token
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

    // Safety check: Don't submit if user didn't pass Turnstile
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

      // 2. Passes the verification token to Formspree
      "cf-turnstile-response": turnstileToken
    }

    const result = await submitForm('Supplier Application', payload)
    setSubmitting(false)

    if (result.ok) {
      setSubmitted(true)
      // Remember device: save device token to localStorage after successful submission
      // crypto.randomUUID() is universally available in secure (HTTPS) contexts.
      // No Math.random() fallback — predictable tokens are unacceptable.
      try {
        const token = crypto.randomUUID()
        localStorage.setItem('nexallure_device_token', token)
      } catch (e) {
        console.warn('Could not save device token', e)
      }

      // Create Supabase account silently — don't block the success UI
      // Guard: skip if Supabase is not yet configured (env vars missing)
      if (supabase) {
        supabase.auth.signUp({ email, password }).then(({ error }) => {
          if (!error) {
            // Auto sign-in so the Market Guide unlocks immediately without a reload
            supabase.auth.signInWithPassword({ email, password })
          }
        })
      }

      return
    }
    setErrorMsg(result.notConfigured ? t.form_error_not_configured : t.form_error)
  }

  const labelStyle = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '12px',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }

  const inputStyle = {
    width: '100%',
    height: '48px',
    border: '1px solid var(--border)',
    background: 'var(--pure-white)',
    padding: '0 16px',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color 0.2s ease',
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    backgroundSize: '16px',
    paddingRight: '40px',
  }

  return (
    <section id="supplier-form" style={{ background: 'var(--off-white)', padding: '140px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '64px' }}>

        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'var(--accent)', letterSpacing: '0.08em' }}>
              {t.form_eyebrow}
            </div>
            <h2 style={{ fontFamily: "'IBM Plex Serif', serif", fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {t.form_h2}
            </h2>
            <div
              onClick={() => setPage?.('marketGuide')}
              style={{
                fontFamily: '\'IBM Plex Sans\', sans-serif',
                fontSize: '13px',
                color: 'var(--signal-gold)',
                cursor: 'pointer',
                marginTop: '-8px',
              }}
            >
              Not sure which markets to target? &rarr; {t.nav_market_guide}
            </div>
          </div>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '460px' }}>
            {t.form_body}
          </p>
        </motion.div>

        {/* Right Column — Form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
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
                <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} />
              </div>


              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>{t.form_field3_label}</label>
                <select required value={industry} onChange={(e) => setIndustry(e.target.value)} style={selectStyle}>
                  <option value="" disabled>{t.form_field3_placeholder}</option>
                  <option value="automotive">{t.industry_automotive}</option>
                  <option value="electronics">{t.industry_electronics}</option>
                  <option value="machinery">{t.industry_machinery}</option>
                  <option value="textiles">{t.industry_textiles}</option>
                  <option value="chemicals">{t.industry_chemicals}</option>
                  <option value="pharma">{t.industry_pharma}</option>
                  <option value="food">{t.industry_food}</option>
                  <option value="logistics">{t.industry_logistics}</option>
                  <option value="other">{t.industry_other}</option>
                </select>
              </div>

              <AnimatePresence>
                {industry === 'other' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                      <label style={labelStyle}>{t.form_field3_other_placeholder}</label>
                      <input type="text" required value={industryOther} onChange={(e) => setIndustryOther(e.target.value)} style={inputStyle} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>{t.form_field4_label}</label>
                <select required value={size} onChange={(e) => setSize(e.target.value)} style={selectStyle}>
                  <option value="" disabled>{t.form_field4_placeholder}</option>
                  <option value="size_1">{t.size_1}</option>
                  <option value="size_2">{t.size_2}</option>
                  <option value="size_3">{t.size_3}</option>
                  <option value="size_4">{t.size_4}</option>
                  <option value="size_5">{t.size_5}</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>{t.form_field5_label}</label>
                <MultiSelect selected={markets} onChange={setMarkets} t={t} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>{t.form_field6_label}</label>
                <select required value={volume} onChange={(e) => setVolume(e.target.value)} style={selectStyle}>
                  <option value="" disabled>{t.form_field6_placeholder}</option>
                  <option value="volume_1">{t.volume_1}</option>
                  <option value="volume_2">{t.volume_2}</option>
                  <option value="volume_3">{t.volume_3}</option>
                  <option value="volume_4">{t.volume_4}</option>
                  <option value="volume_5">{t.volume_5}</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>{t.form_field7_label}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>{t.form_field_password_label}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder={t.form_field_password_placeholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>{t.form_field_confirm_label}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (confirmError) setConfirmError('')
                  }}
                  style={inputStyle}
                />
                {confirmError && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: 'var(--danger)' }}>
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

              {/* 3. Visual Turnstile Security Check */}
              <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
                <Turnstile
                  sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                />
              </div>

              {errorMsg && (
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger)', padding: '10px 12px' }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ width: '100%', height: '56px', background: submitting ? 'var(--text-muted)' : 'var(--text-primary)', color: 'var(--pure-white)', border: '1px solid var(--text-primary)', boxShadow: submitting ? 'none' : '0 2px 0 0 rgba(0,0,0,0.5)', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.08em', marginTop: '8px', cursor: submitting ? 'wait' : 'pointer' }}
              >
                {submitting ? t.form_submitting : t.form_submit}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
