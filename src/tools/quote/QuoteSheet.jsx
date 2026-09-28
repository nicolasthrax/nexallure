import { number } from '../shared/format.js'
import { countryName } from '../shared/countries.js'
import { placeFor } from './Results.jsx'
import { cartonCount } from './packing.js'

// The buyer-facing quotation. It is always English, the working language of
// export sales, whatever language the desk is using, so its text is written
// here rather than in the translation file. Shown only when printing.

const PAYMENT_EN = {
  TT_ADVANCE: 'T/T 100% in advance',
  TT_30_70_BL: 'T/T 30% deposit, 70% against copy of B/L',
  TT_30_70_BEFORE: 'T/T 30% deposit, 70% before shipment',
  LC_SIGHT: 'Irrevocable L/C at sight',
  LC_60: 'Irrevocable L/C 60 days after B/L date',
  DP_SIGHT: 'D/P at sight',
  OA_30: 'Open account, 30 days after B/L date',
  OA_60: 'Open account, 60 days after B/L date',
}

const en = (v, dp = 2) => (Number.isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) : '—')
const day = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function QuoteSheet({ q, r, profile }) {
  const issued = new Date(q.issuedAt || Date.now())
  const valid = new Date(issued.getTime() + (parseInt(q.validDays, 10) || 0) * 86400000)
  const dp = Math.max(2, Number(q.decimals) || 2)
  const term = `${r.quoteTerm} ${placeFor(q, r.quoteTerm)}`.trim()
  const alternatives = r.ladder.filter((x) => (q.sheetTerms || []).includes(x.term) && x.term !== r.quoteTerm)
  const containers = r.plan?.parts.filter((p) => p.mode !== 'LCL' && p.mode !== 'AIR').map((p) => `${p.units} × ${p.mode.replace('GP', '′ GP').replace('HQ', '′ HC')}`).join(' + ')

  return (
    <div className="qs-sheet" lang="en" aria-hidden="true">
      <div className="qs-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <strong style={{ fontSize: '14pt' }}>{profile.company || '[Your company]'}</strong>
          {profile.address && <span>{profile.address}</span>}
          <span>{[profile.email, profile.phone].filter(Boolean).join(' · ')}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1>Quotation</h1>
          <span className="tl-num">{q.number} · Rev {q.rev}</span>
        </div>
      </div>

      <div className="qs-cols">
        <div>
          <span className="qs-l">To</span>
          <strong>{q.buyer.company || '—'}</strong>
          {q.buyer.contact && <div>Attn: {q.buyer.contact}</div>}
          <div>{[q.buyer.city, countryName(q.destCountry === 'OTHER' ? '' : q.destCountry, 'EN')].filter(Boolean).join(', ')}</div>
        </div>
        <div>
          <span className="qs-l">Terms</span>
          <strong>{term}, Incoterms® 2020</strong>
          <div>{PAYMENT_EN[q.payment]}</div>
        </div>
        <div>
          <span className="qs-l">Dates</span>
          <div>Issued {day(issued)}</div>
          <div>Valid until {day(valid)}</div>
          {q.leadDays ? <div>Lead time {q.leadDays} days after order confirmation</div> : null}
        </div>
      </div>

      <table className="qs-t">
        <thead>
          <tr>
            <th>#</th><th>Description</th><th className="r">Qty</th><th className="r">Packing</th>
            <th className="r">Unit {q.currency}</th><th className="r">Amount {q.currency}</th>
          </tr>
        </thead>
        <tbody>
          {q.lines.map((l, i) => {
            const lr = r.lines[i]
            if (!lr || !lr.qty) return null
            return (
              <tr key={l.id}>
                <td>{i + 1}</td>
                <td><strong>{l.name}</strong>{(l.spec || l.hs) && <div style={{ color: '#444' }}>{[l.hs && `HS ${l.hs}`, l.spec].filter(Boolean).join(' · ')}</div>}</td>
                <td className="r">{en(lr.qty, 0)}</td>
                <td className="r">{cartonCount(l) ? `${en(cartonCount(l), 0)} ctns` : ''}</td>
                <td className="r">{en(lr.price, dp)}</td>
                <td className="r">{en(lr.amount)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8pt 0', borderBottom: '1.5pt solid #000' }}>
        <span>
          {en(r.shipment.cartons, 0)} cartons · {number(r.shipment.cbm, 'EN', 2)} m³ · {en(r.shipment.kg, 0)} kg gross
          {containers ? ` · ${containers}` : ''}
        </span>
        <span><span className="qs-l" style={{ display: 'inline', marginRight: 10 }}>Total {term}</span><strong style={{ fontSize: '15pt' }}>{q.currency} {en(r.total)}</strong></span>
      </div>

      <div className="qs-foot">
        <div>
          {alternatives.length > 0 && (
            <>
              <span className="qs-l">Other delivery terms on request</span>
              {alternatives.map((a) => (
                <div key={a.term} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{a.term} {placeFor(q, a.term)}</span><span className="tl-num">{q.currency} {en(a.total)}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div>
          <span className="qs-l">Notes</span>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {q.notes || `Prices are ${r.quoteTerm === 'DDP' ? 'inclusive of' : 'exclusive of'} destination duties and taxes. Prices assume the quantities and packing shown; other quantities will be requoted.`}
          </div>
        </div>
      </div>

      <div className="qs-sign">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26pt' }}>
          <span className="qs-l">Authorised signature and company chop</span>
          <span style={{ width: 200, borderBottom: '0.75pt solid #000' }} />
        </div>
        <span className="qs-l">{profile.name}</span>
      </div>
    </div>
  )
}
