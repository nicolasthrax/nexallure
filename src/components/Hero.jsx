import { motion } from 'framer-motion'
import WireframeDottedGlobe from './WireframeDottedGlobe'

export default function Hero({ t, setPage }) {
  const scrollToRoadmap = () => {
    const el = document.getElementById('roadmap')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--midnight-navy)',
        padding: '160px 48px 80px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(var(--border-dark) 1px, transparent 1px), linear-gradient(90deg, var(--border-dark) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          opacity: 0.2,
        }}
      />

      {/* Globe background layer (Fix 2) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '-12%', // push it off-edge so it's cropped on the right
        transform: 'translateY(-50%)',
        width: '72%', // large but not full-width
        aspectRatio: '1',
        zIndex: 0,
        opacity: 0.75, // 75% opacity
        maskImage: 'radial-gradient(ellipse 85% 85% at 60% 50%, black 40%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 60% 50%, black 40%, transparent 75%)',
      }}>
        <WireframeDottedGlobe
          width={900}
          height={900}
          style={{ width: '100%', height: '100%' }}
          canvasStyle={{ width: '100%', height: '100%', borderRadius: '0' }}
        />
      </div>

      {/* Text content layer — elevated over the globe and capped at 60% width */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '60%' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              color: 'var(--signal-gold)',
              letterSpacing: '0.15em',
              marginBottom: '20px',
            }}
          >
            {t.hero_eyebrow}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: '54px',
              fontWeight: 700,
              color: 'var(--warm-white)',
              lineHeight: 1.12,
              marginBottom: '24px',
            }}
          >
            {t.hero_h1}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '17px',
              color: 'var(--text-light)',
              maxWidth: '520px',
              lineHeight: 1.65,
              marginBottom: '32px',
            }}
          >
            {t.hero_sub}
        </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          style={{ display: 'flex', gap: '16px', marginBottom: '48px', flexWrap: 'wrap' }}
        >
          <button
            onClick={scrollToRoadmap}
            style={{
              background: 'var(--signal-gold)',
              color: 'var(--midnight-navy)',
              border: '1px solid var(--gold-shadow)',
              padding: '14px 28px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {t.hero_cta_secondary}
          </button>
        </motion.div>
      </div>
    </section>
  )
}