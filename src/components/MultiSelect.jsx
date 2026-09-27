import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MultiSelect({ selected, onChange, t, variant = 'light' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const isDark = variant === 'dark'

  // Build the localized markets list from `t`. Each entry has a stable
  // `code` (used for selection state) and a localized `label`.
  const MARKETS = [
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

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (code) => {
    if (selected.includes(code)) {
      onChange(selected.filter((m) => m !== code))
    } else {
      onChange([...selected, code])
    }
  }

  const remove = (code) => {
    onChange(selected.filter((m) => m !== code))
  }

  const labelFor = (code) => MARKETS.find((m) => m.code === code)?.label || code

  const chipStyle = isDark
    ? { background: '#1c2333', color: 'var(--on-ink)', border: '1px solid rgba(255,255,255,0.15)' }
    : { background: 'var(--text-primary)', color: 'var(--pure-white)', border: '1px solid var(--text-primary)' }

  const triggerBg = isDark ? '#1D2027' : 'var(--pure-white)'
  const triggerBorder = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border)'
  const triggerText = isDark ? 'var(--on-ink)' : 'var(--text-primary)'
  const triggerPlaceholder = isDark ? 'rgba(238,233,221,0.4)' : 'var(--text-muted)'

  const dropdownBg = isDark ? '#1D2027' : 'var(--pure-white)'
  const dropdownBorder = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border)'
  const itemText = isDark ? 'var(--on-ink)' : 'var(--text-primary)'
  const itemHover = isDark ? 'rgba(255,255,255,0.06)' : 'var(--off-white)'
  const checkboxBorder = isDark ? 'rgba(255,255,255,0.25)' : 'var(--border)'
  const checkboxBg = isDark ? 'var(--seal-on-ink)' : 'var(--text-primary)'

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          {selected.map((code) => (
            <div
              key={code}
              className="chip"
              style={{
                ...chipStyle,
                padding: '4px 10px',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '3px',
              }}
            >
              {labelFor(code)}
              <button
                onClick={() => remove(code)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  color: isDark ? 'var(--on-ink)' : 'var(--pure-white)',
                  fontSize: '14px',
                  lineHeight: 1,
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '52px',
          border: triggerBorder,
          borderRadius: '4px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: triggerBg,
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '15px',
          color: selected.length === 0 ? triggerPlaceholder : triggerText,
          transition: 'border-color 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDark ? 'var(--seal-on-ink)' : 'var(--border)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'var(--border)' }}
      >
        <span>
          {selected.length === 0
            ? (t?.form_field5_placeholder || 'Select target markets...')
            : `${selected.length} ${t?.form_field5_summary || 'market(s) selected'}`}
        </span>
        <span style={{ fontSize: '10px', color: triggerPlaceholder }}>▾</span>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="dropdown-panel"
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
            {MARKETS.map((market) => {
              const checked = selected.includes(market.code)
              return (
                <div
                  key={market.code}
                  onClick={() => toggle(market.code)}
                  style={{
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 16px',
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '14px',
                    color: itemText,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = itemHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: `1px solid ${checkboxBorder}`,
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
                        <path d="M1 5l3 3 5-6" stroke={isDark ? '#1D2027' : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {market.label}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
