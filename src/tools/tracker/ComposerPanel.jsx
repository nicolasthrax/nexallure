import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Segmented, Select } from '../shared/ui.jsx'
import { CASE_TEMPLATES, SAMPLE_TEMPLATES, compose, mailtoLink, suggestedTemplate } from './composer.js'

export default function ComposerPanel({ rec, t, profile, onSent }) {
  const [template, setTemplate] = useState(() => suggestedTemplate(rec))
  const [tone, setTone] = useState('formal')
  const list = rec.kind === 'case' ? CASE_TEMPLATES : SAMPLE_TEMPLATES
  const mail = compose(rec, list.includes(template) ? template : list[0], { tone, sender: profile })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${mail.subject}\n\n${mail.body}`)
      toast.success(t.tr_copied)
      onSent?.()
    } catch {
      toast.error(t.tr_copy_failed)
    }
  }

  return (
    <section className="tl-sec" aria-labelledby={`cmp-${rec.id}`}>
      <div className="tl-sec__h">
        <h3 id={`cmp-${rec.id}`} className="nx-display">{t.tr_compose}</h3>
        <span className="tl-label">{t.tr_compose_lang}</span>
      </div>
      <div className="tl-grid2">
        <Select value={template} onChange={setTemplate} options={list.map((k) => ({ value: k, label: t[`tr_tpl_${k}`] }))} aria-label={t.tr_compose_template} />
        <Segmented label={t.tr_compose_tone} value={tone} onChange={setTone} options={[{ value: 'formal', label: t.tr_tone_formal }, { value: 'friendly', label: t.tr_tone_friendly }]} />
      </div>
      <div className="tr-mail" lang="en">
        <strong>{t.tr_subject}: </strong>{mail.subject}
        {'\n\n'}
        {mail.body}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="tl-btn tl-btn--ink" onClick={copy}>{t.tr_copy}</button>
        <a className="tl-btn" href={mailtoLink(rec.buyer?.email, mail)} onClick={() => onSent?.()} style={{ textDecoration: 'none' }}>{t.tr_open_email}</a>
      </div>
      <p className="tl-hint">{t.tr_compose_hint}</p>
    </section>
  )
}
