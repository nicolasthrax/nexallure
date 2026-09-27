import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

function useIsNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

function Bar({ label, value, on, delay = 0, tone = 'var(--ink)' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(96px, 128px) 1fr 34px', gap: 12, alignItems: 'center', fontSize: 13 }}>
      <span>{label}</span>
      <span style={{ height: 6, background: 'var(--paper-deep)', borderRadius: 1, overflow: 'hidden' }}>
        <motion.span
          style={{ display: 'block', height: '100%', background: tone, transformOrigin: 'left', width: `${value}%` }}
          initial={false}
          animate={{ scaleX: on ? 1 : 0 }}
          transition={{ duration: 0.8, delay, ease: EASE }}
        />
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Block({ letter, title, on, children }) {
  return (
    <motion.section
      initial={false}
      animate={{ opacity: on ? 1 : 0.18 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--rule)' }}
    >
      <h4 style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 14, fontWeight: 600 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', fontWeight: 400 }}>{letter}</span>
        {title}
      </h4>
      {children}
    </motion.section>
  )
}

// The Market Guide brief, written out section by section as the reader scrolls.
// On narrow screens (and with reduced motion) it simply appears complete.
export default function BriefStory({ t, onOpen }) {
  const track = useRef(null)
  const narrow = useIsNarrow()
  const reduce = useReducedMotion()
  const staticMode = narrow || reduce
  const docInView = useInView(track, { once: true, amount: 0.2 })
  const [stage, setStage] = useState(0)

  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (staticMode) return
    setStage(Math.min(5, Math.floor(p * 6.2)))
  })

  const s = staticMode ? (docInView ? 5 : 0) : stage
  const sections = [t.mg_section_where, t.mg_section_platforms, t.mg_section_what, t.mg_section_howto, t.mg_section_redflags]

  return (
    <section style={{ background: 'var(--ink)', color: 'var(--on-ink)' }}>
      <style>{`
        .nx-story { position: relative; height: ${staticMode ? 'auto' : '300vh'}; }
        .nx-story__stick {
          position: ${staticMode ? 'relative' : 'sticky'}; top: 100px;
          min-height: ${staticMode ? '0' : 'calc(100vh - 100px)'};
          display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px;
          align-items: center; padding-top: ${staticMode ? '88px' : '24px'}; padding-bottom: ${staticMode ? '88px' : '24px'};
        }
        .nx-story__copy { grid-column: 1 / span 5; display: flex; flex-direction: column; gap: 24px; }
        .nx-story__doc { grid-column: 7 / span 6; }
        .nx-checklist { list-style: none; display: flex; flex-direction: column; border-top: 1px solid var(--ink-rule); }
        .nx-checklist li {
          display: flex; align-items: center; gap: 14px; padding: 12px 0;
          border-bottom: 1px solid var(--ink-rule); font-size: 16px; color: var(--on-ink-2);
          transition: color 300ms ease;
        }
        .nx-checklist li[data-done="true"] { color: var(--on-ink); }
        .nx-check {
          width: 20px; height: 20px; flex-shrink: 0; border: 1px solid var(--on-ink-2); border-radius: 2px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: background-color 300ms ease, border-color 300ms ease;
        }
        li[data-done="true"] .nx-check { background: var(--seal-on-ink); border-color: var(--seal-on-ink); }
        @media (min-width: 901px) and (max-height: 900px) {
          .nx-story__doc article { zoom: 0.88; }
          .nx-checklist li { padding: 9px 0; }
        }
        @media (max-width: 900px) {
          .nx-story__copy, .nx-story__doc { grid-column: 1 / -1; }
          .nx-story__doc { margin-top: 48px; }
        }
      `}</style>

      <div ref={track} className="nx-story">
        <div className="nx-wrap nx-story__stick">
          <div className="nx-story__copy">
            <h2 className="nx-display" style={{ fontSize: 'clamp(44px, min(5.4vw, 9vh), 84px)', color: 'var(--on-ink)' }}>{t.home_mg_h1}</h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--on-ink-2)', maxWidth: 520 }}>{t.mg_hero_teaser}</p>
            <ol className="nx-checklist">
              {sections.map((label, i) => (
                <li key={label} data-done={s > i}>
                  <span className="nx-check" aria-hidden="true">
                    {s > i && (
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <motion.path d="M2 6.5l2.5 2.5L10 3" fill="none" stroke="var(--ink)" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                      </svg>
                    )}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
            <div>
              <button className="nx-btn nx-btn--paper" onClick={onOpen}>
                {t.home_mg_cta}
                <svg className="nx-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" /></svg>
              </button>
            </div>
          </div>

          <div className="nx-story__doc">
            <article
              aria-label={t.story_sample}
              style={{
                background: 'var(--paper-light)', color: 'var(--ink)', borderRadius: 4,
                boxShadow: '0 1px 0 rgba(0,0,0,0.2), 0 30px 60px -30px rgba(0,0,0,0.6)',
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 24px', borderBottom: '1px dashed var(--rule-strong)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                <span>{t.story_sample}</span>
                <span>NXLU 000001</span>
              </header>
              <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span className="nx-label" style={{ fontSize: 12 }}>{t.story_pick}</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{t.industry_machinery}</span>
                  <span aria-hidden="true" style={{ color: 'var(--seal)' }}>→</span>
                  <span className="nx-label" style={{ fontSize: 12 }}>{t.story_region}</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{t.market_eu}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Bar label={t.score_size} value={75} on={s >= 0 && docInView} />
                  <Bar label={t.score_entry} value={60} on={s >= 0 && docInView} delay={0.08} />
                  <Bar label={t.score_growth} value={70} on={s >= 0 && docInView} delay={0.16} />
                </div>

                <Block letter="A" title={t.mg_section_where} on={s >= 1}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <span className="nx-display" style={{ fontSize: 34, lineHeight: 1 }}>35%</span>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{t.sample_country}</span>
                    <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{t.sample_country_note}</span>
                  </div>
                </Block>

                <Block letter="B" title={t.mg_section_platforms} on={s >= 2}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
                    <span style={{ fontWeight: 600 }}>Alibaba.com</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, border: '1px solid var(--ink)', borderRadius: 2, padding: '1px 6px' }}>{t.tier_primary}</span>
                  </div>
                </Block>

                <Block letter="C" title={t.mg_section_what} on={s >= 3}>
                  <Bar label={t.crit_cert} value={95} on={s >= 3} />
                  <Bar label={t.crit_quality} value={90} on={s >= 3} delay={0.08} />
                  <Bar label={t.crit_price} value={85} on={s >= 3} delay={0.16} />
                </Block>

                <Block letter="D" title={t.mg_section_howto} on={s >= 4}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: 13, background: 'var(--ink)', color: 'var(--paper-light)', padding: '4px 10px', borderRadius: 2 }}>{t.sample_fair}</span>
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>{t.sample_reach}</p>
                  </div>
                </Block>

                <Block letter="E" title={t.mg_section_redflags} on={s >= 5}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 12px', background: 'var(--seal-tint)', borderRadius: 2 }}>
                    <span style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--seal)', color: '#fff', padding: '1px 6px', borderRadius: 2 }}>{t.sev_high}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.5 }}>{t.sample_mistake}</span>
                  </div>
                </Block>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
