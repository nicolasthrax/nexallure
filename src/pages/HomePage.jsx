import { motion, useReducedMotion } from 'framer-motion'
import RouteMap from '../components/home/RouteMap'
import BriefStory from '../components/home/BriefStory'

function Arrow() {
  return (
    <svg className="nx-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function Status({ live, t }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: live ? 'var(--go)' : 'var(--ink-3)' }}>
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: live ? 'var(--go)' : 'transparent', border: live ? 0 : '1px solid var(--ink-3)' }} />
      {live ? t.about_status_live : t.about_status_dev}
    </span>
  )
}

function Hero({ t, setPage }) {
  const reduce = useReducedMotion()

  return (
    <section className="nx-night" style={{ paddingTop: 'calc(100px + clamp(40px, 5vw, 80px))', paddingBottom: 'clamp(56px, 7vw, 104px)' }}>
      <style>{`
        .at-hero { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: center; }
        .at-hero__copy { grid-column: 1 / span 5; display: flex; flex-direction: column; gap: 28px; align-items: flex-start; }
        .at-hero__map { grid-column: 6 / span 7; }
        .at-hero__h1 { font-size: clamp(44px, 4.8vw, 80px); }
        :lang(zh) .at-hero__h1 { font-size: clamp(38px, 4vw, 64px); }
        @media (max-width: 960px) {
          .at-hero__copy, .at-hero__map { grid-column: 1 / -1; }
          .at-hero__map { margin-top: 56px; }
          .at-hero__h1 { font-size: clamp(40px, 10vw, 64px); }
        }
      `}</style>
      <div className="nx-wrap at-hero">
        <motion.div
          className="at-hero__copy"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="nx-display at-hero__h1">{t.hero_h1}</h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 480 }}>{t.hero_sub}</p>
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

        <div className="at-hero__map">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t.map_title}</h2>
            <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{t.map_hint}</span>
          </div>
          <RouteMap t={t} onPick={() => setPage('marketGuide')} />
        </div>
      </div>
    </section>
  )
}

