import { useMemo, useState } from 'react'
import { Segmented } from '../shared/ui.jsx'
import { money, number, percent, yuan } from '../shared/format.js'
import { usableLength } from './packing.js'
import { breakEvenRate, containerBreaks, fillSuggestion, sensitivity } from './engine.js'
import LoadView, { lineColor } from './LoadView.jsx'

const PART_GROUPS = [
  { id: 'goods', keys: ['goods'], color: 'var(--ink)' },
  { id: 'overhead', keys: ['overhead'], color: 'var(--ink-3)' },
  { id: 'tax', keys: ['traderVat', 'mfgVat'], color: 'var(--rust)' },
  { id: 'origin', keys: ['haulage', 'docs', 'origin'], color: '#6F8FD8' },
  { id: 'freight', keys: ['freight', 'insurance'], color: 'var(--blue)' },
  { id: 'destination', keys: ['dest', 'delivery', 'broker', 'duty', 'importFees', 'importVat'], color: 'var(--blue-deep)' },
  { id: 'terms', keys: ['commission', 'sinosure', 'bank', 'financing'], color: 'var(--yellow)' },
]
const ADDS = {
  EXW: [], FCA: ['q_add_haulage'], FOB: ['q_add_origin'], CFR: ['q_add_freight'], CPT: ['q_add_freight'],
  CIF: ['q_add_insurance'], CIP: ['q_add_insurance'], DAP: ['q_add_dest'], DDP: ['q_add_duty'],
}

function Headline({ q, r, t, lang, set }) {
  const empty = !(r.revenueCny > 0)
  const below = !empty && r.margin < (parseFloat(q.marginFloor) || 0) / 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="tl-sec__h">
        <h2 className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_quoting_term}</h2>
        <Segmented size="sm" label={t.q_term} value={r.quoteTerm} onChange={(v) => set({ term: v })} options={r.terms.map((x) => ({ value: x, label: x }))} />
      </div>
      <div className="qd-headline">
        <div>
          <span className="tl-label">{t.q_total_at.replace('{term}', `${r.quoteTerm} ${placeFor(q, r.quoteTerm)}`)}</span>
          <span className="qd-big">{money(r.total, q.currency, lang)}</span>
          <span className="tl-note">{t.q_shipment_sum.replace('{ctn}', number(r.shipment.cartons, lang)).replace('{cbm}', number(r.shipment.cbm, lang, 2)).replace('{kg}', number(r.shipment.kg, lang))}</span>
        </div>
        <div>
          <span className="tl-label">{q.marginBasis === 'cost' ? t.q_markup_earned : t.q_margin_earned}</span>
          <span className="qd-big" style={{ color: empty ? undefined : below ? 'var(--danger)' : 'var(--green)' }}>{empty ? '—' : percent(r.margin, lang)}</span>
          <span className="tl-note">{t.q_profit_is.replace('{v}', yuan(r.profitCny, lang))}</span>
        </div>
        <div>
          <span className="tl-label">{t.q_fx_cost}</span>
          <span className="qd-big">{r.exchangeCost ? number(r.exchangeCost, lang, 3) : '—'}</span>
          <span className="tl-note">{t.q_fx_cost_is.replace('{rate}', number(r.fxQuote, lang, 4)).replace('{cur}', q.currency)}</span>
        </div>
      </div>
    </div>
  )
}

export function placeFor(q, term) {
  const port = (p) => (p || '').split('·')[0].trim()
  switch (term) {
    case 'EXW': return q.originPlace || port(q.origin)
    case 'FCA': case 'FOB': return port(q.origin)
    case 'CFR': case 'CIF': case 'CPT': case 'CIP': return port(q.destPort)
    default: return q.destPlace || port(q.destPort)
  }
}

function Warnings({ r, q, t }) {
  const text = (w) => {
    const name = w.line != null ? (q.lines[w.line]?.name || `#${w.line + 1}`) : ''
    return (t[`q_w_${w.code}`] || w.code).replace('{line}', name).replace('{n}', w.n).replace('{term}', w.term)
  }
  const info = r.warnings.filter((w) => w.code === 'fca_hint')
  const warn = r.warnings.filter((w) => w.code !== 'fca_hint')
  if (!warn.length && !info.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="status">
      {warn.map((w, i) => <div key={i} className="tl-callout tl-callout--warn"><strong aria-hidden="true">!</strong><span>{text(w)}</span></div>)}
      {info.map((w, i) => <div key={`i${i}`} className="tl-callout tl-callout--info"><span>{text(w)}</span></div>)}
    </div>
  )
}

