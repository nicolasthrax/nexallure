import { useState } from 'react'
import { Field, NumInput, Select, TextInput } from '../shared/ui.jsx'
import { countryOptions } from '../shared/countries.js'
import { date, dateTime, relative } from '../shared/format.js'
import { CASE_TYPES, DISCIPLINES, RESOLUTIONS, ROOT_CAUSES, SEVERITIES, completeStep, dueAt, nextStep, snooze } from './model.js'
import ComposerPanel from './ComposerPanel.jsx'
import { Log } from './SampleDrawer.jsx'

export default function CaseDrawerBody({ rec, update, commit, t, lang, profile, sample, onOpenSample, onDelete }) {
  const next = nextStep(rec)
  const [sel, setSel] = useState(next || 'D8')
  const [confirm, setConfirm] = useState(false)
  const step = rec.d?.[sel] || {}
  const due = dueAt(rec, sel)
  const setBuyer = (patch) => update({ buyer: { ...rec.buyer, ...patch } })
  const setNote = (v) => update({ d: { ...rec.d, [sel]: { ...step, note: v } } })
  const reopen = () => commit({ ...rec, d: { ...rec.d, [sel]: { ...step, done: false, at: '' } } })

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className={`tl-pill ${rec.severity === 'critical' ? 'tl-pill--rust' : rec.severity === 'major' ? 'tl-pill--yellow' : ''}`}>{t[`tr_sev_${rec.severity}`]}</span>
        <span className="tl-pill">{t[`tr_type_${rec.type}`]}</span>
        <span className="tl-num" style={{ fontSize: 14 }}>{t.tr_opened.replace('{date}', dateTime(rec.openedAt, lang))}</span>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby={`d8-${rec.id}`}>
        <div className="tl-sec__h">
          <h3 id={`d8-${rec.id}`} className="nx-display" style={{ fontSize: 28, fontStretch: '90%' }}>{t.tr_8d}</h3>
          <span className="tl-label">{t.tr_8d_hint}</span>
        </div>
        <div className="tr-rail">
          {DISCIPLINES.map((k) => {
            const d = rec.d?.[k] || {}
            const state = d.done ? 'done' : k === next ? 'next' : 'todo'
            const late = !d.done && dueAt(rec, k) < new Date()
            return (
              <button key={k} type="button" className="tr-step" data-state={state} aria-pressed={sel === k} onClick={() => setSel(k)}>
                <span className="tr-step__bar" />
                <span className="tr-step__code">{k}</span>
                <span className="tr-step__name">{t[`tr_d_${k}`]}</span>
                <span className="tr-meta" style={late ? { color: 'var(--rust)', fontWeight: 700 } : undefined}>
                  {d.done ? t.tr_step_done : date(dueAt(rec, k), lang, { day: 'numeric', month: 'short' })}
                </span>
              </button>
            )
          })}
        </div>
        <div className="tl-card">
          <div className="tl-sec__h">
            <strong style={{ fontSize: 18 }}>{sel} · {t[`tr_d_${sel}`]}</strong>
            <span className="tr-due" data-late={!step.done && due < new Date()}>
              {step.done ? t.tr_done_at.replace('{date}', dateTime(step.at, lang)) : relative(due, t)}
            </span>
          </div>
          <p className="tl-hint">{t[`tr_d_${sel}_help`]}</p>
          <Field label={t.tr_step_note}>
            <textarea className="tl-input" rows={3} value={step.note || ''} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {step.done
              ? <button type="button" className="tl-btn" onClick={reopen}>{t.tr_step_reopen}</button>
              : <button type="button" className="tl-btn tl-btn--go" onClick={() => { const n = completeStep(rec, sel); commit(n); setSel(nextStep(n) || sel) }}>{t.tr_step_complete.replace('{step}', sel)}</button>}
            {!step.done && <button type="button" className="tl-btn tl-btn--quiet" onClick={() => commit(snooze(rec, 1))}>{t.tr_snooze_1}</button>}
          </div>
        </div>
      </section>

      <section className="tl-sec">
        <h3 className="nx-display">{t.tr_details}</h3>
        <div className="tl-grid2">
          <Field label={t.tr_case_title} wide><TextInput value={rec.title} onChange={(v) => update({ title: v })} placeholder={t.tr_case_title_ph} /></Field>
          <Field label={t.tr_buyer}><TextInput value={rec.buyer?.company} onChange={(v) => setBuyer({ company: v })} /></Field>
          <Field label={t.tr_country}>
            <Select value={rec.buyer?.country || ''} onChange={(v) => setBuyer({ country: v })} options={[{ value: '', label: '—' }, ...countryOptions(lang).map((c) => ({ value: c.code, label: c.name }))]} />
          </Field>
          <Field label={t.tr_contact}><TextInput value={rec.buyer?.contact} onChange={(v) => setBuyer({ contact: v })} /></Field>
          <Field label={t.tr_email}><TextInput type="email" value={rec.buyer?.email} onChange={(v) => setBuyer({ email: v })} /></Field>
          <Field label={t.tr_severity}>
            <Select value={rec.severity} onChange={(v) => update({ severity: v })} options={SEVERITIES.map((k) => ({ value: k, label: t[`tr_sev_${k}`] }))} />
          </Field>
          <Field label={t.tr_type}>
            <Select value={rec.type} onChange={(v) => update({ type: v })} options={CASE_TYPES.map((k) => ({ value: k, label: t[`tr_type_${k}`] }))} />
          </Field>
          <Field label={t.tr_product}><TextInput value={rec.product} onChange={(v) => update({ product: v })} /></Field>
          <Field label={t.tr_po_ref}><TextInput value={rec.poRef} onChange={(v) => update({ poRef: v })} /></Field>
          <Field label={t.tr_lot}><TextInput value={rec.lot} onChange={(v) => update({ lot: v })} /></Field>
          <Field label={t.tr_claim}><NumInput value={rec.claimValue} onChange={(v) => update({ claimValue: v })} suffix="$" /></Field>
          <Field label={t.tr_affected}><NumInput value={rec.affectedQty} onChange={(v) => update({ affectedQty: v })} /></Field>
          <Field label={t.tr_total_qty}><NumInput value={rec.totalQty} onChange={(v) => update({ totalQty: v })} /></Field>
          <Field label={t.tr_root_cause}>
            <Select value={rec.rootCause} onChange={(v) => update({ rootCause: v })} options={[{ value: '', label: '—' }, ...ROOT_CAUSES.map((k) => ({ value: k, label: t[`tr_cause_${k}`] }))]} />
          </Field>
          <Field label={t.tr_resolution}>
            <Select value={rec.resolution} onChange={(v) => update({ resolution: v })} options={[{ value: '', label: '—' }, ...RESOLUTIONS.map((k) => ({ value: k, label: t[`tr_res_${k}`] }))]} />
          </Field>
          <Field label={t.tr_case_cost} hint={t.tr_case_cost_hint} wide><NumInput value={rec.costCny} onChange={(v) => update({ costCny: v })} suffix="¥" /></Field>
        </div>
      </section>

      <ComposerPanel rec={rec} t={t} profile={profile} />

      {sample && (
        <section className="tl-sec">
          <h3 className="nx-display">{t.tr_links}</h3>
          <button type="button" className="tl-btn" style={{ alignSelf: 'flex-start' }} onClick={() => onOpenSample(sample.id)}>
            {t.tr_from_sample.replace('{ref}', sample.ref)}
          </button>
        </section>
      )}

      <Log rec={rec} t={t} lang={lang} />

      <div>
        {confirm ? (
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <button type="button" className="tl-btn tl-btn--danger" onClick={onDelete}>{t.tl_delete_confirm}</button>
            <button type="button" className="tl-btn tl-btn--quiet" onClick={() => setConfirm(false)}>{t.tl_cancel}</button>
          </span>
        ) : (
          <button type="button" className="tl-btn tl-btn--quiet" onClick={() => setConfirm(true)}>{t.tr_delete_case}</button>
        )}
      </div>
    </>
  )
}
