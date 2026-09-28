import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import DeparturesBoard from '../components/home/DeparturesBoard'
import BriefExplorer from '../components/home/BriefExplorer'

const EASE = [0.22, 1, 0.36, 1]

function Arrow() {
  return (
    <svg className="nx-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

// The headline is set in Anybody, whose letters can be narrow or wide. It
// stretches open when the page loads and narrows again as it scrolls away,
// always coming to rest at its normal, most readable width.
function StretchHeadline({ children }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const load = useMotionValue(reduce ? 100 : 55)
  const weight = useMotionValue(reduce ? 800 : 400)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const squeeze = useTransform(scrollYProgress, [0, 1], reduce ? [100, 100] : [100, 62])
  const width = useTransform([load, squeeze], ([a, b]) => Math.min(a, b))
  const settings = useMotionTemplate`"wdth" ${width}, "wght" ${weight}`

  useEffect(() => {
    if (reduce) return
    const a = animate(load, 100, { duration: 1.3, ease: EASE, delay: 0.1 })
    const b = animate(weight, 800, { duration: 1.1, ease: EASE, delay: 0.1 })
    return () => { a.stop(); b.stop() }
  }, [reduce, load, weight])

  return (
    <motion.h1 ref={ref} className="nx-display hb-hero__h1" style={{ fontVariationSettings: settings }}>
      {children}
    </motion.h1>
  )
}

function Hero({ t, setPage }) {
  const reduce = useReducedMotion()
  const fade = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  })

  return (
    <section style={{ paddingTop: 'calc(100px + clamp(48px, 7vw, 104px))', paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
      <style>{`
        .hb-hero__h1 { font-size: clamp(48px, 7.2vw, 116px); line-height: 0.95; max-width: 17ch; }
        :lang(zh) .hb-hero__h1 { font-size: clamp(44px, 6.4vw, 96px); line-height: 1.2; max-width: 11em; }
        .hb-hero__row { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 32px 64px; align-items: end; margin-top: clamp(36px, 4vw, 56px); }
        .hb-hero__board { margin-top: clamp(56px, 7vw, 96px); }
        @media (max-width: 860px) { .hb-hero__row { grid-template-columns: 1fr; } }
      `}</style>
      <div className="nx-wrap">
        <StretchHeadline>{t.hero_h1}</StretchHeadline>
        <div className="hb-hero__row">
          <motion.p className="nx-prose" style={{ fontSize: 20 }} {...fade(0.35)}>{t.hero_sub}</motion.p>
          <motion.div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }} {...fade(0.45)}>
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
          </motion.div>
        </div>
        <motion.div className="hb-hero__board" {...fade(0.55)}>
          <DeparturesBoard t={t} onPick={() => setPage('marketGuide')} />
        </motion.div>
      </div>
    </section>
  )
}

// Each tool is a shipping container. They are lowered into the stack one by
// one the first time the section comes into view.
function Container({ color, code, children, index, wide }) {
  const reduce = useReducedMotion()
  return (
    <motion.article
      className={`hb-box${wide ? ' hb-box--wide' : ''}`}
      style={{ '--box': color }}
      initial={reduce ? false : { y: -140, opacity: 0, rotate: index % 2 ? 1.5 : -1.5 }}
      whileInView={{ y: 0, opacity: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: 'spring', stiffness: 110, damping: 15, mass: 1.1, delay: index * 0.22 }}
    >
      <span className="hb-box__code" aria-hidden="true">{code}</span>
      <div className="hb-box__plate">{children}</div>
    </motion.article>
  )
}

function Status({ live, t }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: live ? 'var(--green)' : 'var(--ink-3)' }}>
      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: live ? 'var(--green)' : 'transparent', border: live ? 0 : '2px solid var(--ink-3)' }} />
      {live ? t.about_status_live : t.about_status_dev}
    </span>
  )
}

