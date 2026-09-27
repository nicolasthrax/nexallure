import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

// A red chop that presses onto the page the first time it scrolls into view:
// it comes down large and slightly lifted, lands, and settles at an angle.
export function Stamp({ children, size = 'md', angle = -8, delay = 0.15 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const reduce = useReducedMotion()
  const big = size === 'lg'

  return (
    <motion.span
      ref={ref}
      initial={reduce ? false : { scale: 1.9, opacity: 0, rotate: angle - 10 }}
      animate={inView || reduce ? { scale: 1, opacity: 1, rotate: angle } : undefined}
      transition={reduce ? { duration: 0 } : { delay, type: 'spring', stiffness: 520, damping: 22, mass: 0.9 }}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: big ? '14px 22px' : '5px 12px',
        color: 'var(--seal)',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: big ? '44px' : '20px',
        lineHeight: 1,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Uneven double border, like ink from a worn rubber stamp */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      >
        <path
          d="M1.5 2.2C30 1.2 70 1.6 98.6 2.4c.5 11.8.3 23.6-.4 35.5C70 38.8 30 38.6 1.9 37.8 1 26 1.1 14 1.5 2.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M5 6.1c28-.8 62-.6 90 .2.3 9.2.2 18.6-.3 27.8-27.8.6-61.6.5-89.4-.2C4.6 24.6 4.7 15.3 5 6.1Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          opacity="0.8"
        />
      </svg>
      <span style={{ position: 'relative' }}>{children}</span>
    </motion.span>
  )
}
