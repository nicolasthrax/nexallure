import { useState } from 'react'
import { Field, NumInput, Select, TextInput } from '../shared/ui.jsx'
import { countryOptions } from '../shared/countries.js'
import { dateTime, relative } from '../shared/format.js'
import { COURIERS, moveSample, nextDue, snooze, touch, trackingUrl, warmth } from './model.js'
import ComposerPanel from './ComposerPanel.jsx'

const STRIP = ['requested', 'making', 'qc', 'transit', 'delivered', 'decided']
// Stage names, except that "delivered" means waiting on the buyer and the
// last cell shows how it ended.
function stripLabel(s, rec, t) {
  if (s === 'decided') return rec.stage === 'won' ? t.tr_stage_won : rec.stage === 'lost' ? t.tr_stage_lost : t.tr_col_decided
  if (s === 'delivered') return t.tr_col_delivered
  return t[`tr_stage_${s}`]
}

const LOST_REASONS = ['price', 'quality', 'lead_time', 'no_reply', 'cancelled', 'competitor', 'other']

export function Log({ rec, t, lang }) {
  const text = (e) => {
    if (e.type === 'created') return t.tr_log_created
    if (e.type === 'stage') return t.tr_log_stage.replace('{stage}', t[`tr_stage_${e.stage}`] || e.stage)
    if (e.type === 'touch') return e.note ? `${t.tr_log_touch}: ${e.note}` : t.tr_log_touch
    if (e.type === 'snooze') return t.tr_log_snooze.replace('{n}', e.days)
    if (e.type === 'step') return t.tr_log_step.replace('{step}', e.step)
    return e.type
  }
  return (
    <section className="tl-sec">
      <h3 className="nx-display">{t.tr_activity}</h3>
      <div className="tr-log">
        {[...(rec.log || [])].reverse().map((e, i) => (
          <div key={i}><span className="tl-num" style={{ color: 'var(--ink-3)' }}>{dateTime(e.at, lang)}</span><span>{text(e)}</span></div>
        ))}
      </div>
    </section>
  )
}

