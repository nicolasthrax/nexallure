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
        background: 'var(--paper-deep)',
        borderTop: '1px solid var(--rule)',
        borderBottom: '1px solid var(--rule)',
        color: 'var(--ink-2)',
        fontSize: '13px',
      }}
    >
      <div
        className="nx-wrap"
        style={{ height: '100%', display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap', overflow: 'hidden' }}
      >
        <span
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--seal)',
            border: '1px solid var(--seal)',
            borderRadius: '2px',
            padding: '1px 6px',
          }}
        >
          {t.prelaunch_badge}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.prelaunch_text}</span>
      </div>
    </div>
  )
}
