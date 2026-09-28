import { countryName } from '../shared/countries.js'
import { number, percent, yuan, money } from '../shared/format.js'
import { Empty } from '../shared/ui.jsx'

function HBar({ label, value, max, text, color = 'var(--ink)' }) {
  return (
    <div className="tr-hbar">
      <span style={{ overflowWrap: 'anywhere' }}>{label}</span>
      <div className="tl-bar" style={{ height: 14 }}><span style={{ width: `${max ? Math.max(1, (value / max) * 100) : 0}%`, background: color }} /></div>
      <span className="tl-num" style={{ textAlign: 'right', fontWeight: 700 }}>{text}</span>
    </div>
  )
}

// Cost-ranked root causes with a running total, the classic quality chart:
// fix the causes on the left first.
function Pareto({ rows, t, lang }) {
  const W = 560
  const H = 220
  const pad = { l: 8, r: 40, t: 12, b: 56 }
  const max = Math.max(...rows.map((r) => r.cost), 1)
  const bw = (W - pad.l - pad.r) / rows.length
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v)
  const line = rows.map((r, i) => `${pad.l + bw * i + bw / 2},${y(r.cumulative)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', border: '2px solid var(--ink)', background: 'var(--paper-light)' }} role="img" aria-label={t.tr_pareto}>
      <line x1={pad.l} x2={W - pad.r} y1={y(0.8)} y2={y(0.8)} stroke="var(--rule-strong)" strokeDasharray="4 4" />
      <text x={W - pad.r + 4} y={y(0.8) + 4} fontSize="12" fill="var(--ink-3)" fontFamily="var(--font-mono)">80%</text>
      {rows.map((r, i) => {
        const h = ((H - pad.t - pad.b) * r.cost) / max
        return (
          <g key={r.cause}>
            <rect x={pad.l + bw * i + 4} y={H - pad.b - h} width={Math.max(2, bw - 8)} height={h} fill={r.cumulative <= 0.8 || i === 0 ? 'var(--rust)' : 'var(--rule-strong)'} />
            <text x={pad.l + bw * i + bw / 2} y={H - pad.b + 18} fontSize="12" textAnchor="middle" fill="var(--ink)">{t[`tr_cause_${r.cause}`]}</text>
            <text x={pad.l + bw * i + bw / 2} y={H - pad.b + 36} fontSize="11" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--font-mono)">{yuan(r.cost, lang)}</text>
          </g>
        )
      })}
      <polyline points={line} fill="none" stroke="var(--ink)" strokeWidth="2" />
      {rows.map((r, i) => <circle key={r.cause} cx={pad.l + bw * i + bw / 2} cy={y(r.cumulative)} r="3.5" fill="var(--ink)" />)}
    </svg>
  )
}

export default function Insights({ stats, t, lang, fx, setFx, days, setDays }) {
  if (!stats.samples && !stats.cases) return <Empty title={t.tr_insights_empty} body={t.tr_insights_empty_body} />
  const funnelMax = stats.funnel[0]?.count || 1
  const dwellMax = Math.max(...stats.dwell.map((d) => d.days || 0), 1)
  const lostMax = Math.max(...Object.values(stats.lostReasons), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="tl-field" style={{ width: 200 }}>
          <span className="tl-label">{t.tr_period}</span>
          <select className="tl-input tl-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[90, 180, 365, 730].map((d) => <option key={d} value={d}>{t.tr_period_days.replace('{n}', d)}</option>)}
          </select>
        </label>
        <label className="tl-field" style={{ width: 200 }}>
          <span className="tl-label">{t.tr_fx_setting}</span>
          <input className="tl-input tl-num" inputMode="decimal" value={fx} onChange={(e) => setFx(e.target.value.replace(/[^\d.]/g, ''))} />
        </label>
      </div>

      <div className="tr-insights">
        <section className="tl-sec">
          <h3 className="nx-display">{t.tr_funnel}</h3>
          {stats.funnel.map((f) => (
            <HBar key={f.id} label={t[`tr_funnel_${f.id}`]} value={f.count} max={funnelMax} text={number(f.count, lang)} color={f.id === 'won' ? 'var(--green)' : 'var(--ink)'} />
          ))}
          <p className="tl-hint">{stats.winRate != null ? t.tr_funnel_hint.replace('{rate}', percent(stats.winRate, lang, 0)).replace('{won}', stats.won).replace('{n}', stats.won + stats.lost) : t.tr_funnel_none}</p>
        </section>

        <section className="tl-sec">
          <h3 className="nx-display">{t.tr_dwell}</h3>
          {stats.dwell.map((d) => (
            <HBar key={d.stage} label={t[`tr_stage_${d.stage}`]} value={d.days || 0} max={dwellMax} text={d.days != null ? t.tl_days.replace('{n}', number(d.days, lang, d.days < 10 ? 1 : 0)) : '—'} color={d.days === dwellMax ? 'var(--rust)' : 'var(--blue)'} />
          ))}
          <p className="tl-hint">{t.tr_dwell_hint}</p>
        </section>

        <section className="tl-sec">
          <h3 className="nx-display">{t.tr_by_country}</h3>
          <div className="tl-scroll">
            <table className="tl-table">
              <thead>
                <tr><th>{t.tr_country}</th><th className="r">{t.tr_samples_n}</th><th className="r">{t.tr_win}</th><th className="r">{t.tr_spend}</th><th className="r">{t.tr_po_sum}</th></tr>
              </thead>
              <tbody>
                {stats.byCountry.map((c) => (
                  <tr key={c.country}>
                    <td>{c.country === '—' ? '—' : countryName(c.country, lang) || c.country}</td>
                    <td className="r tl-num">{c.samples}</td>
                    <td className="r tl-num">{c.won + c.lost ? percent(c.won / (c.won + c.lost), lang, 0) : '—'}</td>
                    <td className="r tl-num">{yuan(c.spend, lang)}</td>
                    <td className="r tl-num">{money(c.po, 'USD', lang, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tl-sec">
          <h3 className="nx-display">{t.tr_lost_why}</h3>
          {Object.keys(stats.lostReasons).length ? (
            Object.entries(stats.lostReasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <HBar key={k} label={t[`tr_lost_${k}`] || k} value={v} max={lostMax} text={number(v, lang)} color="var(--rust)" />
            ))
          ) : <p className="tl-hint">{t.tr_lost_none}</p>}
        </section>

        <section className="tl-sec" style={{ gridColumn: '1 / -1' }}>
          <div className="tl-sec__h">
            <h3 className="nx-display">{t.tr_pareto}</h3>
            <span className="tl-label">{stats.qualityShare != null ? t.tr_quality_share.replace('{pct}', percent(stats.qualityShare, lang)) : ''}</span>
          </div>
          {stats.pareto.length ? <Pareto rows={stats.pareto} t={t} lang={lang} /> : <p className="tl-hint">{t.tr_pareto_none}</p>}
          <p className="tl-hint">{t.tr_pareto_hint}</p>
        </section>
      </div>
    </div>
  )
}
