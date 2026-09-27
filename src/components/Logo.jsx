// Nexallure's official logo: a gold disc with a pale point at its centre,
// and the NEXALLURE wordmark in widely spaced Roman capitals.
// Colours are sampled from the official artwork.
const LOGO_GOLD = '#B7A06A'
const LOGO_POINT = '#FCE5AF'

function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <circle cx="32" cy="32" r="32" fill={LOGO_GOLD} />
      <circle cx="32" cy="32" r="1.4" fill={LOGO_POINT} />
    </svg>
  )
}

// Horizontal lockup for navigation bars and footers.
export function Logo({ size = 28, color = '#77766F' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5 }}>
      <LogoMark size={size} />
      <span
        style={{
          fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
          fontWeight: 500,
          fontSize: size * 0.64,
          letterSpacing: '0.42em',
          marginRight: '-0.42em',
          lineHeight: 1,
          color,
        }}
      >
        NEXALLURE
      </span>
    </span>
  )
}
