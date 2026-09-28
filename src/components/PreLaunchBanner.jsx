export default function PreLaunchBanner({ t }) {
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        zIndex: 95,
        height: '36px',
        background: 'var(--ink-deep)',
        borderBottom: '1px solid var(--ink-rule)',
        color: 'var(--on-ink-2)',
        fontSize: '13px',
      }}
    >
      <div
        className="nx-wrap"
        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', whiteSpace: 'nowrap', overflow: 'hidden' }}
      >
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--gold)',
          }}
        >
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
          {t.prelaunch_badge}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.prelaunch_text}</span>
      </div>
    </div>
  )
}