function Ladder({ q, r, t, lang, set }) {
  const [basis, setBasis] = useState('order')
  const named = q.lines.map((l, i) => ({ value: String(i), label: l.name || `#${i + 1}` }))
  const value = (rung) => (basis === 'order' ? rung.total : rung.prices[Number(basis)] || 0)
  const max = Math.max(...r.ladder.map(value), 1e-9)
  const dp = basis === 'order' ? 0 : Math.max(2, Number(q.decimals) || 2)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="qd-ladder-h">
      <div className="tl-sec__h">
        <h2 id="qd-ladder-h" className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_ladder}</h2>
        {named.length > 0 && (
          <select className="tl-input tl-select" style={{ width: 'auto', maxWidth: 280, height: 38 }} value={basis} onChange={(e) => setBasis(e.target.value)} aria-label={t.q_ladder_basis}>
            <option value="order">{t.q_ladder_order}</option>
            {named.map((o) => <option key={o.value} value={o.value}>{t.q_ladder_unit.replace('{name}', o.label)}</option>)}
          </select>
        )}
      </div>
      <div className="qd-ladder">
        {r.ladder.map((rung) => (
          <button
            key={rung.term}
            type="button"
            className="qd-rung"
            aria-pressed={rung.term === r.quoteTerm}
            aria-label={`${rung.term} ${placeFor(q, rung.term)}: ${money(value(rung), q.currency, lang, dp)}`}
            onClick={() => set({ term: rung.term })}
          >
            <span className="qd-rung__p">{money(value(rung), q.currency, lang, dp)}</span>
            <span className="qd-rung__a">{(ADDS[rung.term] || []).map((k) => t[k]).join(' ')}</span>
            <span className="qd-rung__bar" style={{ height: `${Math.max(6, (value(rung) / max) * 190)}px` }} />
            <span className="qd-term qd-rung__t">{rung.term}</span>
          </button>
        ))}
      </div>
      <div className="qd-ladder qd-ladder__terms qd-ladder__base" style={{ paddingTop: 8 }}>
        {r.ladder.map((rung) => (
          <div key={rung.term} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span className="qd-term">{rung.term}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', overflowWrap: 'anywhere' }}>{placeFor(q, rung.term) || '—'}</span>
          </div>
        ))}
      </div>
      <p className="tl-hint">{t.q_ladder_hint}</p>
    </section>
  )
}

function Breakdown({ q, r, t, lang }) {
  const [li, setLi] = useState(0)
  const i = Math.min(li, r.lines.length - 1)
  const line = r.lines[i]
  if (!line) return null
  const fx = r.fxQuote
  const groups = PART_GROUPS.map((g) => ({ ...g, v: g.keys.reduce((s, k) => s + (line.parts[k] || 0), 0) })).filter((g) => g.v > 1e-9)
  const profit = Math.max(0, line.profit)
  const total = groups.reduce((s, g) => s + g.v, 0) + profit
  const dp = Math.max(2, Number(q.decimals) || 2)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="qd-bd-h">
      <div className="tl-sec__h">
        <h2 id="qd-bd-h" className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_breakdown}</h2>
        {r.lines.length > 1 && (
          <select className="tl-input tl-select" style={{ width: 'auto', maxWidth: 280, height: 38 }} value={i} onChange={(e) => setLi(Number(e.target.value))} aria-label={t.q_line_name}>
            {q.lines.map((l, j) => <option key={l.id} value={j}>{l.name || `#${j + 1}`}</option>)}
          </select>
        )}
      </div>
      <div className="qd-stack" role="img" aria-label={t.q_breakdown}>
        {groups.map((g) => <span key={g.id} style={{ width: `${(g.v / total) * 100}%`, background: g.color }} />)}
        {profit > 0 && <span style={{ width: `${(profit / total) * 100}%`, background: 'var(--green)' }} />}
      </div>
      <div className="qd-legend">
        {groups.map((g) => (
          <span key={g.id}>
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><i style={{ background: g.color }} />{t[`q_part_${g.id}`]}</span>
            <span className="tl-num">{money(g.v / fx, q.currency, lang, dp)}</span>
          </span>
        ))}
        <span>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><i style={{ background: 'var(--green)' }} />{t.q_part_profit}</span>
          <strong className="tl-num" style={{ color: line.profit < 0 ? 'var(--danger)' : undefined }}>{money(line.profit / fx, q.currency, lang, dp)}</strong>
        </span>
      </div>
      <p className="tl-hint">{t.q_breakdown_hint.replace('{term}', r.quoteTerm).replace('{price}', money(line.price, q.currency, lang, dp))}</p>
    </section>
  )
}

