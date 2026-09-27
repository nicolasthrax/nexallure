// The Nexallure mark: a square chop, drawn slightly uneven like a real
// hand-pressed seal, with an N cut out of it.
export function Seal({ size = 32, color = 'var(--seal)', ink = 'var(--paper-light)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M3.2 2.6C10.9 2.1 21.4 2.3 29.1 2.9c.6 8.4.5 17.9-.2 26.3-7.9.6-18.2.5-26 .1C2.4 21 2.5 10.9 3.2 2.6Z"
        fill={color}
      />
      <path d="M10 23.5V8.5l12 15v-15" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  )
}