function Tools({ t, setPage }) {
  return (
    <section id="roadmap" style={{ padding: 'clamp(88px, 11vw, 150px) 0', scrollMarginTop: 100 }}>
      <style>{`
        .hb-tools__head { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 24px 64px; align-items: end; margin-bottom: 56px; }
        .hb-tools__head h2 { font-size: clamp(40px, 5vw, 72px); font-stretch: 90%; }
        .hb-stack { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .hb-box {
          position: relative; padding: 22px 18px 18px; background-color: var(--box);
          background-image: repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 7px, rgba(0,0,0,0.10) 7px 14px);
          border: 3px solid rgba(0,0,0,0.35);
        }
        /* Corner castings */
        .hb-box::before, .hb-box::after {
          content: ''; position: absolute; top: -3px; width: 16px; height: 12px; background: rgba(0,0,0,0.45);
        }
        .hb-box::before { left: -3px; }
        .hb-box::after { right: -3px; }
        .hb-box--wide { grid-column: 1 / -1; }
        .hb-box__code {
          display: block; margin-bottom: 14px; font-family: var(--font-mono); font-size: 15px; font-weight: 600;
          letter-spacing: 0.06em; color: #fff;
        }
        .hb-box__plate { background: var(--paper); border: 2px solid var(--ink); padding: clamp(20px, 3vw, 32px); display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
        .hb-box__plate h3 { font-size: clamp(28px, 3vw, 44px); font-stretch: 85%; }
        .hb-box--wide .hb-box__plate { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px 48px; align-items: end; }
        @media (max-width: 860px) {
          .hb-tools__head, .hb-box--wide .hb-box__plate { grid-template-columns: 1fr; }
          .hb-stack { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="hb-tools__head">
          <h2 className="nx-display">{t.about_h2}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className="nx-prose">{t.about_p1}</p>
            <p className="nx-prose">{t.about_p2}</p>
          </div>
        </div>

        <div className="hb-stack">
          <Container color="var(--rust)" code="NXLU 000002 · 2" index={0}>
            <Status t={t} />
            <h3 className="nx-display">{t.about_tool_sample}</h3>
            <p className="nx-prose" style={{ fontSize: 17 }}>{t.tool_sample_desc}</p>
          </Container>
          <Container color="var(--green)" code="NXLU 000003 · 7" index={1}>
            <Status t={t} />
            <h3 className="nx-display">{t.about_tool_quoting}</h3>
            <p className="nx-prose" style={{ fontSize: 17 }}>{t.tool_quoting_desc}</p>
          </Container>
          <Container color="var(--blue)" code="NXLU 000001 · 4" index={2} wide>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Status live t={t} />
              <h3 className="nx-display">{t.about_tool_mg}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
              <p className="nx-prose" style={{ fontSize: 18 }}>{t.tool_mg_desc}</p>
              <button className="nx-btn nx-btn--seal" onClick={() => setPage('marketGuide')}>
                {t.home_mg_cta}
                <Arrow />
              </button>
            </div>
          </Container>
        </div>
      </div>
    </section>
  )
}

function Buyers({ t, setPage }) {
  return (
    <section style={{ padding: 'clamp(88px, 11vw, 150px) 0' }}>
      <style>{`
        .hb-by { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px 64px; align-items: start; }
        .hb-by h2 { font-size: clamp(40px, 5vw, 72px); font-stretch: 90%; }
        .hb-by__item { display: grid; grid-template-columns: 20px 1fr; gap: 6px 18px; padding: 24px 0; border-top: 2px solid var(--ink); }
        .hb-by__item > span { grid-row: span 3; width: 20px; height: 20px; margin-top: 6px; }
        @media (max-width: 860px) { .hb-by { grid-template-columns: 1fr; } }
      `}</style>
      <div className="nx-wrap hb-by">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'flex-start' }}>
          <h2 className="nx-display">{t.vp_h2}</h2>
          <button className="nx-btn nx-btn--line" onClick={() => setPage('buyers')}>
            {t.buyers_cta}
            <Arrow />
          </button>
        </div>
        <div>
          {[
            [t.vp_card2_title, t.vp_card2_body, t.vp_card2_data, 'var(--rust)'],
            [t.vp_card3_title, t.vp_card3_body, t.vp_card3_data, 'var(--green)'],
          ].map(([title, body, data, color]) => (
            <div key={title} className="hb-by__item">
              <span aria-hidden="true" style={{ background: color }} />
              <h3 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h3>
              <p className="nx-prose">{body}</p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600 }}>{data}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Port signal lights: each status lamp is dark until its row comes into
// view, then switches on in its colour.
function Lamp({ color, index }) {
  const ref = useRef(null)
  const on = useInView(ref, { once: true, amount: 1 })
  const reduce = useReducedMotion()
  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      initial={reduce ? false : { backgroundColor: '#C9CED6', boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
      animate={on || reduce ? { backgroundColor: color, boxShadow: `0 0 0 6px ${color === '#545C69' ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.06)'}` } : undefined}
      transition={{ duration: 0.4, delay: 0.15 + index * 0.18 }}
      style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: '2px solid var(--ink)' }}
    />
  )
}

