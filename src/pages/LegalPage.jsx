import { motion } from 'framer-motion'

export default function LegalPage({ t, setPage, title, updated, intro, sections }) {
  return (
    <section
      style={{
        background: 'var(--pure-white)',
        padding: '160px 32px 120px',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <button
            onClick={() => setPage('home')}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              marginBottom: '32px',
            }}
          >
            {t.back_to_home}
          </button>

          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              color: 'var(--gold)',
              letterSpacing: '0.18em',
              marginBottom: '16px',
            }}
          >
            {updated}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: '40px',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              marginBottom: '24px',
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '16px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '40px',
            }}
          >
            {intro}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {sections.map((s, i) => (
              <div key={i}>
                <h2
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '10px',
                  }}
                >
                  {s.title}
                </h2>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.75,
                  }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
