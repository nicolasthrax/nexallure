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
              fontFamily: "var(--font-body)",
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--ink-2)',
              cursor: 'pointer',
              marginBottom: '32px',
            }}
          >
            {t.back_to_home}
          </button>

          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: '15px',
              color: 'var(--blue)',
                            marginBottom: '16px',
            }}
          >
            {updated}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 'clamp(40px, 6vw, 64px)',
              fontWeight: 800,
              fontStretch: '90%',
              color: 'var(--text-primary)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              marginBottom: '24px',
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: '19px',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: '62ch',
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
                    fontFamily: "var(--font-display)",
                    fontSize: '22px',
                    fontWeight: 800,
                    fontStretch: '90%',
                    color: 'var(--text-primary)',
                    marginBottom: '10px',
                  }}
                >
                  {s.title}
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: '17px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    maxWidth: '66ch',
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
