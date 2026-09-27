import React from 'react'

/* -------------------------------------------------------------------- */
/*  ConsentCheckbox — explicit consent control.                         */
/*                                                                      */
/*  Renders a checkbox + a translated label that can contain inline      */
/*  links to the Privacy Policy and Terms pages. We do NOT use           */
/*  innerHTML; the label is built by splitting on the {privacy} /        */
/*  {terms} tokens so it stays safe and translatable.                    */
/* -------------------------------------------------------------------- */

export default function ConsentCheckbox({
  t,
  label,
  checked,
  onChange,
  onNavigate,
  error,
  required = true,
  tone = 'light',
}) {
  const dark = tone === 'dark'
  const template = label || t.consent_label || ''
  const privacyText = t.consent_privacy_link || 'Privacy Policy'
  const termsText = t.consent_terms_link || 'Terms of Service'

  // Tokenise the label into plain strings and link tokens.
  // Supports {privacy} and {terms} in any order.
  const tokens = []
  let remaining = template
  const re = /\{(privacy|terms)\}/
  let match
  while ((match = remaining.match(re))) {
    const idx = match.index
    if (idx > 0) tokens.push({ type: 'text', value: remaining.slice(0, idx) })
    tokens.push({ type: match[1] })
    remaining = remaining.slice(idx + match[0].length)
  }
  if (remaining) tokens.push({ type: 'text', value: remaining })

  const renderLink = (labelText, target) => (
    <button
      key={target + labelText}
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onNavigate?.(target)
      }}
      style={{
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        color: dark ? 'var(--seal-on-ink)' : 'var(--seal)',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
    >
      {labelText}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '13px',
          color: dark ? 'var(--on-ink-2)' : 'var(--ink-2)',
          lineHeight: 1.55,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          style={{
            marginTop: '3px',
            width: '16px',
            height: '16px',
            accentColor: dark ? 'var(--seal-on-ink)' : 'var(--seal)',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        />
        <span>
          {tokens.map((tok, i) => {
            if (tok.type === 'text') return <React.Fragment key={i}>{tok.value}</React.Fragment>
            if (tok.type === 'privacy') return renderLink(privacyText, 'privacy')
            if (tok.type === 'terms') return renderLink(termsText, 'terms')
            return null
          })}
        </span>
      </label>
      {error && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            color: dark ? '#F08A7A' : 'var(--danger)',
            paddingLeft: '26px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
