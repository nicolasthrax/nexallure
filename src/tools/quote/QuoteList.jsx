import { useMemo, useState } from 'react'
import { Drawer, Empty } from '../shared/ui.jsx'
import { date, money, percent } from '../shared/format.js'
import { cachedRates } from '../shared/fx.js'
import { computeQuote, marginAt } from './engine.js'

export const STATUSES = ['draft', 'sent', 'won', 'lost']

// Every saved quote, with what today's exchange rate has done to the margin
// of the ones still open with a buyer.
export default function QuoteList({ open, onClose, quotes, currentId, onOpen, onDuplicate, onDelete, onStatus, t, lang }) {
  const [confirm, setConfirm] = useState(null)
  const ref = useMemo(() => (open ? cachedRates() : null), [open])
  const rows = useMemo(() => {
    if (!open) return []
    return quotes.map((q) => {
      let r = null
      try { r = computeQuote(q) } catch { /* a corrupt record should not break the list */ }
      const now = ref?.rates?.[q.currency]
      const drift = r && now && q.status !== 'won' && q.status !== 'lost' && r.fxQuote ? marginAt(q, r, { fxScale: now / r.fxQuote }) : null
      return { q, r, drift }
    })
  }, [open, quotes, ref])

  return (
    <Drawer open={open} onClose={onClose} title={t.q_list_title} label={t.q_list_label.replace('{n}', quotes.length)} closeLabel={t.nav_close}>
      {ref && <p className="tl-hint">{t.q_list_drift_hint.replace('{date}', date(ref.date, lang))}</p>}
      {!rows.length && <Empty title={t.q_list_empty} />}
      {rows.length > 0 && (
        <div className="tl-scroll">
          <table className="tl-table">
            <thead>
              <tr>
                <th>{t.q_list_quote}</th>
                <th>{t.q_list_status}</th>
                <th className="r">{t.q_list_total}</th>
                <th className="r">{t.q_list_margin}</th>
                <th><span className="sr-only">{t.q_list_actions}</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ q, r, drift }) => (
                <tr key={q.id} aria-selected={q.id === currentId}>
                  <td>
                    <button type="button" className="tl-row" onClick={() => onOpen(q.id)}>{q.number} · R{q.rev}</button>
                    <div className="tr-meta">{q.buyer?.company || '—'} · {date(q.updatedAt, lang)}</div>
                  </td>
                  <td>
                    <select className="tl-input tl-select" style={{ height: 36, fontSize: 14, minWidth: 110 }} value={q.status} onChange={(e) => onStatus(q, e.target.value)} aria-label={t.q_list_status}>
                      {STATUSES.map((s) => <option key={s} value={s}>{t[`q_status_${s}`]}</option>)}
                    </select>
                  </td>
                  <td className="r tl-num">{r ? money(r.total, q.currency, lang, 0) : '—'}<div className="tr-meta">{r?.quoteTerm}</div></td>
                  <td className="r tl-num">
                    {r ? percent(r.margin, lang) : '—'}
                    {drift != null && Math.abs(drift - r.margin) > 0.0005 && (
                      <div className="tr-meta" style={{ color: drift < r.margin ? 'var(--danger)' : 'var(--green)', fontWeight: 700 }}>
                        {t.q_list_today.replace('{m}', percent(drift, lang))}
                      </div>
                    )}
                  </td>
                  <td className="r" style={{ whiteSpace: 'nowrap' }}>
                    {confirm === q.id ? (
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <button type="button" className="tl-btn tl-btn--danger" onClick={() => { onDelete(q.id); setConfirm(null) }}>{t.tl_delete_confirm}</button>
                        <button type="button" className="tl-btn tl-btn--quiet" onClick={() => setConfirm(null)}>{t.tl_cancel}</button>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <button type="button" className="tl-btn" onClick={() => onDuplicate(q)}>{t.q_duplicate}</button>
                        <button type="button" className="tl-btn tl-btn--quiet" onClick={() => setConfirm(q.id)} aria-label={`${t.tl_delete} ${q.number}`}>{t.tl_delete}</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Drawer>
  )
}
