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
      setErrorMsg(t.register_verify_required)
      return
    }

    setSubmitting(true)

    // Create the account first: it is what the visitor asked for, and its
    // errors (e.g. an email that is already registered) must be shown. The
    // application details are sent afterwards; if that step is not configured
    // or fails, the account still exists.
    // When email confirmation is off, signUp also signs the visitor in.
    if (supabase) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setSubmitting(false)
        setErrorMsg(error.message)
        return
      }
    }

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

    if (result.ok || supabase) {
      setSubmitted(true)
      // crypto.randomUUID() is universally available in secure (HTTPS) contexts.
      // No Math.random() fallback — predictable tokens are unacceptable.
      try {
        const token = crypto.randomUUID()
        localStorage.setItem('nexallure_device_token', token)
        window.dispatchEvent(new Event('nexallure:device-token'))
      } catch (e) {
        console.warn('Could not save device token', e)
      }
      return
    }
    setErrorMsg(result.notConfigured ? t.form_error_not_configured : t.form_error)
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    color: 'var(--ink-2)',
    marginBottom: '8px',
    fontFamily: "var(--font-mono)",
  }

  const inputBase = {
    width: '100%',
    background: '#fff',
    border: '2px solid var(--rule-strong)',
    borderRadius: '4px',
    padding: '14px 16px',
    color: 'var(--ink)',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: "var(--font-body)",
  }

  const handleFocus = (e) => { e.target.style.borderColor = 'var(--blue)' }
  const handleBlur = (e) => { e.target.style.borderColor = 'var(--rule-strong)' }

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
            fontFamily: "var(--font-mono)",
            fontSize: '13px',
            color: 'var(--signal-gold)',
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          {t.register_eyebrow}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: '44px',
            fontWeight: 800,
            fontStretch: '90%',
            lineHeight: 1.05,
            color: 'var(--ink)',
            textAlign: 'center',
            marginBottom: '40px',
            letterSpacing: '-0.01em',
          }}
        >
          {t.register_h1}
        </h1>

        {submitted ? (
          <div style={{ padding: '24px', border: '1px solid var(--green)', background: 'var(--green-bg)' }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: '15px', color: 'var(--green)' }}>
              {t.form_success}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field1-label" style={labelStyle}>{t.form_field1_label}</label>
              <input id="f-form-field1-label" type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field3-label" style={labelStyle}>{t.form_field3_label}</label>
              <select id="f-form-field3-label" required value={industry} onChange={(e) => setIndustry(e.target.value)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="" disabled style={{ background: '#fff', color: 'var(--ink)' }}>{t.form_field3_placeholder}</option>
                <option value="automotive" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_automotive}</option>
                <option value="electronics" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_electronics}</option>
                <option value="machinery" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_machinery}</option>
                <option value="textiles" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_textiles}</option>
                <option value="chemicals" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_chemicals}</option>
                <option value="pharma" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_pharma}</option>
                <option value="food" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_food}</option>
                <option value="logistics" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_logistics}</option>
                <option value="other" style={{ background: '#fff', color: 'var(--ink)' }}>{t.industry_other}</option>
              </select>
            </div>

            <AnimatePresence>
              {industry === 'other' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                    <label htmlFor="f-form-field3-other-placeholder" style={labelStyle}>{t.form_field3_other_placeholder}</label>
                    <input id="f-form-field3-other-placeholder" type="text" required value={industryOther} onChange={(e) => setIndustryOther(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field4-label" style={labelStyle}>{t.form_field4_label}</label>
              <select id="f-form-field4-label" required value={size} onChange={(e) => setSize(e.target.value)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="" disabled style={{ background: '#fff', color: 'var(--ink)' }}>{t.form_field4_placeholder}</option>
                <option value="size_1" style={{ background: '#fff', color: 'var(--ink)' }}>{t.size_1}</option>
                <option value="size_2" style={{ background: '#fff', color: 'var(--ink)' }}>{t.size_2}</option>
                <option value="size_3" style={{ background: '#fff', color: 'var(--ink)' }}>{t.size_3}</option>
                <option value="size_4" style={{ background: '#fff', color: 'var(--ink)' }}>{t.size_4}</option>
                <option value="size_5" style={{ background: '#fff', color: 'var(--ink)' }}>{t.size_5}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field5-label" style={labelStyle}>{t.form_field5_label}</label>
              <MultiSelect id="f-form-field5-label" selected={markets} onChange={setMarkets} t={t} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field6-label" style={labelStyle}>{t.form_field6_label}</label>
              <select id="f-form-field6-label" required value={volume} onChange={(e) => setVolume(e.target.value)} style={selectStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="" disabled style={{ background: '#fff', color: 'var(--ink)' }}>{t.form_field6_placeholder}</option>
                <option value="volume_1" style={{ background: '#fff', color: 'var(--ink)' }}>{t.volume_1}</option>
                <option value="volume_2" style={{ background: '#fff', color: 'var(--ink)' }}>{t.volume_2}</option>
                <option value="volume_3" style={{ background: '#fff', color: 'var(--ink)' }}>{t.volume_3}</option>
                <option value="volume_4" style={{ background: '#fff', color: 'var(--ink)' }}>{t.volume_4}</option>
                <option value="volume_5" style={{ background: '#fff', color: 'var(--ink)' }}>{t.volume_5}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field7-label" style={labelStyle}>{t.form_field7_label}</label>
              <input id="f-form-field7-label" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field-password-label" style={labelStyle}>{t.form_field_password_label}</label>
              <input id="f-form-field-password-label" type="password" required minLength={8} placeholder={t.form_field_password_placeholder} value={password} onChange={(e) => setPassword(e.target.value)} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="f-form-field-confirm-label" style={labelStyle}>{t.form_field_confirm_label}</label>
              <input id="f-form-field-confirm-label" type="password" required minLength={8} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (confirmError) setConfirmError('') }} className="register-input" style={inputBase} onFocus={handleFocus} onBlur={handleBlur} />
              {confirmError && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: '13px', color: 'var(--danger)' }}>
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
              <div style={{ fontFamily: "var(--font-mono)", fontSize: '14px', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: '4px', padding: '10px 12px' }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '16px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: submitting ? 'wait' : 'pointer',
                transition: 'opacity 0.2s ease',
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => { if (!submitting) e.target.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.target.style.opacity = '1' }}
            >
              {submitting ? t.form_submitting : t.form_submit}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-8" style={{ color: 'var(--ink-2)' }}>
          {t.account_signin_prompt}{' '}
          <button type="button" className="nx-link" style={{ color: 'var(--ink)', minHeight: 44 }} onClick={() => setPage?.('login')}>
            {t.nav_signin} →
          </button>
        </p>
      </motion.div>
    </div>
  )
}
