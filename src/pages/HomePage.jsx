import { useRef } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import RouteMap from '../components/home/RouteMap'
import BriefStory from '../components/home/BriefStory'
import { Stamp } from '../components/home/Stamp'

const EASE = [0.22, 1, 0.36, 1]
const GOLD = '#B7A06A'
const POINT = '#FCE5AF'

function Arrow() {
  return (
    <svg className="nx-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

// Fades and lifts its children once, the first time they come into view.
function Reveal({ children, delay = 0, as = 'div', ...rest }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 1, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
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
    <section className="nx-night" style={{ paddingTop: 'calc(100px + clamp(56px, 7vw, 112px))', paddingBottom: 'clamp(56px, 7vw, 96px)', position: 'relative' }}>
      <style>{`
        .at-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 32px; }
        .at-hero__h1 { font-size: clamp(52px, 7vw, 116px); max-width: 17ch; }
        .at-hero__h1 > span:nth-child(2) em { font-style: italic; color: var(--gold); }
        :lang(zh) .at-hero__h1 { font-size: clamp(42px, 6vw, 92px); max-width: none; }
        :lang(zh) .at-hero__h1 em, :lang(zh) .at-in__num { font-style: normal; }
        .at-hero__map { margin-top: clamp(64px, 8vw, 120px); padding-top: 28px; border-top: 1px solid var(--rule); }
        .at-hero__maphead { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
        .at-hero__glow {
          position: absolute; left: 50%; top: 0; width: min(1100px, 120vw); height: 720px; transform: translateX(-50%);
          background: radial-gradient(closest-side, rgba(183,160,106,0.14), transparent 70%);
          pointer-events: none;
        }
      `}</style>
      <div className="at-hero__glow" aria-hidden="true" />
      <div className="nx-wrap" style={{ position: 'relative' }}>
        <div className="at-hero">
          <motion.span
            className="nx-eyebrow"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {t.footer_tagline.split(/[.。]/)[0]}
          </motion.span>
          <h1 className="nx-display at-hero__h1">
            {lines.map((line, i) => (
              <span key={line} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
                <motion.span
                  style={{ display: 'block' }}
                  initial={reduce ? false : { y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: EASE }}
                >
                  {i === 1 ? <em>{line}</em> : line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
          >
            <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink-2)', maxWidth: 620 }}>{t.hero_sub}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
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

        <div className="at-hero__map">
          <div className="at-hero__maphead">
            <h2 className="nx-display" style={{ fontSize: 'clamp(24px, 2.4vw, 32px)' }}>{t.map_title}</h2>
            <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{t.map_hint}</span>
          </div>
          <RouteMap t={t} onPick={() => setPage('marketGuide')} />
        </div>
      </div>
    </section>
  )
}

const NUMERALS = ['I', 'II', 'III']

function Instruments({ t, setPage }) {
  const tools = [
    { tool: t.about_tool_mg, desc: t.tool_mg_desc, live: true },
    { tool: t.about_tool_sample, desc: t.tool_sample_desc },
    { tool: t.about_tool_quoting, desc: t.tool_quoting_desc },
  ]

  return (
    <section id="roadmap" style={{ padding: 'clamp(96px, 12vw, 176px) 0', scrollMarginTop: 100 }}>
      <style>{`
        .at-in__head { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 28px; margin-bottom: clamp(56px, 7vw, 96px); }
        .at-in__head h2 { font-size: clamp(44px, 5.6vw, 88px); max-width: 16ch; }
        .at-in__intro { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 920px; text-align: left; font-size: 16px; line-height: 1.75; color: var(--ink-2); }
        .at-in__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--ink); border-bottom: 1px solid var(--rule); }
        .at-in__cell { display: flex; flex-direction: column; gap: 20px; padding: 40px 36px 44px; border-left: 1px solid var(--rule); transition: background-color 300ms ease; }
        .at-in__cell:first-child { border-left: 0; padding-left: 0; }
        .at-in__cell:hover { background: var(--paper-light); }
        .at-in__num { font-family: var(--font-display); font-style: italic; font-size: 64px; line-height: 0.8; color: var(--gold); }
        .at-in__tool { font-family: var(--font-display); font-weight: 500; font-size: clamp(28px, 2.5vw, 38px); line-height: 1.05; }
        .at-in__dev { align-self: flex-start; font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-3); padding: 7px 0; }
        @media (max-width: 900px) {
          .at-in__intro { grid-template-columns: 1fr; gap: 16px; }
          .at-in__grid { grid-template-columns: 1fr; }
          .at-in__cell { border-left: 0; border-top: 1px solid var(--rule); padding: 36px 0; }
          .at-in__cell:first-child { border-top: 0; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="at-in__head">
          <Reveal as="h2" className="nx-display" delay={0.05}>{t.about_h2}</Reveal>
          <Reveal className="at-in__intro" delay={0.15}>
            <p>{t.about_p1}</p>
            <p>{t.about_p2}</p>
          </Reveal>
        </div>

        <div className="at-in__grid" role="list">
          {tools.map((r, i) => (
            <Reveal key={r.tool} className="at-in__cell" role="listitem" delay={i * 0.12}>
              <span className="at-in__num" aria-hidden="true">{NUMERALS[i]}.</span>
              <h3 className="at-in__tool">{r.tool}</h3>
              {r.live ? <Stamp>{t.about_status_live}</Stamp> : <span className="at-in__dev">{t.about_status_dev}</span>}
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)', flex: 1 }}>{r.desc}</p>
              {r.live && (
                <button className="nx-btn nx-btn--ink" style={{ alignSelf: 'flex-start' }} onClick={() => setPage('marketGuide')}>
                  {t.home_mg_cta}
                  <Arrow />
                </button>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Buyers({ t, setPage }) {
  return (
    <section style={{ padding: 'clamp(96px, 12vw, 176px) 0' }}>
      <style>{`
        .at-by { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: start; }
        .at-by__l { grid-column: 1 / span 6; display: flex; flex-direction: column; gap: 36px; align-items: flex-start; position: sticky; top: 140px; }
        .at-by__r { grid-column: 8 / span 5; display: flex; flex-direction: column; }
        .at-by__item { display: grid; grid-template-columns: 56px 1fr; gap: 8px 20px; padding: 36px 0; border-top: 1px solid var(--rule); }
        .at-by__item:last-child { border-bottom: 1px solid var(--rule); }
        .at-by__item > span:first-child { grid-row: span 3; font-family: var(--font-display); font-style: italic; font-size: 40px; line-height: 0.9; color: var(--gold); }
        .at-by__data { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--seal); margin-top: 6px; }
        :lang(zh) .at-by__data { font-size: 13px; letter-spacing: 0.08em; }
        @media (max-width: 900px) {
          .at-by__l, .at-by__r { grid-column: 1 / -1; position: static; }
          .at-by__r { margin-top: 56px; }
        }
      `}</style>
      <div className="nx-wrap at-by">
        <div className="at-by__l">
          <Reveal as="span" className="nx-eyebrow">{t.nav_buyers}</Reveal>
          <Reveal as="h2" className="nx-display" delay={0.05} style={{ fontSize: 'clamp(44px, 5.4vw, 84px)' }}>{t.vp_h2}</Reveal>
          <Reveal delay={0.15}>
            <button className="nx-btn nx-btn--line" onClick={() => setPage('buyers')}>
              {t.buyers_cta}
              <Arrow />
            </button>
          </Reveal>
        </div>
        <div className="at-by__r">
          {[
            [t.vp_card2_title, t.vp_card2_body, t.vp_card2_data],
            [t.vp_card3_title, t.vp_card3_body, t.vp_card3_data],
          ].map(([title, body, data], i) => (
            <Reveal key={title} className="at-by__item" delay={i * 0.12}>
              <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="nx-display" style={{ fontSize: 30 }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>{body}</p>
              <span className="at-by__data">{data}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// The compliance status, set out like a certificate: a double gold frame
// around a plain ledger of where each item stands today.
function Certificate({ t }) {
  const rows = [
    [t.footer_status_hosting_label, t.footer_status_hosting],
    [t.footer_status_mainland_label, t.footer_status_not_active],
    [t.footer_status_audit_label, t.footer_status_development],
    [t.footer_status_data_label, t.footer_status_consent, t.comp_card3_data],
  ]
  return (
    <section id="compliance" style={{ padding: 'clamp(96px, 12vw, 176px) 0', background: 'var(--paper-deep)', scrollMarginTop: 100 }}>
      <style>{`
        .at-cert {
          max-width: 980px; margin: 0 auto; background: var(--paper-light);
          outline: 1px solid var(--gold); outline-offset: -10px;
          border: 1px solid var(--rule-strong);
          padding: clamp(40px, 6vw, 88px) clamp(24px, 6vw, 96px);
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 24px;
        }
        .at-cert h2 { font-size: clamp(38px, 4.4vw, 64px); max-width: 18ch; }
        .at-cert dl { width: 100%; margin-top: 24px; text-align: left; border-top: 1px solid var(--ink); }
        .at-cert__row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 24px; padding: 20px 0; border-bottom: 1px solid var(--rule); align-items: baseline; }
        .at-cert__cols { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); padding: 12px 0; }
        @media (max-width: 700px) { .at-cert__row { grid-template-columns: 1fr; gap: 4px; } }
      `}</style>
      <div className="nx-wrap">
        <Reveal className="at-cert">
          <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="31" fill="none" stroke={GOLD} strokeWidth="1.2" />
            <circle cx="32" cy="32" r="24" fill={GOLD} />
            <circle cx="32" cy="32" r="1.6" fill={POINT} />
          </svg>
          <h2 className="nx-display">{t.comp_h2}</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', maxWidth: 520 }}>{t.comp_intro}</p>
          <dl>
            <div className="at-cert__row at-cert__cols" aria-hidden="true">
              <span>{t.comp_col_item}</span>
              <span>{t.comp_col_status}</span>
            </div>
            {rows.map(([label, value, note], i) => (
              <div key={label} className="at-cert__row">
                <dt className="nx-display" style={{ fontSize: 22 }}>{label}</dt>
                <dd style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 15, color: i === 3 ? 'var(--go)' : 'var(--ink-2)', fontWeight: i === 3 ? 500 : 400 }}>
                  {value}
                  {note && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', fontWeight: 400 }}>{note}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

// The logo's gold disc, large, turning slowly into view as the reader scrolls.
function Orb() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5], reduce ? [1, 1] : [0.6, 1])
  const ring = useTransform(scrollYProgress, [0, 0.5], reduce ? [1, 1] : [0, 1])
  return (
    <div ref={ref} aria-hidden="true" style={{ width: 'min(200px, 50vw)', aspectRatio: '1', margin: '0 auto' }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <motion.circle cx="100" cy="100" r="98" fill="none" stroke={GOLD} strokeWidth="0.8" style={{ pathLength: ring, rotate: -90, transformOrigin: 'center' }} />
        <motion.circle cx="100" cy="100" r="78" fill={GOLD} style={{ scale, transformOrigin: 'center' }} />
        <circle cx="100" cy="100" r="3" fill={POINT} />
      </svg>
    </div>
  )
}

function Account({ t, setPage }) {
  return (
    <section className="nx-night" style={{ padding: 'clamp(96px, 12vw, 176px) 0' }}>
      <div className="nx-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 36 }}>
        <Orb />
        <Reveal as="h2" className="nx-display" style={{ fontSize: 'clamp(44px, 6vw, 96px)', maxWidth: '16ch' }}>{t.form_h2}</Reveal>
        <Reveal as="p" delay={0.1} style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2)', maxWidth: 560 }}>{t.form_body}</Reveal>
        <Reveal as="ul" delay={0.15} style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 28px', fontSize: 15, color: 'var(--ink-2)' }}>
          {[t.form_trust1, t.form_trust2, t.form_trust3].map((item) => (
            <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
              {item}
            </li>
          ))}
        </Reveal>
        <Reveal delay={0.2} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <button className="nx-btn nx-btn--seal" onClick={() => setPage('register')}>
            {t.mg_blur_signup}
            <Arrow />
          </button>
          <span style={{ fontSize: 15, color: 'var(--ink-2)' }}>
            {t.account_signin_prompt}{' '}
            <button className="nx-link" style={{ color: 'var(--ink)', minHeight: 44 }} onClick={() => setPage('login')}>{t.nav_signin}</button>
          </span>
        </Reveal>
      </div>
    </section>
  )
}

export default function HomePage({ t, setPage }) {
  return (
    <main style={{ overflowX: 'clip' }}>
      <Hero t={t} setPage={setPage} />
      <Instruments t={t} setPage={setPage} />
      <BriefStory t={t} onOpen={() => setPage('marketGuide')} />
      <Buyers t={t} setPage={setPage} />
      <Certificate t={t} />
      <Account t={t} setPage={setPage} />
    </main>
  )
}
