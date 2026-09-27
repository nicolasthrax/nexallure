import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import RouteMap from '../components/home/RouteMap'
import BriefStory from '../components/home/BriefStory'
import { Stamp } from '../components/home/Stamp'

const EASE = [0.22, 1, 0.36, 1]

function Arrow() {
  return (
    <svg className="nx-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

// A hairline that draws itself across the page when it scrolls into view.
function Rule({ color = 'var(--ink)', weight = 2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 1 })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      initial={reduce ? false : { scaleX: 0 }}
      animate={inView ? { scaleX: 1 } : undefined}
      transition={{ duration: 1.1, ease: EASE }}
      style={{ height: weight, background: color, transformOrigin: 'left' }}
    />
  )
}

// Split the headline into its sentences so each can rise on its own line.
function headlineLines(text) {
  return text.split(/(?<=[.。，,!?！？])\s*/).map((s) => s.trim()).filter(Boolean)
}

function Hero({ t, setPage }) {
  const reduce = useReducedMotion()
  const lines = headlineLines(t.hero_h1)

  return (
    <section style={{ paddingTop: 'calc(100px + clamp(32px, 4.5vw, 72px))', paddingBottom: 'clamp(64px, 8vw, 120px)' }}>
      <style>{`
        .nx-hero__grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: start; }
        .nx-hero__side { grid-column: 1 / span 5; display: flex; flex-direction: column; gap: 36px; }
        .nx-hero__map { grid-column: 6 / span 7; padding-top: 12px; }
        .nx-hero__h1 { font-size: clamp(52px, 5.4vw, 84px); }
        .nx-hero__h1 > span { white-space: nowrap; }
        @media (max-width: 900px) {
          .nx-hero__h1 { font-size: clamp(48px, 13vw, 88px); }
          .nx-hero__h1 > span { white-space: normal; }
        }
        :lang(zh) .nx-hero__h1 { font-size: clamp(44px, 5.2vw, 84px); line-height: 1.14; }
        :lang(zh) .nx-display { line-height: 1.15; letter-spacing: 0.01em; }
        @media (max-width: 900px) {
          .nx-hero__side, .nx-hero__map { grid-column: 1 / -1; }
          .nx-hero__map { margin-top: 56px; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="nx-hero__grid">
          <div className="nx-hero__side">
            <h1 className="nx-display nx-hero__h1">
              {lines.map((line, i) => (
                <span key={line} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.04em' }}>
                  <motion.span
                    style={{ display: 'block' }}
                    initial={reduce ? false : { y: '105%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 0.9, delay: 0.1 + i * 0.09, ease: EASE }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 440 }}>{t.hero_sub}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button className="nx-btn nx-btn--seal" onClick={() => setPage('marketGuide')}>
                  {t.home_mg_cta}
                  <Arrow />
                </button>
                <button
                  className="nx-btn nx-btn--line"
                  onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  {t.hero_cta_secondary}
                </button>
              </div>
            </motion.div>
          </div>

          <div className="nx-hero__map">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>{t.map_title}</h2>
              <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{t.map_hint}</span>
            </div>
            <RouteMap t={t} onPick={() => setPage('marketGuide')} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Manifest({ t, setPage }) {
  const rows = [
    { no: 'NXLU 001', tool: t.about_tool_mg, desc: t.tool_mg_desc, live: true },
    { no: 'NXLU 002', tool: t.about_tool_sample, desc: t.tool_sample_desc },
    { no: 'NXLU 003', tool: t.about_tool_quoting, desc: t.tool_quoting_desc },
  ]

  return (
    <section id="roadmap" style={{ padding: 'clamp(80px, 10vw, 144px) 0', scrollMarginTop: 100 }}>
      <style>{`
        .nx-mf__head { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: end; margin-bottom: 56px; }
        .nx-mf__head h2 { grid-column: 1 / span 6; font-size: clamp(48px, 6.4vw, 96px); }
        .nx-mf__head div { grid-column: 8 / span 5; display: flex; flex-direction: column; gap: 14px; font-size: 16px; line-height: 1.65; color: var(--ink-2); }
        .nx-mf__cols, .nx-mf__row {
          display: grid; grid-template-columns: 120px minmax(0, 1.1fr) 170px minmax(0, 1.4fr) 200px;
          column-gap: 24px; align-items: center;
        }
        .nx-mf__cols { padding: 12px 0; font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); }
        .nx-mf__row { padding: 28px 0; border-bottom: 1px solid var(--rule); transition: background-color 200ms ease; }
        .nx-mf__row:hover { background: var(--paper-light); }
        .nx-mf__tool { font-family: var(--font-display); font-weight: 800; font-size: clamp(28px, 2.8vw, 40px); line-height: 1; }
        .nx-mf__pending {
          justify-self: start; font-family: var(--font-mono); font-size: 12px; color: var(--ink-2);
          border: 1px dashed var(--rule-strong); border-radius: 2px; padding: 4px 8px;
        }
        @media (max-width: 900px) {
          .nx-mf__head h2, .nx-mf__head div { grid-column: 1 / -1; }
          .nx-mf__head div { margin-top: 24px; }
          .nx-mf__cols { display: none; }
          .nx-mf__row { grid-template-columns: 1fr auto; row-gap: 14px; }
          .nx-mf__row > :nth-child(1) { grid-column: 1 / -1; }
          .nx-mf__row > :nth-child(4), .nx-mf__row > :nth-child(5) { grid-column: 1 / -1; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="nx-mf__head">
          <h2 className="nx-display">{t.about_h2}</h2>
          <div>
            <p>{t.about_p1}</p>
            <p>{t.about_p2}</p>
          </div>
        </div>

        <Rule />
        <div className="nx-mf__cols" aria-hidden="true">
          <span>{t.manifest_no}</span>
          <span>{t.about_roadmap_tool}</span>
          <span>{t.about_roadmap_status}</span>
          <span />
          <span />
        </div>
        <div role="list">
          {rows.map((r) => (
            <div key={r.no} className="nx-mf__row" role="listitem">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3)' }}>{r.no}</span>
              <span className="nx-mf__tool">{r.tool}</span>
              {r.live ? <span><Stamp>{t.about_status_live}</Stamp></span> : <span className="nx-mf__pending">{t.about_status_dev}</span>}
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>{r.desc}</p>
              {r.live ? (
                <button className="nx-btn nx-btn--ink" style={{ minHeight: 44, padding: '0 16px', justifySelf: 'start' }} onClick={() => setPage('marketGuide')}>
                  {t.home_mg_cta}
                  <Arrow />
                </button>
              ) : <span />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Buyers({ t, setPage }) {
  return (
    <section style={{ padding: 'clamp(80px, 10vw, 144px) 0', borderTop: '1px solid var(--rule)' }}>
      <style>{`
        .nx-by { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; }
        .nx-by__l { grid-column: 1 / span 6; display: flex; flex-direction: column; gap: 32px; align-items: flex-start; }
        .nx-by__r { grid-column: 8 / span 5; }
        .nx-by__item { display: flex; flex-direction: column; gap: 10px; padding: 24px 0; border-bottom: 1px solid var(--rule); }
        @media (max-width: 900px) { .nx-by__l, .nx-by__r { grid-column: 1 / -1; } .nx-by__r { margin-top: 48px; } }
      `}</style>
      <div className="nx-wrap nx-by">
        <div className="nx-by__l">
          <h2 className="nx-display" style={{ fontSize: 'clamp(44px, 5.6vw, 84px)' }}>{t.vp_h2}</h2>
          <button className="nx-btn nx-btn--line" onClick={() => setPage('buyers')}>
            {t.buyers_cta}
            <Arrow />
          </button>
        </div>
        <div className="nx-by__r">
          <Rule />
          {[
            [t.vp_card2_title, t.vp_card2_body, t.vp_card2_data],
            [t.vp_card3_title, t.vp_card3_body, t.vp_card3_data],
          ].map(([title, body, data]) => (
            <div key={title} className="nx-by__item">
              <h3 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{body}</p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{data}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComplianceLedger({ t }) {
  const rows = [
    [t.footer_status_hosting_label, t.footer_status_hosting],
    [t.footer_status_mainland_label, t.footer_status_not_active],
    [t.footer_status_audit_label, t.footer_status_development],
    [t.footer_status_data_label, t.footer_status_consent, t.comp_card3_data],
  ]
  return (
    <section id="compliance" style={{ padding: 'clamp(80px, 10vw, 144px) 0', background: 'var(--paper-deep)', scrollMarginTop: 100 }}>
      <style>{`
        .nx-cp { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; }
        .nx-cp__l { grid-column: 1 / span 4; display: flex; flex-direction: column; gap: 24px; }
        .nx-cp__r { grid-column: 6 / span 7; background: var(--paper-light); border: 1px solid var(--rule); border-radius: 4px; }
        .nx-cp__row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 24px; padding: 22px 28px; border-bottom: 1px solid var(--rule); align-items: baseline; }
        .nx-cp__row:last-child { border-bottom: 0; }
        @media (max-width: 900px) {
          .nx-cp__l, .nx-cp__r { grid-column: 1 / -1; }
          .nx-cp__r { margin-top: 40px; }
          .nx-cp__row { grid-template-columns: 1fr; gap: 4px; padding: 18px 20px; }
        }
      `}</style>
      <div className="nx-wrap nx-cp">
        <div className="nx-cp__l">
          <h2 className="nx-display" style={{ fontSize: 'clamp(40px, 4.6vw, 68px)' }}>{t.comp_h2}</h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2)' }}>{t.comp_intro}</p>
        </div>
        <div className="nx-cp__r">
          <div className="nx-cp__row" style={{ paddingTop: 14, paddingBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>
            <span>{t.comp_col_item}</span>
            <span>{t.comp_col_status}</span>
          </div>
          {rows.map(([label, value, note], i) => (
            <div key={label} className="nx-cp__row">
              <span style={{ fontSize: 16, fontWeight: 600 }}>{label}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 15, color: i === 3 ? 'var(--go)' : 'var(--ink-2)', fontWeight: i === 3 ? 500 : 400 }}>
                {value}
                {note && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', fontWeight: 400 }}>{note}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Account({ t, setPage }) {
  return (
    <section style={{ padding: 'clamp(88px, 11vw, 160px) 0' }}>
      <style>{`
        .nx-ac { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: center; }
        .nx-ac__l { grid-column: 1 / span 7; display: flex; flex-direction: column; gap: 28px; align-items: flex-start; }
        .nx-ac__r { grid-column: 9 / span 4; display: flex; justify-content: center; }
        @media (max-width: 900px) { .nx-ac__l, .nx-ac__r { grid-column: 1 / -1; } .nx-ac__r { justify-content: flex-start; margin-top: 48px; } }
      `}</style>
      <div className="nx-wrap nx-ac">
        <div className="nx-ac__l">
          <h2 className="nx-display" style={{ fontSize: 'clamp(48px, 6.4vw, 100px)' }}>{t.form_h2}</h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 560 }}>{t.form_body}</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16 }}>
            {[t.form_trust1, t.form_trust2, t.form_trust3].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="var(--seal)" strokeWidth="1.8" /></svg>
                {item}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <button className="nx-btn nx-btn--seal" onClick={() => setPage('register')}>
              {t.mg_blur_signup}
              <Arrow />
            </button>
            <span style={{ fontSize: 15, color: 'var(--ink-2)' }}>
              {t.account_signin_prompt}{' '}
              <button className="nx-link" style={{ color: 'var(--ink)', minHeight: 44 }} onClick={() => setPage('login')}>{t.nav_signin}</button>
            </span>
          </div>
        </div>
        <div className="nx-ac__r">
          <Stamp size="lg" angle={-11}>{t.prelaunch_badge}</Stamp>
        </div>
      </div>
    </section>
  )
}

export default function HomePage({ t, setPage }) {
  return (
    <main style={{ overflowX: 'clip' }}>
      <Hero t={t} setPage={setPage} />
      <Manifest t={t} setPage={setPage} />
      <BriefStory t={t} onOpen={() => setPage('marketGuide')} />
      <Buyers t={t} setPage={setPage} />
      <ComplianceLedger t={t} />
      <Account t={t} setPage={setPage} />
    </main>
  )
}