function LoadPlan({ q, r, t, lang, set }) {
  const [bi, setBi] = useState(0)
  const plan = r.plan
  const fill = useMemo(() => fillSuggestion(q, r), [q, r])
  if (!r.plans.length) {
    return (
      <section className="tl-sec">
        <h2 className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_load}</h2>
        <div className="tl-callout tl-callout--info">{t.q_load_empty}</div>
      </section>
    )
  }
  const boxes = plan?.boxes || []
  const box = boxes[Math.min(bi, boxes.length - 1)]
  const label = (p) => p.parts.map((x) => (x.mode === 'LCL' ? t.q_mode_lcl.replace('{n}', number(x.units, lang, 2)) : x.mode === 'AIR' ? t.q_mode_air.replace('{n}', number(x.units, lang)) : `${x.units} × ${x.mode}`)).join(' + ')
  const units = r.lines.reduce((s, l) => s + l.qty, 0) || 1
  const perUnit = (p) => p.toPort / units / r.fxQuote
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="qd-load-h">
      <div className="tl-sec__h">
        <h2 id="qd-load-h" className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_load}</h2>
        <span className="tl-label">{plan ? label(plan) : ''}</span>
      </div>
      <div className="qd-load">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {box ? (
            <>
              {boxes.length > 1 && (
                <div className="tl-tabs" role="tablist" aria-label={t.q_load}>
                  {boxes.map((b, k) => (
                    <button key={k} role="tab" type="button" aria-selected={k === bi} onClick={() => setBi(k)}>{`${k + 1} · ${b.type}`}</button>
                  ))}
                </div>
              )}
              <LoadView box={box} lines={q.lines} title={t.q_load_view.replace('{type}', box.type).replace('{n}', number(box.cartons, lang))} />
              <div className="qd-meters">
                <Meter label={t.q_volume} v={box.volumeFill} text={`${number(box.cbm, lang, 1)} / ${number(box.capacityCbm, lang, 1)} m³`} lang={lang} />
                <Meter label={t.q_weight} v={box.weightFill} text={`${number(box.kg / 1000, lang, 1)} / ${number(box.payload / 1000, lang, 1)} t`} lang={lang} />
                <Meter label={t.q_length} v={box.lengthFill} text={`${number(box.usedL / 1000, lang, 2)} / ${number(usableLength(box.type) / 1000, lang, 2)} m`} lang={lang} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 14 }}>
                {box.blocks.map((b, k) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <i style={{ width: 12, height: 12, background: lineColor(b.index), display: 'inline-block' }} aria-hidden="true" />
                    {(q.lines[b.index]?.name || `#${b.index + 1}`)} · {t.q_ctns.replace('{n}', number(b.cartons, lang))} · {b.wall.perWall}/{t.q_wall}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="tl-callout tl-callout--info">{plan?.air ? t.q_load_air : t.q_load_lcl}</div>
          )}
          {fill && (
            <div className="tl-callout tl-callout--go" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="nx-display" style={{ fontSize: 30 }}>+{number(fill.cartons, lang)}</span>
              <span style={{ flex: '1 1 260px' }}>
                {t.q_fill
                  .replace('{name}', q.lines[fill.index]?.name || `#${fill.index + 1}`)
                  .replace('{qty}', number(fill.newQty, lang))
                  .replace('{drop}', percent(fill.freightDrop, lang))
                  .replace('{value}', money(fill.value, q.currency, lang, 0))}
              </span>
              <button type="button" className="tl-btn tl-btn--ink" onClick={() => set({ lines: q.lines.map((l, k) => (k === fill.index ? { ...l, qty: String(fill.newQty) } : l)) })}>{t.q_fill_apply}</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <h3 className="nx-display" style={{ fontSize: 24, fontStretch: '90%' }}>{t.q_modes}</h3>
          <div className="tl-scroll">
            <table className="tl-table">
              <thead>
                <tr><th>{t.q_mode}</th><th className="r">{t.q_fill_col}</th><th className="r">{t.q_to_port_unit}</th></tr>
              </thead>
              <tbody>
                {r.plans.map((p) => {
                  const last = p.boxes[p.boxes.length - 1]
                  return (
                    <tr key={p.id} aria-selected={p.id === plan?.id}>
                      <td>
                        <button type="button" className="tl-row" onClick={() => { setBi(0); set({ planId: p.id }) }}>{label(p)}</button>
                        {p.id === r.plans[0].id && <span className="tl-pill tl-pill--green" style={{ marginLeft: 8 }}>{t.q_cheapest}</span>}
                      </td>
                      <td className="r tl-num">{last ? percent(last.volumeFill, lang, 0) : '—'}</td>
                      <td className="r tl-num">{money(perUnit(p), q.currency, lang, 3)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {q.planId && (
            <button type="button" className="tl-btn tl-btn--quiet" style={{ alignSelf: 'flex-start' }} onClick={() => set({ planId: '' })}>{t.q_plan_auto}</button>
          )}
          <p className="tl-hint">{t.q_modes_hint}</p>
        </div>
      </div>
    </section>
  )
}

function Meter({ label, v, text, lang }) {
  const over = v > 1.0001
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="tl-label">{label} · {percent(v, lang, 0)}</span>
      <div className="tl-bar"><span style={{ width: `${Math.min(100, v * 100)}%`, background: over ? 'var(--danger)' : 'var(--ink)' }} /></div>
      <span className="tl-num" style={{ fontWeight: 700, fontSize: 15 }}>{text}</span>
    </div>
  )
}

function Money({ q, r, t, lang }) {
  const be = useMemo(() => breakEvenRate(q, r), [q, r])
  const headroom = be ? 1 - be / r.fxQuote : null
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="qd-money-h">
      <h2 id="qd-money-h" className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_money}</h2>
      <div className="qd-headline">
        <div>
          <span className="tl-label">{t.q_breakeven}</span>
          <span className="qd-big">{be ? number(be, lang, 4) : '—'}</span>
          <span className="tl-note">{headroom != null ? t.q_breakeven_is.replace('{pct}', percent(headroom, lang)).replace('{cur}', q.currency) : t.q_breakeven_none}</span>
        </div>
        <div>
          <span className="tl-label">{q.entity === 'trader' ? t.q_rebate_trader : t.q_rebate_mfr}</span>
          <span className="qd-big">{yuan(r.rebate, lang)}</span>
          <span className="tl-note">{t.q_rebate_is.replace('{v}', yuan(r.nonCreditable, lang))}</span>
        </div>
        <div>
          <span className="tl-label">{t.q_finance}</span>
          <span className="qd-big">{yuan(r.financingCny, lang)}</span>
          <span className="tl-note">{t[`q_pay_${q.payment}`]}</span>
        </div>
      </div>
    </section>
  )
}

function Sensitivity({ q, r, t, lang }) {
  const grid = useMemo(() => sensitivity(q, r), [q, r])
  const floor = (parseFloat(q.marginFloor) || 0) / 100
  const target = (parseFloat(q.margin) || 0) / 100
  const cell = (m) => {
    if (m < 0) return { background: 'var(--danger)', color: '#fff' }
    if (m < floor) return { background: 'var(--rust-tint)', color: 'var(--danger)' }
    if (m < target - 0.0005) return { background: 'var(--paper-deep)', color: 'var(--ink)' }
    return { background: 'var(--green)', color: '#fff' }
  }
  const freightMatters = new Set(['CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DDP']).has(r.quoteTerm)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="qd-sens-h">
      <div className="tl-sec__h">
        <h2 id="qd-sens-h" className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_sens}</h2>
        <span className="tl-label">{t.q_sens_label}</span>
      </div>
      <div className="tl-scroll">
        <div className="qd-heat" role="table" aria-label={t.q_sens}>
          <span className="qd-heat__h" role="columnheader">{t.q_sens_corner}</span>
          {grid[0].cells.map((c) => (
            <span key={c.fx} className="qd-heat__h" role="columnheader">{number(r.fxQuote * (1 + c.fx / 100), lang, r.fxQuote < 1 ? 4 : 2)}</span>
          ))}
          {grid.map((row) => (
            <div key={row.freight} role="row" style={{ display: 'contents' }}>
              <span className="qd-heat__r" role="rowheader">{row.freight === 0 ? t.q_sens_today : `${row.freight > 0 ? '+' : ''}${row.freight}%`}</span>
              {row.cells.map((c) => (
                <span key={c.fx} role="cell" style={{ ...cell(c.margin), outline: row.freight === 0 && c.fx === 0 ? '3px solid var(--ink)' : undefined, outlineOffset: -3 }}>
                  {percent(c.margin, lang)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="tl-hint">{freightMatters ? t.q_sens_hint : t.q_sens_hint_fob.replace('{term}', r.quoteTerm)}</p>
    </section>
  )
}

function Breaks({ q, r, t, lang }) {
  const breaks = useMemo(() => containerBreaks(q), [q])
  if (!breaks.length) return null
  const qtyNow = r.lines.reduce((s, l) => s + l.qty, 0)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="qd-breaks-h">
      <div className="tl-sec__h">
        <h2 id="qd-breaks-h" className="nx-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontStretch: '90%' }}>{t.q_breaks}</h2>
        <span className="tl-label">{r.quoteTerm}</span>
      </div>
      <div className="tl-scroll">
        <table className="tl-table">
          <thead>
            <tr>
              <th>{t.q_breaks_load}</th>
              {q.lines.map((l, i) => (r.lines[i]?.qty ? <th key={l.id} className="r">{l.name || `#${i + 1}`}</th> : null))}
              <th className="r">{t.q_breaks_total}</th>
            </tr>
          </thead>
          <tbody>
            <tr aria-selected="true">
              <td><strong>{t.q_breaks_now}</strong><div className="tr-meta">{number(qtyNow, lang)} pcs</div></td>
              {r.lines.map((l, i) => (l.qty ? <td key={i} className="r tl-num">{money(l.price, q.currency, lang, Number(q.decimals) || 2)}</td> : null))}
              <td className="r tl-num">{money(r.total, q.currency, lang, 0)}</td>
            </tr>
            {breaks.map((b) => (
              <tr key={b.type}>
                <td><strong>{t.q_breaks_full.replace('{type}', b.type)}</strong><div className="tr-meta">{number(b.lines.reduce((s, l) => s + l.qty, 0), lang)} pcs · {percent(b.fill, lang, 0)}</div></td>
                {b.lines.map((l, i) => <td key={i} className="r tl-num">{money(l.price, q.currency, lang, Number(q.decimals) || 2)}</td>)}
                <td className="r tl-num">{money(b.total, q.currency, lang, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tl-hint">{t.q_breaks_hint}</p>
    </section>
  )
}

export default function Results({ q, r, t, lang, set }) {
  const hasLines = r.lines.some((l) => l.qty > 0)
  return (
    <div className="qd-main">
      <Headline q={q} r={r} t={t} lang={lang} set={set} />
      <Warnings q={q} r={r} t={t} />
      {hasLines && <Ladder q={q} r={r} t={t} lang={lang} set={set} />}
      {hasLines && <Breakdown q={q} r={r} t={t} lang={lang} />}
      <LoadPlan q={q} r={r} t={t} lang={lang} set={set} />
      {hasLines && <Money q={q} r={r} t={t} lang={lang} />}
      {hasLines && <Sensitivity q={q} r={r} t={t} lang={lang} />}
      {hasLines && <Breaks q={q} r={r} t={t} lang={lang} />}
    </div>
  )
}