// One tool is live and gets room to explain itself; the two still being
// built are listed underneath, plainly marked.
function Roadmap({ t, setPage }) {
  const upcoming = [
    { tool: t.about_tool_sample, desc: t.tool_sample_desc },
    { tool: t.about_tool_quoting, desc: t.tool_quoting_desc },
  ]

  return (
    <section id="roadmap" style={{ padding: 'clamp(88px, 11vw, 160px) 0', scrollMarginTop: 100 }}>
      <style>{`
        .at-rm__head { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: end; margin-bottom: clamp(48px, 6vw, 80px); }
        .at-rm__head h2 { grid-column: 1 / span 6; font-size: clamp(40px, 4.8vw, 76px); }
        .at-rm__head div { grid-column: 8 / span 5; display: flex; flex-direction: column; gap: 14px; font-size: 16px; line-height: 1.7; color: var(--ink-2); }
        .at-rm__live {
          display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: start;
          padding: clamp(28px, 4vw, 48px); background: var(--paper-light); border: 1px solid var(--rule-strong);
        }
        .at-rm__live > :first-child { grid-column: 1 / span 6; display: flex; flex-direction: column; gap: 16px; }
        .at-rm__live > :last-child { grid-column: 8 / span 5; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; }
        .at-rm__row { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: baseline; padding: 28px 0; border-bottom: 1px solid var(--rule); }
        .at-rm__row h3 { grid-column: 1 / span 6; font-size: clamp(24px, 2.2vw, 32px); }
        .at-rm__row p { grid-column: 8 / span 3; font-size: 15px; line-height: 1.65; color: var(--ink-2); }
        .at-rm__row > span { grid-column: 11 / span 2; justify-self: end; }
        @media (max-width: 900px) {
          .at-rm__head h2, .at-rm__head div, .at-rm__live > :first-child, .at-rm__live > :last-child,
          .at-rm__row h3, .at-rm__row p, .at-rm__row > span { grid-column: 1 / -1; }
          .at-rm__head div, .at-rm__live > :last-child { margin-top: 24px; }
          .at-rm__row { row-gap: 10px; }
          .at-rm__row > span { justify-self: start; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="at-rm__head">
          <h2 className="nx-display">{t.about_h2}</h2>
          <div>
            <p>{t.about_p1}</p>
            <p>{t.about_p2}</p>
          </div>
        </div>

        <div className="at-rm__live">
          <div>
            <Status live t={t} />
            <h3 className="nx-display" style={{ fontSize: 'clamp(32px, 3.4vw, 52px)' }}>{t.about_tool_mg}</h3>
          </div>
          <div>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)' }}>{t.tool_mg_desc}</p>
            <button className="nx-btn nx-btn--ink" onClick={() => setPage('marketGuide')}>
              {t.home_mg_cta}
              <Arrow />
            </button>
          </div>
        </div>

        <div role="list" style={{ borderTop: '1px solid var(--rule)', marginTop: 24 }}>
          {upcoming.map((r) => (
            <div key={r.tool} className="at-rm__row" role="listitem">
              <h3 className="nx-display">{r.tool}</h3>
              <p>{r.desc}</p>
              <Status t={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Buyers({ t, setPage }) {
  return (
    <section style={{ padding: 'clamp(88px, 11vw, 160px) 0', borderTop: '1px solid var(--rule)' }}>
      <style>{`
        .at-by { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: start; }
        .at-by__l { grid-column: 1 / span 6; display: flex; flex-direction: column; gap: 32px; align-items: flex-start; }
        .at-by__r { grid-column: 8 / span 5; }
        .at-by__item { display: flex; flex-direction: column; gap: 10px; padding: 28px 0; border-top: 1px solid var(--rule); }
        .at-by__item:last-child { border-bottom: 1px solid var(--rule); }
        @media (max-width: 900px) {
          .at-by__l, .at-by__r { grid-column: 1 / -1; }
          .at-by__r { margin-top: 48px; }
        }
      `}</style>
      <div className="nx-wrap at-by">
        <div className="at-by__l">
          <h2 className="nx-display" style={{ fontSize: 'clamp(40px, 4.8vw, 76px)' }}>{t.vp_h2}</h2>
          <button className="nx-btn nx-btn--line" onClick={() => setPage('buyers')}>
            {t.buyers_cta}
            <Arrow />
          </button>
        </div>
        <div className="at-by__r">
          {[
            [t.vp_card2_title, t.vp_card2_body, t.vp_card2_data],
            [t.vp_card3_title, t.vp_card3_body, t.vp_card3_data],
          ].map(([title, body, data]) => (
            <div key={title} className="at-by__item">
              <h3 className="nx-display" style={{ fontSize: 28 }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>{body}</p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--seal)' }}>{data}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Compliance status set out like a certificate: a framed ledger that says
// plainly where each item stands today.
function Certificate({ t }) {
  const rows = [
    [t.footer_status_hosting_label, t.footer_status_hosting],
    [t.footer_status_mainland_label, t.footer_status_not_active],
    [t.footer_status_audit_label, t.footer_status_development],
    [t.footer_status_data_label, t.footer_status_consent, t.comp_card3_data],
  ]
  return (
    <section id="compliance" style={{ padding: 'clamp(88px, 11vw, 160px) 0', background: 'var(--paper-deep)', scrollMarginTop: 100 }}>
      <style>{`
        .at-cert {
          display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; row-gap: 32px;
          background: var(--paper-light); border: 1px solid var(--rule-strong);
          outline: 1px solid var(--gold); outline-offset: -8px;
          padding: clamp(32px, 5vw, 72px);
        }
        .at-cert__l { grid-column: 1 / span 5; display: flex; flex-direction: column; gap: 20px; }
        .at-cert dl { grid-column: 7 / span 6; border-top: 1px solid var(--ink); }
        .at-cert__row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 24px; padding: 18px 0; border-bottom: 1px solid var(--rule); align-items: baseline; }
        @media (max-width: 900px) {
          .at-cert__l, .at-cert dl { grid-column: 1 / -1; }
          .at-cert__row { grid-template-columns: 1fr; gap: 4px; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="at-cert">
          <div className="at-cert__l">
            <h2 className="nx-display" style={{ fontSize: 'clamp(34px, 3.6vw, 52px)' }}>{t.comp_h2}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>{t.comp_intro}</p>
          </div>
          <dl>
            <div className="at-cert__row" aria-hidden="true" style={{ fontSize: 13, color: 'var(--ink-3)', padding: '12px 0' }}>
              <span>{t.comp_col_item}</span>
              <span>{t.comp_col_status}</span>
            </div>
            {rows.map(([label, value, note], i) => (
              <div key={label} className="at-cert__row">
                <dt className="nx-display" style={{ fontSize: 21 }}>{label}</dt>
                <dd style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 15, color: i === 3 ? 'var(--go)' : 'var(--ink-2)', fontWeight: i === 3 ? 500 : 400 }}>
                  {value}
                  {note && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', fontWeight: 400 }}>{note}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function Account({ t, setPage }) {
  return (
    <section style={{ padding: 'clamp(88px, 11vw, 160px) 0' }}>
      <style>{`
        .at-ac { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: end; }
        .at-ac__l { grid-column: 1 / span 7; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; }
        .at-ac__r { grid-column: 9 / span 4; list-style: none; border-top: 1px solid var(--ink); }
        .at-ac__r li { display: flex; gap: 12px; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--rule); font-size: 15px; }
        @media (max-width: 900px) { .at-ac__l, .at-ac__r { grid-column: 1 / -1; } .at-ac__r { margin-top: 48px; } }
      `}</style>
      <div className="nx-wrap at-ac">
        <div className="at-ac__l">
          <h2 className="nx-display" style={{ fontSize: 'clamp(40px, 5vw, 80px)' }}>{t.form_h2}</h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 540 }}>{t.form_body}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <button className="nx-btn nx-btn--ink" onClick={() => setPage('register')}>
              {t.mg_blur_signup}
              <Arrow />
            </button>
            <span style={{ fontSize: 15, color: 'var(--ink-2)' }}>
              {t.account_signin_prompt}{' '}
              <button className="nx-link" style={{ color: 'var(--ink)', minHeight: 44 }} onClick={() => setPage('login')}>{t.nav_signin}</button>
            </span>
          </div>
        </div>
        <ul className="at-ac__r">
          {[t.form_trust1, t.form_trust2, t.form_trust3].map((item) => (
            <li key={item}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3 3 7-7" stroke="var(--seal)" strokeWidth="1.6" /></svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function HomePage({ t, setPage }) {
  return (
    <main style={{ overflowX: 'clip' }}>
      <Hero t={t} setPage={setPage} />
      <Roadmap t={t} setPage={setPage} />
      <BriefStory t={t} onOpen={() => setPage('marketGuide')} />
      <Buyers t={t} setPage={setPage} />
      <Certificate t={t} />
      <Account t={t} setPage={setPage} />
    </main>
  )
}
