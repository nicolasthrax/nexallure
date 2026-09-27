import { motion } from 'framer-motion'

export default function ValueProposition({ t }) {
  const cards = [
    {
      title: t.vp_card2_title,
      body: t.vp_card2_body,
      data: t.vp_card2_data,
    },
    {
      title: t.vp_card3_title,
      body: t.vp_card3_body,
      data: t.vp_card3_data,
    },
  ]

  return (
    <section style={{ 
      background: 'var(--pure-white)', 
      padding: '140px 32px',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 64px' }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              color: 'var(--gold)',
              letterSpacing: '0.18em',
              marginBottom: '16px',
            }}
          >
            {t.vp_eyebrow}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: '40px',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {t.vp_h2}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2px',
            background: 'var(--border)',
          }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="card"
              style={{
                background: 'var(--off-white)',
                padding: '40px',
                borderTop: '3px solid var(--gold)',
              }}
            >
              <h3
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  marginBottom: '24px',
                }}
              >
                {card.body}
              </p>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '12px',
                  color: 'var(--gold)',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '16px',
                }}
              >
                {card.data}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
