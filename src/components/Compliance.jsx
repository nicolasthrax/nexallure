import { motion } from 'framer-motion'

export default function Compliance({ t }) {
  const cards = [
    { title: t.comp_card1_title, body: t.comp_card1_body, data: t.comp_card1_data },
    { title: t.comp_card3_title, body: t.comp_card3_body, data: t.comp_card3_data },
  ]

  const badges = [
    t.badge_iso,
    t.badge_hosting,
    t.badge_pipl,
  ]

  return (
    <section id="compliance" style={{ background: 'var(--pure-white)', padding: '140px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ marginBottom: '48px' }}
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
            {t.comp_eyebrow}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: '36px',
              color: 'var(--text-primary)',
              maxWidth: '620px',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {t.comp_h2}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2px',
            marginBottom: '48px',
            background: 'var(--border)',
          }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="card"
              style={{
                background: 'var(--off-white)',
                padding: '32px',
                borderTop: '3px solid var(--gold)',
              }}
            >
              <h3
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
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
                }}
              >
                {card.body}
              </p>
              <div
                style={{
                  marginTop: '16px',
                  fontSize: '11px',
                  color: 'var(--gold)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.04em',
                }}
              >
                {card.data}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}
        >
          {badges.map((badge) => (
            <div
              key={badge}
              className="badge"
              style={{
                border: '1px solid var(--gold)',
                background: 'rgba(184,146,46,0.06)',
                padding: '8px 14px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                color: 'var(--gold-shadow)',
                letterSpacing: '0.04em',
              }}
            >
              {badge}
            </div>
          ))}
        </motion.div>

        {/* Honest disclaimer */}
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '760px',
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
            fontStyle: 'italic',
          }}
        >
          {t.footer_disclaimer}
        </p>
      </div>
    </section>
  )
}
