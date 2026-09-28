import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Check, Field, NumInput, Segmented, Select, TextInput } from '../shared/ui.jsx'
import { countryName } from '../shared/countries.js'
import { parseCsv } from '../shared/csv.js'
import { fetchRates } from '../shared/fx.js'
import { date } from '../shared/format.js'
import { CURRENCIES, DESTINATIONS, ORIGIN_PORTS, PAYMENT_TERMS, destination } from './presets.js'
import { blankLine } from './engine.js'
import { lineColor } from './LoadView.jsx'

const MODES = ['LCL', '20GP', '40GP', '40HQ', 'AIR']
const RATE_ROWS = ['freight', 'origin', 'haulage', 'dest', 'delivery']

function Section({ n, title, aside, children }) {
  return (
    <section className="tl-sec">
      <div className="tl-sec__h">
        <h2 className="nx-display">{n} {title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function LineCard({ line, i, count, t, set, remove, duplicate, solved, currency }) {
  const [open, setOpen] = useState(!line.name)
  return (
    <div className="tl-card qd-line">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="qd-line__sw" style={{ background: lineColor(i) }} aria-hidden="true" />
        <TextInput value={line.name} onChange={(v) => set({ name: v })} placeholder={t.q_line_name_ph} aria-label={t.q_line_name} />
      </div>
      <div className="tl-grid3">
        <Field label={t.q_unit_cost}>
          <NumInput value={line.unitCost} onChange={(v) => set({ unitCost: v })} suffix="¥" placeholder="0.00" />
        </Field>
        <Field label={t.q_qty}>
          <NumInput value={line.qty} onChange={(v) => set({ qty: v })} placeholder="0" />
        </Field>
        <Field label={t.q_price_override}>
          <NumInput value={line.price} onChange={(v) => set({ price: v })} placeholder={solved || t.q_auto} suffix={currency} title={solved ? t.q_price_auto.replace('{p}', solved) : undefined} />
        </Field>
      </div>
      <Check checked={line.costIncludesVat !== false} onChange={(v) => set({ costIncludesVat: v })}>{t.q_cost_incl_vat}</Check>
      <button type="button" className="tl-btn tl-btn--quiet" style={{ alignSelf: 'flex-start', padding: 0, minHeight: 32 }} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? t.q_line_less : t.q_line_more}
      </button>
      {open && (
        <>
          <div className="tl-grid2">
            <Field label={t.q_spec}><TextInput value={line.spec} onChange={(v) => set({ spec: v })} placeholder={t.q_spec_ph} /></Field>
            <Field label={t.q_hs}><TextInput value={line.hs} onChange={(v) => set({ hs: v })} placeholder="8481.80" inputMode="decimal" /></Field>
          </div>
          <span className="tl-label">{t.q_packing}</span>
          <div className="tl-grid4">
            <Field label={t.q_per_carton}><NumInput value={line.perCarton} onChange={(v) => set({ perCarton: v })} /></Field>
            <Field label="L"><NumInput value={line.cartonL} onChange={(v) => set({ cartonL: v })} suffix="cm" /></Field>
            <Field label="W"><NumInput value={line.cartonW} onChange={(v) => set({ cartonW: v })} suffix="cm" /></Field>
            <Field label="H"><NumInput value={line.cartonH} onChange={(v) => set({ cartonH: v })} suffix="cm" /></Field>
          </div>
          <div className="tl-grid2">
            <Field label={t.q_carton_kg}><NumInput value={line.cartonKg} onChange={(v) => set({ cartonKg: v })} suffix="kg" /></Field>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Check checked={line.upright} onChange={(v) => set({ upright: v })}>{t.q_upright}</Check>
            </div>
          </div>
          <div className="tl-grid2">
            <Field label={t.q_rebate} hint={t.q_rebate_hint}><NumInput value={line.rebateRate} onChange={(v) => set({ rebateRate: v })} suffix="%" /></Field>
            <Field label={t.q_duty} hint={t.q_duty_hint}><NumInput value={line.dutyRate} onChange={(v) => set({ dutyRate: v })} suffix="%" /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="tl-btn" onClick={duplicate}>{t.q_line_dup}</button>
            {count > 1 && <button type="button" className="tl-btn tl-btn--danger" onClick={remove}>{t.q_line_remove}</button>}
          </div>
        </>
      )}
    </div>
  )
}

// Paste rows straight from a spreadsheet: name, qty, unit cost, pcs/carton,
// L, W, H (cm), kg/carton, HS code. Missing columns stay blank.
function PasteLines({ t, onAdd }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const add = () => {
    const rows = parseCsv(text).filter((r) => !/^(name|product|品名|产品|產品)$/i.test((r[0] || '').trim()))
    const lines = rows.map((r) => {
      const c = (k) => (r[k] || '').trim()
      return { ...blankLine(), name: c(0), qty: c(1), unitCost: c(2), perCarton: c(3), cartonL: c(4), cartonW: c(5), cartonH: c(6), cartonKg: c(7), hs: c(8) }
    }).filter((l) => l.name)
    if (!lines.length) { toast.error(t.q_paste_none); return }
    onAdd(lines)
    toast.success(t.q_paste_done.replace('{n}', lines.length))
    setText('')
    setOpen(false)
  }
  if (!open) return <button type="button" className="tl-btn" onClick={() => setOpen(true)}>{t.q_paste}</button>
  return (
    <div className="tl-card">
      <Field label={t.q_paste} hint={t.q_paste_hint}>
        <textarea className="tl-input tl-num" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Ball valve DN25\t12000\t38.5\t50\t48\t36\t30\t24.5\t8481.80'} />
      </Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="tl-btn tl-btn--ink" onClick={add}>{t.q_paste_add}</button>
        <button type="button" className="tl-btn tl-btn--quiet" onClick={() => setOpen(false)}>{t.tl_cancel}</button>
      </div>
    </div>
  )
}

export default function Manifest({ q, set, t, lang, result, profile, setProfile }) {
  const [fxBusy, setFxBusy] = useState(false)
  const setLine = (i, patch) => set({ lines: q.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const dest = destination(q.destCountry)
  const term = PAYMENT_TERMS[q.payment] || PAYMENT_TERMS.TT_30_70_BL
  const days = q.paymentDays?.length === term.tranches.length ? q.paymentDays : term.tranches.map(([, d]) => d)
  const unit = { LCL: t.q_per_wm, '20GP': t.q_per_box, '40GP': t.q_per_box, '40HQ': t.q_per_box, AIR: t.q_per_kg }

  const pickDest = (code) => {
    const d = destination(code)
    set({ destCountry: code, destPort: d.ports[0] || '', valuation: d.valuation, importVat: d.vat, importFees: d.fees || 0 })
  }

  const getRates = async () => {
    setFxBusy(true)
    try {
      const { date: day, rates } = await fetchRates()
      set({ fx: { ...q.fx, ...rates }, fxAsOf: day })
      toast.success(t.q_fx_done.replace('{date}', date(day, lang)))
    } catch {
      toast.error(t.q_fx_failed)
    } finally {
      setFxBusy(false)
    }
  }

  return (
    <aside className="qd-aside" aria-label={t.q_inputs}>
      <Section n="01" title={t.q_s_parties}>
        <div className="tl-grid2">
          <Field label={t.q_buyer} wide><TextInput value={q.buyer.company} onChange={(v) => set({ buyer: { ...q.buyer, company: v } })} placeholder={t.q_buyer_ph} /></Field>
          <Field label={t.q_contact}><TextInput value={q.buyer.contact} onChange={(v) => set({ buyer: { ...q.buyer, contact: v } })} /></Field>
          <Field label={t.q_city}><TextInput value={q.buyer.city} onChange={(v) => set({ buyer: { ...q.buyer, city: v } })} /></Field>
        </div>
        <details>
          <summary className="tl-label" style={{ cursor: 'pointer', minHeight: 32, display: 'flex', alignItems: 'center' }}>{t.q_you}</summary>
          <div className="tl-grid2" style={{ marginTop: 10 }}>
            <Field label={t.q_you_company} wide><TextInput value={profile.company} onChange={(v) => setProfile({ company: v })} /></Field>
            <Field label={t.q_you_address} wide><TextInput value={profile.address} onChange={(v) => setProfile({ address: v })} /></Field>
            <Field label={t.q_you_name}><TextInput value={profile.name} onChange={(v) => setProfile({ name: v })} /></Field>
            <Field label={t.q_you_email}><TextInput type="email" value={profile.email} onChange={(v) => setProfile({ email: v })} /></Field>
            <Field label={t.q_you_phone} wide><TextInput type="tel" value={profile.phone} onChange={(v) => setProfile({ phone: v })} /></Field>
          </div>
          <p className="tl-hint" style={{ marginTop: 8 }}>{t.q_you_hint}</p>
        </details>
      </Section>

      <Section n="02" title={t.q_s_lines} aside={<span className="tl-label">{t.q_lines_n.replace('{n}', q.lines.length)}</span>}>
        {q.lines.map((line, i) => (
          <LineCard
            key={line.id}
            line={line}
            i={i}
            count={q.lines.length}
            t={t}
            currency={q.currency}
            solved={result?.lines[i] && !(parseFloat(line.price) > 0) ? String(result.lines[i].price) : ''}
            set={(patch) => setLine(i, patch)}
            remove={() => set({ lines: q.lines.filter((_, j) => j !== i) })}
            duplicate={() => set({ lines: [...q.lines.slice(0, i + 1), { ...line, id: blankLine().id, name: `${line.name} (2)` }, ...q.lines.slice(i + 1)] })}
          />
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="tl-btn tl-btn--ink" onClick={() => set({ lines: [...q.lines, blankLine()] })}>{t.q_line_add}</button>
          <PasteLines t={t} onAdd={(lines) => set({ lines: [...q.lines.filter((l) => l.name || l.qty || l.unitCost), ...lines] })} />
        </div>
      </Section>

      <Section n="03" title={t.q_s_route}>
        <div className="tl-grid2">
          <Field label={t.q_origin}>
            <input className="tl-input" list="qd-origins" value={q.origin} onChange={(e) => set({ origin: e.target.value })} />
            <datalist id="qd-origins">{ORIGIN_PORTS.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
          <Field label={t.q_origin_place}><TextInput value={q.originPlace} onChange={(v) => set({ originPlace: v })} placeholder={t.q_origin_place_ph} /></Field>
          <Field label={t.q_dest_country}>
            <Select
              value={q.destCountry}
              onChange={pickDest}
              options={DESTINATIONS.map((d) => ({ value: d.code, label: d.code === 'OTHER' ? t.q_dest_other : countryName(d.code, lang) }))}
            />
          </Field>
          <Field label={t.q_dest_port}>
            <input className="tl-input" list="qd-dests" value={q.destPort} onChange={(e) => set({ destPort: e.target.value })} />
            <datalist id="qd-dests">{dest.ports.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
          <Field label={t.q_dest_place} wide><TextInput value={q.destPlace} onChange={(v) => set({ destPlace: v })} placeholder={t.q_dest_place_ph} /></Field>
        </div>

        <span className="tl-label">{t.q_rates}</span>
        <div className="tl-scroll">
          <div className="qd-rates" role="table" aria-label={t.q_rates}>
            <span role="columnheader" />
            {MODES.map((m) => <span key={m} role="columnheader" className="tl-label" style={{ textAlign: 'right' }}>{m === 'AIR' ? t.q_air : m}</span>)}
            {RATE_ROWS.map((row) => (
              <div key={row} role="row" style={{ display: 'contents' }}>
                <span role="rowheader">{t[`q_rate_${row}`]}</span>
                {MODES.map((m) => (
                  <input
                    key={m}
                    role="cell"
                    className="tl-input tl-num"
                    inputMode="decimal"
                    aria-label={`${t[`q_rate_${row}`]} · ${m}`}
                    value={q.rates[m]?.[row] ?? ''}
                    onChange={(e) => set({ rates: { ...q.rates, [m]: { ...q.rates[m], [row]: e.target.value.replace(/[^\d.,]/g, '') } } })}
                  />
                ))}
              </div>
            ))}
            <span className="tl-hint">{t.q_rate_unit}</span>
            {MODES.map((m) => <span key={m} className="tl-hint" style={{ textAlign: 'right', fontSize: 12 }}>{unit[m]}</span>)}
          </div>
        </div>
        <p className="tl-hint">{t.q_rates_hint}</p>
        <div className="tl-grid3">
          <Field label={t.q_export_docs}><NumInput value={q.exportDocs} onChange={(v) => set({ exportDocs: v })} suffix="¥" /></Field>
          <Field label={t.q_import_broker}><NumInput value={q.importBroker} onChange={(v) => set({ importBroker: v })} suffix="$" /></Field>
          <Field label={t.q_payload}><NumInput value={q.payloadLimit} onChange={(v) => set({ payloadLimit: v })} suffix="kg" placeholder={t.q_auto} /></Field>
        </div>
      </Section>

      <Section n="04" title={t.q_s_money}>
        <div className="tl-grid2">
          <Field label={t.q_currency}>
            <Select value={q.currency} onChange={(v) => set({ currency: v })} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label={t.q_fx.replace('{cur}', 'USD')}>
            <NumInput value={q.fx.USD} onChange={(v) => set({ fx: { ...q.fx, USD: v } })} suffix="¥" />
          </Field>
          {q.currency !== 'USD' && (
            <Field label={t.q_fx.replace('{cur}', q.currency)}>
              <NumInput value={q.fx[q.currency]} onChange={(v) => set({ fx: { ...q.fx, [q.currency]: v } })} suffix="¥" />
            </Field>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="tl-btn" onClick={getRates} disabled={fxBusy}>{fxBusy ? t.q_fx_loading : t.q_fx_fetch}</button>
          <span className="tl-hint">{q.fxAsOf ? t.q_fx_asof.replace('{date}', date(q.fxAsOf, lang)) : t.q_fx_hint}</span>
        </div>
        <Field label={t.q_payment}>
          <Select value={q.payment} onChange={(v) => set({ payment: v, paymentDays: null, bankPct: '', bankFlat: '' })} options={Object.keys(PAYMENT_TERMS).map((k) => ({ value: k, label: t[`q_pay_${k}`] }))} />
        </Field>
        <div className="tl-grid2">
          {term.tranches.map(([share], i) => (
            <Field key={i} label={t.q_tranche.replace('{pct}', Math.round(share * 100))} hint={i === 0 ? t.q_tranche_hint : undefined}>
              <NumInput value={days[i]} onChange={(v) => { const next = [...days]; next[i] = v; set({ paymentDays: next }) }} suffix={t.q_days_short} />
            </Field>
          ))}
        </div>
        <div className="tl-grid2">
          <Field label={t.q_capital}><NumInput value={q.capitalRate} onChange={(v) => set({ capitalRate: v })} suffix="%" /></Field>
          <Field label={t.q_bank_pct}><NumInput value={q.bankPct} onChange={(v) => set({ bankPct: v })} suffix="%" placeholder={String(term.bankPct)} /></Field>
          <Field label={t.q_bank_flat}><NumInput value={q.bankFlat} onChange={(v) => set({ bankFlat: v })} suffix="$" placeholder={String(term.bankFlat)} /></Field>
          <Field label={t.q_sinosure}><NumInput value={q.sinosure} onChange={(v) => set({ sinosure: v })} suffix="%" /></Field>
          <Field label={t.q_commission}><NumInput value={q.commission} onChange={(v) => set({ commission: v })} suffix="%" /></Field>
          <Field label={t.q_insurance} hint={t.q_insurance_hint.replace('{m}', q.insuranceMarkup)}><NumInput value={q.insuranceRate} onChange={(v) => set({ insuranceRate: v })} suffix="%" /></Field>
        </div>
      </Section>

      <Section n="05" title={t.q_s_margin}>
        <Segmented
          label={t.q_entity}
          value={q.entity}
          onChange={(v) => set({ entity: v })}
          options={[{ value: 'manufacturer', label: t.q_entity_mfr }, { value: 'trader', label: t.q_entity_trader }]}
        />
        <p className="tl-hint">{q.entity === 'trader' ? t.q_entity_trader_hint : t.q_entity_mfr_hint}</p>
        <div className="tl-grid2">
          <Field label={t.q_margin}><NumInput value={q.margin} onChange={(v) => set({ margin: v })} suffix="%" /></Field>
          <Field label={t.q_margin_basis}>
            <Select value={q.marginBasis} onChange={(v) => set({ marginBasis: v })} options={[{ value: 'price', label: t.q_basis_price }, { value: 'cost', label: t.q_basis_cost }]} />
          </Field>
          <Field label={t.q_overhead} hint={t.q_overhead_hint}><NumInput value={q.overhead} onChange={(v) => set({ overhead: v })} suffix="%" /></Field>
          <Field label={t.q_floor}><NumInput value={q.marginFloor} onChange={(v) => set({ marginFloor: v })} suffix="%" /></Field>
          <Field label={t.q_vat}><NumInput value={q.vatRate} onChange={(v) => set({ vatRate: v })} suffix="%" /></Field>
          <Field label={t.q_decimals}>
            <Select value={String(q.decimals)} onChange={(v) => set({ decimals: Number(v) })} options={[0, 1, 2, 3, 4].map((d) => ({ value: String(d), label: d === 0 ? '1' : `0.${'0'.repeat(d - 1)}1` }))} />
          </Field>
          <Field label={t.q_valid}><NumInput value={q.validDays} onChange={(v) => set({ validDays: v })} suffix={t.q_days_short} /></Field>
          <Field label={t.q_lead}><NumInput value={q.leadDays} onChange={(v) => set({ leadDays: v })} suffix={t.q_days_short} /></Field>
        </div>
        <span className="tl-label">{t.q_dest_tax}</span>
        <div className="tl-grid2">
          <Field label={t.q_valuation}>
            <Select value={q.valuation} onChange={(v) => set({ valuation: v })} options={[{ value: 'CIF', label: t.q_valuation_cif }, { value: 'FOB', label: t.q_valuation_fob }]} />
          </Field>
          <Field label={t.q_import_vat}><NumInput value={q.importVat} onChange={(v) => set({ importVat: v })} suffix="%" /></Field>
          <Field label={t.q_import_fees} hint={q.destCountry === 'US' ? t.q_import_fees_us : undefined}><NumInput value={q.importFees} onChange={(v) => set({ importFees: v })} suffix="%" /></Field>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Check checked={q.vatRecoverable} onChange={(v) => set({ vatRecoverable: v })}>{t.q_vat_recoverable}</Check>
          </div>
        </div>
        <Field label={t.q_notes} hint={t.q_notes_hint}>
          <textarea className="tl-input" rows={3} value={q.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
        {result && (
          <fieldset style={{ border: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <legend className="tl-label" style={{ marginBottom: 4 }}>{t.q_sheet_terms}</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 18px' }}>
              {result.terms.filter((x) => x !== result.quoteTerm).map((x) => (
                <Check
                  key={x}
                  checked={(q.sheetTerms || []).includes(x)}
                  onChange={(v) => set({ sheetTerms: v ? [...(q.sheetTerms || []), x] : (q.sheetTerms || []).filter((y) => y !== x) })}
                >
                  {x}
                </Check>
              ))}
            </div>
          </fieldset>
        )}
      </Section>
    </aside>
  )
}
