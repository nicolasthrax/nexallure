import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

function Bar({ label, value, delay = 0 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 150px) 1fr 40px', gap: 14, alignItems: 'center', fontSize: 17 }}>
      <span>{label}</span>
      <span style={{ height: 12, background: 'var(--paper-deep)', border: '1px solid var(--rule)' }}>
        <motion.span
          style={{ display: 'block', height: '100%', width: `${value}%`, background: 'var(--blue)', transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay, ease: EASE }}
        />
      </span>
      <strong style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{value}</strong>
    </div>
  )
}

// The five parts of a buyer brief, one at a time. The reader chooses which
// part to look at; nothing moves on its own or hijacks the scroll.
export default function BriefExplorer({ t, onOpen }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const tabs = useRef([])

  const parts = [
    {
      title: t.mg_section_where,
      body: (
        <>
          <p style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <span className="nx-display" style={{ fontSize: 72, fontStretch: '80%', color: 'var(--blue)' }}>35%</span>
            <strong style={{ fontSize: 24 }}>{t.sample_country}</strong>
          </p>
          <p className="nx-prose">{t.sample_country_note}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <Bar label={t.score_size} value={75} />
            <Bar label={t.score_entry} value={60} delay={0.08} />
            <Bar label={t.score_growth} value={70} delay={0.16} />
          </div>
        </>
      ),
    },
    {
      title: t.mg_section_platforms,
      body: (
        <p style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 28, fontWeight: 700 }}>
          Alibaba.com
          <span style={{ fontSize: 16, padding: '4px 10px', background: 'var(--blue)', color: '#fff' }}>{t.tier_primary}</span>
        </p>
      ),
    },
    {
      title: t.mg_section_what,
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bar label={t.crit_cert} value={95} />
          <Bar label={t.crit_quality} value={90} delay={0.08} />
          <Bar label={t.crit_price} value={85} delay={0.16} />
        </div>
      ),
    },
    {
      title: t.mg_section_howto,
      body: (
        <>
          <p><span style={{ display: 'inline-block', fontSize: 18, fontWeight: 700, padding: '6px 12px', background: 'var(--ink)', color: 'var(--paper)' }}>{t.sample_fair}</span></p>
          <p className="nx-prose">{t.sample_reach}</p>
        </>
      ),
    },
    {
      title: t.mg_section_redflags,
      body: (
        <p style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 18px', background: 'var(--rust-tint)', border: '2px solid var(--rust)' }}>
          <span style={{ flexShrink: 0, fontSize: 15, fontWeight: 700, padding: '2px 8px', background: 'var(--rust)', color: '#fff' }}>{t.sev_high}</span>
          <span style={{ fontSize: 18, lineHeight: 1.55 }}>{t.sample_mistake}</span>
        </p>
      ),
    },
  ]

  const onKey = (e) => {
    const next = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!next) return
    e.preventDefault()
    const i = (active + next + parts.length) % parts.length
    setActive(i)
    tabs.current[i]?.focus()
  }

  return (
    <section style={{ padding: 'clamp(88px, 11vw, 150px) 0', background: 'var(--paper-deep)', borderTop: '2px solid var(--ink)', borderBottom: '2px solid var(--ink)' }}>
      <style>{`
        .be__head { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 24px 64px; align-items: end; margin-bottom: 48px; }
        .be__head h2 { font-size: clamp(40px, 4.6vw, 64px); font-stretch: 90%; }
        .be { display: grid; grid-template-columns: minmax(240px, 0.8fr) minmax(0, 2fr); border: 2px solid var(--ink); background: var(--paper); }
        .be__tabs { display: flex; flex-direction: column; border-right: 2px solid var(--ink); }
        .be__tab {
          position: relative; display: flex; align-items: center; gap: 14px; text-align: left;
          min-height: 64px; padding: 12px 20px; background: none; border: 0; border-bottom: 1px solid var(--rule);
          font-size: 18px; font-weight: 700; color: var(--ink-2); isolation: isolate;
        }
        .be__tab:last-child { border-bottom: 0; }
        .be__tab[aria-selected="true"] { color: var(--ink); }
        .be__tab:hover { color: var(--ink); }
        .be__letter { font-family: var(--font-mono); font-size: 16px; width: 28px; height: 28px; display: inline-grid; place-items: center; border: 2px solid currentColor; flex-shrink: 0; }
        .be__mark { position: absolute; inset: 0; z-index: -1; background: var(--yellow); }
        .be__panel { padding: clamp(24px, 4vw, 48px); min-height: 340px; display: flex; flex-direction: column; gap: 18px; }
        .be__sample { font-size: 15px; color: var(--ink-3); }
        @media (max-width: 860px) {
          .be__head { grid-template-columns: 1fr; }
          .be { grid-template-columns: 1fr; }
          .be__tabs { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 2px solid var(--ink); }
          .be__tab { flex: 0 0 auto; border-bottom: 0; border-right: 1px solid var(--rule); font-size: 16px; }
          .be__panel { min-height: 0; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="be__head">
          <h2 className="nx-display">{t.home_mg_h1}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
            <p className="nx-prose">{t.mg_hero_teaser}</p>
            <button className="nx-btn nx-btn--ink" onClick={onOpen}>
              {t.home_mg_cta}
              <svg className="nx-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          </div>
        </div>

        <div className="be">
          <div className="be__tabs" role="tablist" aria-label={t.brief_heading_sample} aria-orientation="vertical" onKeyDown={onKey}>
            {parts.map((p, i) => (
              <button
                key={p.title}
                ref={(el) => { tabs.current[i] = el }}
                role="tab"
                id={`be-tab-${i}`}
                aria-selected={active === i}
                aria-controls="be-panel"
                tabIndex={active === i ? 0 : -1}
                className="be__tab"
                onClick={() => setActive(i)}
              >
                {active === i && (
                  <motion.span layoutId="be-mark" className="be__mark" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }} />
                )}
                <span className="be__letter" aria-hidden="true">{'ABCDE'[i]}</span>
                {p.title}
              </button>
            ))}
          </div>
          <div className="be__panel" role="tabpanel" id="be-panel" aria-labelledby={`be-tab-${active}`}>
            <span className="be__sample">{t.story_sample}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: EASE }}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <h3 className="nx-display" style={{ fontSize: 34, fontStretch: '85%' }}>{parts[active].title}</h3>
                {parts[active].body}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
