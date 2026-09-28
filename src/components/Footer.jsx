import { Logo } from './Logo.jsx'

export default function Footer({ t, setPage, hasDeviceToken }) {
  const statusItems = [
    { label: t.footer_status_hosting_label,  value: t.footer_status_hosting },
    { label: t.footer_status_mainland_label, value: t.footer_status_not_active },
    { label: t.footer_status_audit_label,    value: t.footer_status_development },
    { label: t.footer_status_data_label,     value: t.footer_status_consent },
  ]

  const platformLinks = [
    { label: t.nav_market_guide, onClick: () => setPage?.('marketGuide') },
    { label: t.nav_monitor,      onClick: () => setPage?.('monitor') },
    { label: t.nav_buyers,       onClick: () => setPage?.('buyers') },
  ]

  const legalLinks = [
    { label: t.footer_link_privacy, onClick: () => setPage?.('privacy') },
    { label: t.footer_link_terms,   onClick: () => setPage?.('terms') },
  ]

  const handleForgetDevice = () => {
    try {
      localStorage.removeItem('nexallure_device_token')
      localStorage.removeItem('nexallure_lang')
      window.location.reload()
    } catch (e) {
      console.warn('Could not clear storage', e)
    }
  }

  return (
    <footer id="footer" style={{ background: 'var(--ink)', color: 'var(--on-ink-2)', padding: '88px 0 40px', borderTop: '6px solid var(--yellow)' }}>
      <style>{`
        .nx-ft { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; row-gap: 48px; }
        .nx-ft__brand { grid-column: 1 / span 4; display: flex; flex-direction: column; gap: 16px; }
        .nx-ft__col { grid-column: span 2; display: flex; flex-direction: column; gap: 4px; }
        .nx-ft__status { grid-column: 9 / span 4; }
        .nx-ft h2 { font-size: 15px; font-weight: 700; color: var(--on-ink); margin-bottom: 12px; }
        .nx-ft__brand p { font-size: 17px !important; line-height: 1.6 !important; color: var(--on-ink); }
        .nx-ft__col button {
          text-align: left; background: none; border: 0; padding: 0; min-height: 36px;
          color: var(--on-ink); font-size: 17px; transition: color 150ms ease;
        }
        .nx-ft__col button:hover { color: var(--yellow); }
        .nx-ft__status dl { display: grid; grid-template-columns: auto 1fr; column-gap: 20px; row-gap: 10px; font-size: 16px; }
        .nx-ft__status dt { color: var(--on-ink-2); }
        .nx-ft__status dd { color: var(--on-ink); }
        @media (max-width: 900px) {
          .nx-ft__brand, .nx-ft__status { grid-column: 1 / -1; }
          .nx-ft__col { grid-column: span 6; }
        }
      `}</style>
      <div className="nx-wrap">
        <div className="nx-ft">
          <div className="nx-ft__brand">
            <div>
              <Logo size={34} color="var(--on-ink)" />
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 340 }}>{t.footer_tagline}</p>
            <a href="mailto:hello@nexallure.com" className="nx-link" style={{ color: 'var(--on-ink)', alignSelf: 'flex-start', fontSize: 15 }}>
              hello@nexallure.com
            </a>
          </div>

          <nav className="nx-ft__col" aria-label={t.footer_col2_title}>
            <h2>{t.footer_col2_title}</h2>
            {platformLinks.map((l) => <button key={l.label} onClick={l.onClick}>{l.label}</button>)}
          </nav>

          <nav className="nx-ft__col" aria-label={t.footer_col3_title}>
            <h2>{t.footer_col3_title}</h2>
            {legalLinks.map((l) => <button key={l.label} onClick={l.onClick}>{l.label}</button>)}
            {hasDeviceToken && (
              <button onClick={handleForgetDevice} style={{ color: 'var(--on-ink-2)' }}>
                {t._lang === 'ZH' ? '退出登录 / 忘记此设备' : t._lang === 'TW' ? '登出 / 忘記此裝置' : 'Sign out / forget this device'}
              </button>
            )}
          </nav>

          <div className="nx-ft__status">
            <h2>{t.footer_col4_title}</h2>
            <dl>
              {statusItems.map((s) => (
                <div key={s.label} style={{ display: 'contents' }}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div style={{ marginTop: 72, paddingTop: 24, borderTop: '1px solid var(--ink-rule)', display: 'flex', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', fontSize: 15, lineHeight: 1.6 }}>
          <p style={{ maxWidth: 760 }}>{t.footer_disclaimer}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>{t.footer_copyright}</p>
        </div>
      </div>
    </footer>
  )
}
