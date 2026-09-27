import { useState } from 'react'
import { motion } from 'framer-motion'
import MultiSelect from '../components/MultiSelect'
import ConsentCheckbox from '../components/ConsentCheckbox'
import { submitForm } from '../lib/submitForm'

export default function BuyersPage({ setPage, t }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [categories, setCategories] = useState([])
  const [notes, setNotes] = useState('')

  const [consent, setConsent] = useState(false)
  const [crossBorderConsent, setCrossBorderConsent] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [crossBorderConsentError, setCrossBorderConsentError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setConsentError('')
    setCrossBorderConsentError('')

    if (!consent) {
      setConsentError(t.consent_required)
      return
    }
    if (!crossBorderConsent) {
      setCrossBorderConsentError(t.cross_border_consent_required)
      return
    }

    setSubmitting(true)
    const payload = {
      name,
      work_email: email,
      company,
      role,
      categories_of_interest: categories.join(', '),
      sourcing_notes: notes,
      consent_given: true,
      privacy_terms_consent_given: true,
      privacy_terms_consent_text: t.consent_label,
      cross_border_consent_given: true,
      cross_border_consent_text: t.cross_border_consent_label,
    }

    const result = await submitForm('Buyer Waitlist', payload)
    setSubmitting(false)

    if (result.ok) {
      setSubmitted(true)
      // Remember device: save device token to localStorage after successful submission
      try {
        const token = (typeof crypto !== 'undefined' && crypto.randomUUID) 
          ? crypto.randomUUID() 
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem('nexallure_device_token', token)
      } catch (e) {
        console.warn('Could not save device token', e)
      }
      return
    }
    setErrorMsg(result.notConfigured ? t.form_error_not_configured : t.buyers_error)
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
    color: 'var(--ink-3)',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  }
  const inputStyle = {
    height: '48px',
    border: '1px solid var(--rule)',
    padding: '0 16px',
    fontSize: '15px',
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: 'var(--ink)',
    background: '#FFFFFF',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7A8D' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <section
        id="buyers-section"
        style={{
          background: '#F5F4F0',
          padding: '120px 32px',
          paddingTop: '180px',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '64px',
              alignItems: 'start',
            }}
          >
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 'clamp(48px, 6vw, 88px)',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  lineHeight: 0.95,
                  marginBottom: '28px',
                }}
              >
                {t.buyers_h1}
              </h1>

              <p
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '17px',
                  color: 'var(--ink-2)',
                  lineHeight: 1.65,
                  maxWidth: '480px',
                  marginBottom: '32px',
                }}
              >
                {t.buyers_body}
              </p>

              <ul style={{ listStyle: 'none', borderTop: '2px solid var(--ink)', maxWidth: '480px' }}>
                {[t.buyers_badge2, t.buyers_badge3].map((badge) => (
                  <li
                    key={badge}
                    style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)', fontSize: '15px', color: 'var(--ink)' }}
                  >
                    {badge}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right card — waitlist form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div
                style={{
                  background: 'var(--paper-light)',
                  border: '1px solid var(--rule)',
                  borderRadius: '4px',
                  padding: '36px',
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: '22px',
                    color: 'var(--ink)',
                    marginBottom: '8px',
                  }}
                >
                  {t.buyers_form_title}
                </h2>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '13px',
                    color: 'var(--ink-3)',
                    marginBottom: '24px',
                    lineHeight: 1.6,
                  }}
                >
                  {t.buyers_form_body}
                </p>

                {submitted ? (
                  <div
                    style={{
                      padding: '20px',
                      border: '1px solid var(--go)',
                      background: 'rgba(30,92,58,0.08)',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '13px',
                      color: 'var(--go)',
                    }}
                  >
                    {t.buyers_success}
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
                  >
                    <div>
                      <label style={labelStyle}>{t.buyers_label_name}</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t.buyers_label_email}</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.buyers_label_email_placeholder}
                        autoComplete="email"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t.buyers_label_company}</label>
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        autoComplete="organization"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t.buyers_label_role}</label>
                      <select
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">{t.buyers_label_role_placeholder}</option>
                        <option value={t.buyers_role_procurement}>{t.buyers_role_procurement}</option>
                        <option value={t.buyers_role_supplychain}>{t.buyers_role_supplychain}</option>
                        <option value={t.buyers_role_executive}>{t.buyers_role_executive}</option>
                        <option value={t.buyers_role_compliance}>{t.buyers_role_compliance}</option>
                        <option value={t.buyers_role_other}>{t.buyers_role_other}</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>{t.buyers_label_categories}</label>
                      <MultiSelect selected={categories} onChange={setCategories} t={t} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t.buyers_label_notes}</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t.buyers_label_notes_placeholder}
                        rows={4}
                        style={{
                          ...inputStyle,
                          height: 'auto',
                          padding: '12px 16px',
                          resize: 'vertical',
                          minHeight: '96px',
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                      />
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

                    {errorMsg && (
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '12px',
                          color: 'var(--danger)',
                          background: 'var(--danger-bg)',
                          border: '1px solid var(--danger)',
                          padding: '10px 12px',
                        }}
                      >
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        height: '52px',
                        background: submitting ? 'var(--ink-3)' : 'var(--ink)',
                        color: '#FFF',
                        fontWeight: 600,
                        fontSize: '14px',
                        border: '1px solid var(--ink)',
                        cursor: submitting ? 'wait' : 'pointer',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        letterSpacing: '0.06em',
                        marginTop: '4px',
                      }}
                    >
                      {submitting ? t.buyers_submitting : t.buyers_submit}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        style={{
          background: 'var(--ink)',
          padding: '60px 32px',
          display: 'flex',
          justifyContent: 'center',
          gap: '64px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { num: t.buyers_stat3_num, label: t.buyers_stat3_label },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '20px',
                color: 'var(--seal-on-ink)',
                marginBottom: '4px',
                letterSpacing: '0.05em',
              }}
            >
              {stat.num}
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                color: 'var(--on-ink-2)',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}