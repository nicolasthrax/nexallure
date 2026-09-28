import { useState } from 'react'
import { relative } from '../shared/format.js'
import { CASE_COLUMNS, SAMPLE_COLUMNS, caseColumn, moveSample, nextDue, nextStep, warmth } from './model.js'

const DAY = 86400000
const since = (d) => Math.max(0, Math.floor((Date.now() - Date.parse(d)) / DAY))

function SampleCard({ rec, t, onOpen, dragging }) {
  const heat = warmth(rec)
  const stageStart = rec.stageAt?.[rec.stage] || rec.createdAt
  const meta = rec.stage === 'won' ? t.tr_card_won.replace('{v}', Number(rec.poValue || 0).toLocaleString('en-US'))
    : rec.stage === 'lost' ? t.tr_card_lost.replace('{r}', t[`tr_lost_${rec.lostReason}`] || '')
      : rec.stage === 'transit' && rec.awb ? `${rec.courier} ${rec.awb.slice(0, 6)}…`
        : t[`tr_policy_${rec.costPolicy}`]
  return (
    <button
      type="button"
      className="tr-card"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', rec.id); e.dataTransfer.effectAllowed = 'move'; dragging(rec.id) }}
      onDragEnd={() => dragging(null)}
      onClick={() => onOpen(rec.id)}
    >
      <span className="tr-card__t"><strong>{rec.buyer?.company || t.tr_no_buyer}</strong><span className="tr-meta">{rec.buyer?.country || ''}</span></span>
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{rec.item || '—'}</span>
      {heat != null && rec.stage !== 'won' && rec.stage !== 'lost' && (
        <span className="tl-bar" style={{ height: 6 }} aria-label={`${t.tr_warmth} ${heat}`}>
          <span style={{ width: `${heat}%`, background: heat > 60 ? 'var(--green)' : heat > 30 ? 'var(--yellow)' : 'var(--rust)' }} />
        </span>
      )}
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span className="tr-meta">{rec.ref} · {meta}</span>
        <span className="tr-meta" style={heat != null && heat < 30 && rec.stage !== 'won' && rec.stage !== 'lost' ? { color: 'var(--rust)', fontWeight: 700 } : undefined}>
          {t.tl_days_short.replace('{n}', since(stageStart))}
        </span>
      </span>
    </button>
  )
}

export function SampleBoard({ samples, t, onOpen, save }) {
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const drop = (col) => (e) => {
    e.preventDefault()
    setOver(null)
    const id = e.dataTransfer.getData('text/plain') || drag
    const rec = samples.find((s) => s.id === id)
    if (!rec) return
    const target = SAMPLE_COLUMNS.find((c) => c.id === col)
    if (target.stages.includes(rec.stage)) return
    // Won or lost needs a PO value or a reason: open the record instead.
    if (col === 'decided') { onOpen(id); return }
    save(moveSample(rec, target.stages[0]))
  }
  return (
    <div className="tr-board">
      {SAMPLE_COLUMNS.map((col) => {
        const cards = samples.filter((s) => col.stages.includes(s.stage))
        return (
          <section
            key={col.id}
            className="tr-col"
            aria-label={t[`tr_col_${col.id}`]}
            data-drop={over === col.id}
            onDragOver={(e) => { e.preventDefault(); setOver(col.id) }}
            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
            onDrop={drop(col.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>{t[`tr_col_${col.id}`]}</strong>
              <span className="tl-num" style={{ color: 'var(--ink-3)' }}>{cards.length}</span>
            </div>
            {cards.map((rec) => <SampleCard key={rec.id} rec={rec} t={t} onOpen={onOpen} dragging={setDrag} />)}
          </section>
        )
      })}
    </div>
  )
}

export function CaseBoard({ cases, t, onOpen }) {
  return (
    <div className="tr-board">
      {CASE_COLUMNS.map((col) => {
        const cards = cases.filter((c) => caseColumn(c) === col)
        return (
          <section key={col} className="tr-col" aria-label={t[`tr_ccol_${col}`]}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>{t[`tr_ccol_${col}`]}</strong>
              <span className="tl-num" style={{ color: 'var(--ink-3)' }}>{cards.length}</span>
            </div>
            {cards.map((rec) => {
              const step = nextStep(rec)
              const due = step ? nextDue(rec) : null
              const late = due && due < new Date()
              return (
                <button key={rec.id} type="button" className="tr-card" onClick={() => onOpen(rec.id)}>
                  <span className="tr-card__t">
                    <strong>{rec.buyer?.company || t.tr_no_buyer}</strong>
                    <span className={`tl-pill ${rec.severity === 'critical' ? 'tl-pill--rust' : rec.severity === 'major' ? 'tl-pill--yellow' : ''}`} style={{ fontSize: 11, padding: '0 6px' }}>{t[`tr_sev_${rec.severity}`]}</span>
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{rec.title || t[`tr_type_${rec.type}`]}</span>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span className="tr-meta">{rec.ref}{step ? ` · ${step}` : ''}</span>
                    {due && <span className="tr-due" data-late={late} style={{ fontSize: 12 }}>{relative(due, t)}</span>}
                  </span>
                </button>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
