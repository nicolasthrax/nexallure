import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

// A gold hallmark: a thin double frame that wipes open the first time it
// scrolls into view, with its label set in spaced capitals, like the logo.
export function Stamp({ children, size = 'md', delay = 0.15 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const reduce = useReducedMotion()
  const big = size === 'lg'

  return (
    <motion.span
      ref={ref}
      initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }}
      animate={inView || reduce ? { clipPath: 'inset(0 0% 0 0)' } : undefined}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: big ? '16px 28px' : '6px 12px',
        border: '3px double currentColor',
        color: 'var(--seal)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: big ? '15px' : '11px',
        lineHeight: 1,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      <span style={{ marginRight: '-0.22em' }}>{children}</span>
    </motion.span>
  )
}
