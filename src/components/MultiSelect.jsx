import { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Markets are the default option set (used by the supplier registration form).
function marketOptions(t) {
  return [
    { code: 'us',     label: t?.market_us     || 'United States' },
    { code: 'eu',     label: t?.market_eu     || 'European Union' },
    { code: 'uk',     label: t?.market_uk     || 'United Kingdom' },
    { code: 'asean',  label: t?.market_asean  || 'ASEAN' },
    { code: 'gcc',    label: t?.market_gcc    || 'GCC / Middle East' },
    { code: 'latam',  label: t?.market_latam  || 'Latin America' },
    { code: 'africa', label: t?.market_africa || 'Sub-Saharan Africa' },
    { code: 'sa',     label: t?.market_sa     || 'South Asia' },
    { code: 'anz',    label: t?.market_anz    || 'ANZ' },
    { code: 'other',  label: t?.market_other  || 'Other' },
  ]
}

export default function MultiSelect({
  selected,
  onChange,
  t,
  variant = 'light',
  options,
  placeholder,
  summary,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const listId = useId()
  const isDark = variant === 'dark'
  const items = options || marketOptions(t)
  const emptyText = placeholder || t?.form_field5_placeholder || 'Select target markets...'

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (code) => {
    onChange(selected.includes(code) ? selected.filter((m) => m !== code) : [...selected, code])
  }
  const remove = (code) => onChange(selected.filter((m) => m !== code))
  const labelFor = (code) => items.find((m) => m.code === code)?.label || code

  const chipStyle = isDark
    ? { background: '#2A2D35', color: 'var(--on-ink)', border: '1px solid rgba(255,255,255,0.15)' }
    : { background: 'var(--ink)', color: 'var(--paper-light)', border: '1px solid var(--ink)' }

  const triggerBg = isDark ? '#16243A' : 'var(--paper-light)'
  const triggerBorder = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--rule-strong)'
  const triggerText = isDark ? 'var(--on-ink)' : 'var(--ink)'
  const triggerPlaceholder = isDark ? 'var(--on-ink-2)' : 'var(--ink-3)'

  const dropdownBg = isDark ? '#16243A' : 'var(--paper-light)'
  const dropdownBorder = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--rule)'
  const itemText = isDark ? 'var(--on-ink)' : 'var(--ink)'
  const itemHover = isDark ? 'rgba(255,255,255,0.06)' : 'var(--paper)'
  const checkboxBorder = isDark ? 'rgba(255,255,255,0.35)' : 'var(--rule-strong)'
  const checkboxBg = isDark ? 'var(--seal-on-ink)' : 'var(--ink)'

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && isOpen) {
          e.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          {selected.map((code) => (
            <span
              key={code}
              style={{
                ...chipStyle,
                padding: '4px 4px 4px 10px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '3px',
              }}
            >
              {labelFor(code)}
              <button
                type="button"
                onClick={() => remove(code)}
                aria-label={`Remove ${labelFor(code)}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontSize: '16px',
                  lineHeight: 1,
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        style={{
          width: '100%',
          height: '52px',
          border: triggerBorder,
          borderRadius: '4px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: triggerBg,
          fontSize: '15px',
          textAlign: 'left',
          color: selected.length === 0 ? triggerPlaceholder : triggerText,
          transition: 'border-color 0.2s ease',
        }}
      >
        <span>
          {selected.length === 0
            ? emptyText
            : `${selected.length} ${summary || t?.form_field5_summary || 'selected'}`}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: dropdownBg,
              border: dropdownBorder,
              borderRadius: '4px',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
              maxHeight: '280px',
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {items.map((item) => {
              const checked = selected.includes(item.code)
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  key={item.code}
                  onClick={() => toggle(item.code)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 16px',
                    border: 0,
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: itemText,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = itemHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: '16px',
                      height: '16px',
                      border: `1px solid ${checked ? checkboxBg : checkboxBorder}`,
                      background: checked ? checkboxBg : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      borderRadius: '2px',
                    }}
                  >
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 5l3 3 5-6" stroke={isDark ? '#16243A' : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {item.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
