import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Small controls shared by the export tools. Numbers are edited as text so a
// half-typed "7." or "" does not snap back while the user is typing.

export function Field({ label, hint, children, wide, className = '' }) {
  return (
    <label className={`tl-field${wide ? ' tl-field--wide' : ''} ${className}`}>
      <span className="tl-label">{label}</span>
      {children}
      {hint && <span className="tl-hint">{hint}</span>}
    </label>
  )
}

export function TextInput({ value, onChange, ...rest }) {
  return <input className="tl-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
}

export function NumInput({ value, onChange, suffix, placeholder, ...rest }) {
  const input = (
    <input
      className="tl-input tl-num"
      inputMode="decimal"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ''))}
      {...rest}
    />
  )
  if (!suffix) return input
  return (
    <span className="tl-affix">
      {input}
      <span className="tl-affix__s" aria-hidden="true">{suffix}</span>
    </span>
  )
}

export function Select({ value, onChange, options, ...rest }) {
  return (
    <select className="tl-input tl-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function Segmented({ value, onChange, options, label, size }) {
  return (
    <div className={`tl-seg${size === 'sm' ? ' tl-seg--sm' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} title={o.title}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Check({ checked, onChange, children }) {
  return (
    <label className="tl-check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  )
}

// A right-hand panel. Focus moves into it on open and back on close.
export function Drawer({ open, onClose, title, label, children, closeLabel }) {
  const ref = useRef(null)
  const back = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()
  // Runs when the drawer opens or closes only; a new onClose each render
  // must not pull focus away from the field being typed in.
  useEffect(() => {
    if (!open) return
    back.current = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => ref.current?.focus(), 30)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      back.current?.focus?.()
    }
  }, [open])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="tl-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.aside
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="tl-drawer"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="tl-drawer__head">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                {label && <span className="tl-label">{label}</span>}
                <h2 id={titleId} className="nx-display tl-drawer__title">{title}</h2>
              </div>
              <button type="button" className="tl-x" onClick={onClose} aria-label={closeLabel}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            </div>
            <div className="tl-drawer__body">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// "Saved on this device" / "Synced to your account".
export function SaveState({ status, signedIn, t, onSignIn }) {
  const text = status === 'synced' ? t.tl_synced
    : status === 'syncing' ? t.tl_syncing
      : status === 'error' ? t.tl_sync_error
        : signedIn ? t.tl_saved_device : t.tl_saved_guest
  return (
    <span className="tl-save" data-status={status}>
      <span className="tl-save__dot" aria-hidden="true" />
      <span>{text}</span>
      {!signedIn && onSignIn && (
        <button type="button" className="nx-link" onClick={onSignIn}>{t.nav_signin}</button>
      )}
    </span>
  )
}

export function Empty({ title, body, children }) {
  return (
    <div className="tl-empty">
      <p style={{ fontSize: 19, fontWeight: 700 }}>{title}</p>
      {body && <p className="nx-prose" style={{ fontSize: 16, margin: '0 auto' }}>{body}</p>}
      {children}
    </div>
  )
}
