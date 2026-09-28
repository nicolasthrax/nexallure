// A safety-yellow strip, like the tape on a quay edge: impossible to miss,
// and dark text on yellow reads clearly.
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
        background: 'var(--yellow)',
        borderBottom: '2px solid var(--ink)',
        color: 'var(--ink)',
        fontSize: '15px',
      }}
    >
      <div
        className="nx-wrap"
        style={{ height: '100%', display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap', overflow: 'hidden' }}
      >
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: 28,
            height: 14,
            background: 'repeating-linear-gradient(-45deg, var(--ink) 0 5px, transparent 5px 10px)',
          }}
        />
        <strong style={{ flexShrink: 0, fontWeight: 700 }}>{t.prelaunch_badge}</strong>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.prelaunch_text}</span>
      </div>
    </div>
  )
}