export default function SampleDrawerBody({ rec, update, commit, t, lang, profile, onQuote, onCase, onDelete, onOpenQuote }) {
  const [awb, setAwb] = useState(rec.awb || '')
  const [courier, setCourier] = useState(rec.courier || 'DHL')
  const [po, setPo] = useState(rec.poValue || '')
  const [reason, setReason] = useState(rec.lostReason || 'price')
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(false)
  const col = rec.stage === 'won' || rec.stage === 'lost' ? 'decided' : rec.stage
  const at = STRIP.indexOf(col)
  const due = nextDue(rec)
  const heat = warmth(rec)
  const link = trackingUrl(rec.courier, rec.awb)
  const setBuyer = (patch) => update({ buyer: { ...rec.buyer, ...patch } })

  return (
    <>
      <div className="tr-stages" aria-label={t.tr_stage}>
        {STRIP.map((s, i) => (
          <span key={s} data-state={i < at ? 'done' : i === at ? 'now' : 'todo'} aria-current={i === at ? 'step' : undefined}>
            {stripLabel(s, rec, t)}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px 24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {due && <span className="tr-due" data-late={due < new Date()}>{t.tr_next_contact} {relative(due, t)}</span>}
        {heat != null && rec.stage !== 'won' && rec.stage !== 'lost' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            {t.tr_warmth}
            <span className="tl-bar" style={{ width: 90 }}><span style={{ width: `${heat}%`, background: heat > 60 ? 'var(--green)' : heat > 30 ? 'var(--yellow)' : 'var(--rust)' }} /></span>
            <span className="tl-num">{heat}</span>
          </span>
        )}
      </div>

      <section className="tl-card" aria-label={t.tr_next_action}>
        <span className="tl-label">{t.tr_next_action}</span>
        {rec.stage === 'requested' && (
          <button type="button" className="tl-btn tl-btn--ink" onClick={() => commit(moveSample(rec, 'making'))}>{t.tr_act_approve}</button>
        )}
        {rec.stage === 'making' && (
          <button type="button" className="tl-btn tl-btn--ink" onClick={() => commit(moveSample(rec, 'qc'))}>{t.tr_act_qc}</button>
        )}
        {rec.stage === 'qc' && (
          <div className="tl-grid2" style={{ alignItems: 'end' }}>
            <Field label={t.tr_courier}><Select value={courier} onChange={setCourier} options={COURIERS.map((c) => ({ value: c, label: c === 'Other' ? t.tr_courier_other : c }))} /></Field>
            <Field label={t.tr_awb}><TextInput value={awb} onChange={setAwb} placeholder="1234567890" /></Field>
            <button type="button" className="tl-btn tl-btn--ink" onClick={() => commit(moveSample(rec, 'transit', { courier, awb: awb.trim() }))}>{t.tr_act_dispatch}</button>
          </div>
        )}
        {rec.stage === 'transit' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="tl-btn tl-btn--ink" onClick={() => commit(moveSample(rec, 'delivered'))}>{t.tr_act_delivered}</button>
            {link && <a className="tl-btn" href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{t.tr_track} ↗</a>}
          </div>
        )}
        {rec.stage === 'delivered' && (
          <div className="tl-grid2" style={{ alignItems: 'end' }}>
            <Field label={t.tr_po_value}><NumInput value={po} onChange={setPo} suffix="$" /></Field>
            <button type="button" className="tl-btn tl-btn--go" onClick={() => commit(moveSample(rec, 'won', { poValue: po }))} disabled={!(parseFloat(po) > 0)}>{t.tr_act_won}</button>
            <Field label={t.tr_lost_reason}><Select value={reason} onChange={setReason} options={LOST_REASONS.map((k) => ({ value: k, label: t[`tr_lost_${k}`] }))} /></Field>
            <button type="button" className="tl-btn tl-btn--danger" onClick={() => commit(moveSample(rec, 'lost', { lostReason: reason }))}>{t.tr_act_lost}</button>
          </div>
        )}
        {(rec.stage === 'won' || rec.stage === 'lost') && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>
              {rec.stage === 'won' ? t.tr_won_po.replace('{v}', Number(rec.poValue || 0).toLocaleString('en-US')) : t.tr_lost_because.replace('{r}', t[`tr_lost_${rec.lostReason}`] || rec.lostReason)}
            </span>
            <button type="button" className="tl-btn" onClick={() => commit(moveSample(rec, 'delivered'))}>{t.tr_act_reopen}</button>
          </div>
        )}
        {rec.stage !== 'won' && rec.stage !== 'lost' && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
              <Field label={t.tr_contact_note} className="tl-grow">
                <TextInput value={note} onChange={setNote} placeholder={t.tr_contact_note_ph} />
              </Field>
              <button type="button" className="tl-btn" onClick={() => { commit(touch(rec, note.trim())); setNote('') }}>{t.tr_act_touch}</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="tl-btn tl-btn--quiet" onClick={() => commit(snooze(rec, 2))}>{t.tr_snooze_2}</button>
              <button type="button" className="tl-btn tl-btn--quiet" onClick={() => commit(snooze(rec, 7))}>{t.tr_snooze_7}</button>
            </div>
          </>
        )}
      </section>

      <section className="tl-sec">
        <h3 className="nx-display">{t.tr_details}</h3>
        <div className="tl-grid2">
          <Field label={t.tr_buyer}><TextInput value={rec.buyer?.company} onChange={(v) => setBuyer({ company: v })} /></Field>
          <Field label={t.tr_country}>
            <Select value={rec.buyer?.country || ''} onChange={(v) => setBuyer({ country: v })} options={[{ value: '', label: '—' }, ...countryOptions(lang).map((c) => ({ value: c.code, label: c.name }))]} />
          </Field>
          <Field label={t.tr_contact}><TextInput value={rec.buyer?.contact} onChange={(v) => setBuyer({ contact: v })} /></Field>
          <Field label={t.tr_email}><TextInput type="email" value={rec.buyer?.email} onChange={(v) => setBuyer({ email: v })} /></Field>
          <Field label={t.tr_item} wide><TextInput value={rec.item} onChange={(v) => update({ item: v })} /></Field>
          <Field label={t.tr_qty}><NumInput value={rec.qty} onChange={(v) => update({ qty: v })} /></Field>
          <Field label={t.tr_cost_policy}>
            <Select value={rec.costPolicy} onChange={(v) => update({ costPolicy: v })} options={['free', 'buyer_pays', 'credit'].map((k) => ({ value: k, label: t[`tr_policy_${k}`] }))} />
          </Field>
          <Field label={t.tr_goods_cost}><NumInput value={rec.goodsCost} onChange={(v) => update({ goodsCost: v })} suffix="¥" /></Field>
          <Field label={t.tr_courier_cost}><NumInput value={rec.courierCost} onChange={(v) => update({ courierCost: v })} suffix="¥" /></Field>
          <Field label={t.tr_courier}><Select value={rec.courier} onChange={(v) => update({ courier: v })} options={COURIERS.map((c) => ({ value: c, label: c === 'Other' ? t.tr_courier_other : c }))} /></Field>
          <Field label={t.tr_awb}>
            <TextInput value={rec.awb} onChange={(v) => update({ awb: v })} />
          </Field>
          <Field label={t.tr_notes} wide><textarea className="tl-input" rows={3} value={rec.notes || ''} onChange={(e) => update({ notes: e.target.value })} /></Field>
        </div>
        {link && <a className="nx-link" href={link} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start' }}>{t.tr_track_with.replace('{c}', rec.courier === 'Other' ? '17TRACK' : rec.courier)} ↗</a>}
      </section>

      <ComposerPanel rec={rec} t={t} profile={profile} />

      <section className="tl-sec">
        <h3 className="nx-display">{t.tr_links}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rec.quoteId
            ? <button type="button" className="tl-btn" onClick={() => onOpenQuote(rec.quoteId)}>{t.tr_open_quote}</button>
            : <button type="button" className="tl-btn" onClick={onQuote}>{t.tr_make_quote}</button>}
          <button type="button" className="tl-btn" onClick={onCase}>{t.tr_open_case}</button>
        </div>
      </section>

      <Log rec={rec} t={t} lang={lang} />

      <div>
        {confirm ? (
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <button type="button" className="tl-btn tl-btn--danger" onClick={onDelete}>{t.tl_delete_confirm}</button>
            <button type="button" className="tl-btn tl-btn--quiet" onClick={() => setConfirm(false)}>{t.tl_cancel}</button>
          </span>
        ) : (
          <button type="button" className="tl-btn tl-btn--quiet" onClick={() => setConfirm(true)}>{t.tr_delete_sample}</button>
        )}
      </div>
    </>
  )
}