function Compliance({ t }) {
  const rows = [
    [t.footer_status_hosting_label, t.footer_status_hosting, '#1F4FBF'],
    [t.footer_status_mainland_label, t.footer_status_not_active, '#545C69'],
    [t.footer_status_audit_label, t.footer_status_development, '#F2B705'],
    [t.footer_status_data_label, t.footer_status_consent, '#1E6B4E', t.comp_card3_data],
  ]
  return (
    <section id="compliance" style={{ padding: 'clamp(88px, 11vw, 150px) 0', background: 'var(--paper-deep)', borderTop: '2px solid var(--ink)', scrollMarginTop: 100 }}>
      <style>{`
        .hb-cp { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 40px 64px; align-items: start; }
        .hb-cp h2 { font-size: clamp(36px, 4.4vw, 64px); font-stretch: 90%; }
        .hb-cp__list { list-style: none; background: var(--paper); border: 2px solid var(--ink); }
        .hb-cp__row { display: grid; grid-template-columns: 16px minmax(0, 1fr) minmax(0, 1fr); gap: 18px; align-items: center; padding: 20px 22px; border-bottom: 1px solid var(--rule); font-size: 18px; }
        .hb-cp__row:last-child { border-bottom: 0; }
        @media (max-width: 860px) {
          .hb-cp { grid-template-columns: 1fr; }
          .hb-cp__row { grid-template-columns: 16px 1fr; }
          .hb-cp__row > :last-child { grid-column: 2; }
        }
      `}</style>
      <div className="nx-wrap hb-cp">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 className="nx-display">{t.comp_h2}</h2>
          <p className="nx-prose">{t.comp_intro}</p>
        </div>
        <ul className="hb-cp__list">
          {rows.map(([label, value, color, note], i) => (
            <li key={label} className="hb-cp__row">
              <Lamp color={color} index={i} />
              <strong>{label}</strong>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, color: 'var(--ink-2)' }}>
                {value}
                {note && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--ink-3)' }}>{note}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PortTicker({ t }) {
  const ports = ['port_eu', 'port_us', 'port_uk', 'port_asean', 'port_gcc', 'port_sa', 'port_latam', 'port_africa', 'port_anz'].map((k) => t[k])
  const row = [t.map_origin, ...ports]
  return (
    <div className="hb-ticker" aria-hidden="true">
      <div className="hb-ticker__track">
        {[...row, ...row].map((p, i) => (
          <span key={i}>{p}<span className="hb-ticker__sep">→</span></span>
        ))}
      </div>
    </div>
  )
}

function Account({ t, setPage }) {
  return (
    <section style={{ background: 'var(--yellow)', borderTop: '2px solid var(--ink)', overflow: 'hidden' }}>
      <style>{`
        .hb-ac { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 40px 64px; align-items: end; padding: clamp(80px, 10vw, 136px) 0 clamp(56px, 7vw, 88px); }
        .hb-ac h2 { font-size: clamp(44px, 6.4vw, 104px); font-stretch: 85%; transition: font-stretch 500ms var(--ease-out); }
        .hb-ac:hover h2 { font-stretch: 100%; }
        .hb-ac__list { list-style: none; border-top: 2px solid var(--ink); }
        .hb-ac__list li { display: flex; gap: 12px; align-items: center; padding: 14px 0; border-bottom: 2px solid var(--ink); font-size: 18px; font-weight: 600; }
        .hb-ticker { border-top: 2px solid var(--ink); padding: 18px 0; overflow: hidden; white-space: nowrap; }
        .hb-ticker__track { display: inline-flex; gap: 0; animation: hb-ticker 48s linear infinite; font-family: var(--font-display); font-weight: 800; font-stretch: 120%; font-size: clamp(22px, 2.4vw, 32px); }
        .hb-ticker:hover .hb-ticker__track { animation-play-state: paused; }
        .hb-ticker__sep { margin: 0 0.8em; }
        @keyframes hb-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (max-width: 860px) { .hb-ac { grid-template-columns: 1fr; } }
      `}</style>
      <div className="nx-wrap hb-ac">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
          <h2 className="nx-display">{t.form_h2}</h2>
          <p className="nx-prose" style={{ color: 'var(--ink)' }}>{t.form_body}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <button className="nx-btn nx-btn--ink" onClick={() => setPage('register')}>
              {t.mg_blur_signup}
              <Arrow />
            </button>
            <span style={{ fontSize: 17 }}>
              {t.account_signin_prompt}{' '}
              <button className="nx-link" style={{ minHeight: 44 }} onClick={() => setPage('login')}>{t.nav_signin}</button>
            </span>
          </div>
        </div>
        <ul className="hb-ac__list">
          {[t.form_trust1, t.form_trust2, t.form_trust3].map((item) => (
            <li key={item}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9.5l4 4 8-9" stroke="var(--ink)" strokeWidth="2.4" /></svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <PortTicker t={t} />
    </section>
  )
}

export default function HomePage({ t, setPage }) {
  return (
    <main style={{ overflowX: 'clip' }}>
      <Hero t={t} setPage={setPage} />
      <Tools t={t} setPage={setPage} />
      <BriefExplorer t={t} onOpen={() => setPage('marketGuide')} />
      <Buyers t={t} setPage={setPage} />
      <Compliance t={t} />
      <Account t={t} setPage={setPage} />
    </main>
  )
}
