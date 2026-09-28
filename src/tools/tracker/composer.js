// Buyer-facing follow-up emails, built from the facts on the record. Always
// English: it is the working language of export sales, whatever language the
// factory's team reads the tool in. No AI: the same record always writes the
// same email, and nothing leaves the browser.

import { dueAt, nextStep, trackingUrl } from './model.js'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

const STEP_NAMES = {
  D0: 'initial assessment', D1: 'team formation', D2: 'problem description', D3: 'interim containment',
  D4: 'root-cause analysis', D5: 'permanent corrective action', D6: 'validation of the corrective action',
  D7: 'measures to prevent recurrence', D8: 'case closure',
}

export const SAMPLE_TEMPLATES = ['dispatched', 'delivered', 'feedback', 'cold', 'won']
export const CASE_TEMPLATES = ['acknowledge', 'containment', 'rootcause', 'close']

export function suggestedTemplate(rec) {
  if (rec.kind === 'case') {
    const d = rec.d || {}
    if (d.D8?.done || d.D7?.done) return 'close'
    if (d.D4?.done) return 'rootcause'
    if (d.D3?.done) return 'containment'
    return 'acknowledge'
  }
  switch (rec.stage) {
    case 'transit': return 'dispatched'
    case 'delivered': return (rec.log || []).some((e) => e.type === 'touch' && Date.parse(e.at) >= Date.parse(rec.stageAt?.delivered)) ? 'feedback' : 'delivered'
    case 'won': return 'won'
    default: return 'dispatched'
  }
}

function greeting(rec, tone) {
  const name = (rec.buyer?.contact || '').trim()
  if (tone === 'friendly') return name ? `Hi ${name.split(/\s+/)[0]},` : 'Hi,'
  return name ? `Dear ${name},` : 'Dear Sir or Madam,'
}

function signoff(tone, sender) {
  const who = [sender?.name, sender?.company].filter(Boolean).join('\n')
  return `${tone === 'friendly' ? 'Best regards' : 'Kind regards'},\n${who || '[Your name]\n[Your company]'}`
}

export function compose(rec, template, { tone = 'formal', sender = {} } = {}) {
  const item = rec.item || rec.product || 'the samples'
  const link = rec.kind === 'case' ? null : trackingUrl(rec.courier, rec.awb)
  let subject = ''
  let body = []

  if (rec.kind === 'case') {
    const ref = [rec.ref, rec.poRef && `PO ${rec.poRef}`, rec.lot && `lot ${rec.lot}`].filter(Boolean).join(' · ')
    const qty = rec.affectedQty ? `${rec.affectedQty}${rec.totalQty ? ` of ${rec.totalQty}` : ''} pcs` : 'the affected goods'
    const step = nextStep(rec)
    switch (template) {
      case 'acknowledge':
        subject = `${ref} · ${rec.title || 'Your complaint'} · received`
        body = [
          `Thank you for reporting this. We have opened case ${rec.ref} for ${qty}${rec.product ? ` of ${rec.product}` : ''}, and a team is working on it now.`,
          `You will have our containment actions by ${fmtDate(dueAt(rec, 'D3'))}, and our root-cause analysis by ${fmtDate(dueAt(rec, 'D4'))}.`,
          'If you can send photos, the carton labels and the lot or batch number, it will help us find the cause faster.',
        ]
        break
      case 'containment':
        subject = `${ref} · containment in place`
        body = [
          `Here is where case ${rec.ref} stands.`,
          rec.d?.D3?.note ? `What we have done to protect you now: ${rec.d.D3.note}` : 'Containment actions are in place to protect your stock and your next deliveries.',
          `Our root-cause analysis will follow by ${fmtDate(dueAt(rec, 'D4'))}.`,
        ]
        break
      case 'rootcause':
        subject = `${ref} · root cause and corrective action`
        body = [
          `We have completed the root-cause analysis for case ${rec.ref}.`,
          rec.d?.D4?.note ? `Root cause: ${rec.d.D4.note}` : 'Root cause: [describe the cause of occurrence and why it was not detected]',
          rec.d?.D5?.note ? `Corrective action: ${rec.d.D5.note}` : `Our permanent corrective action will be confirmed by ${fmtDate(dueAt(rec, 'D5'))}.`,
          step && step !== 'D4' ? `Next step: ${STEP_NAMES[step]}, due ${fmtDate(dueAt(rec, step))}.` : '',
        ]
        break
      default:
        subject = `${ref} · case closed`
        body = [
          `Case ${rec.ref} is now closed. Our corrective actions are validated and in production.`,
          rec.d?.D7?.note ? `To prevent it happening again: ${rec.d.D7.note}` : '',
          rec.resolution ? `Settlement: ${resolutionText(rec)}.` : '',
          'Thank you for your patience and for the detail you gave us. It made this faster to solve.',
        ]
    }
  } else {
    switch (template) {
      case 'dispatched':
        subject = `Samples on the way · ${item}`
        body = [
          `Your samples of ${item}${rec.qty ? ` (${rec.qty} pcs)` : ''} have been sent${rec.courier && rec.courier !== 'Other' ? ` by ${rec.courier}` : ''}.`,
          rec.awb ? `Tracking number: ${rec.awb}${link ? `\n${link}` : ''}` : '',
          'If you would like our inspection record, test reports or certificates for these samples, just reply and we will send them.',
        ]
        break
      case 'delivered':
        subject = `Your samples of ${item} have arrived`
        body = [
          `The courier shows your samples of ${item} were delivered${rec.stageAt?.delivered ? ` on ${fmtDate(rec.stageAt.delivered)}` : ''}.`,
          'When your team has had a look, we would value your first impressions: fit, finish, and anything you would like changed before an order.',
          'If it helps, we can prepare pricing for your expected order quantity now, so it is ready when testing is done.',
        ]
        break
      case 'feedback':
        subject = `Following up on the ${item} samples`
        body = [
          `I wanted to check how testing of the ${item} samples is going.`,
          'Is there anything we can send to help, such as material certificates, test data, or a video call with our engineer?',
        ]
        break
      case 'cold':
        subject = `${item} · still of interest?`
        body = [
          `It has been a while since we sent the ${item} samples, so I wanted to check whether the project is still active.`,
          'If the timing has moved, just let me know when to get back in touch. If something about the samples was not right, I would like to hear it, so we can fix it.',
        ]
        break
      default:
        subject = `Thank you for your order · ${item}`
        body = [
          `Thank you for your order${rec.poValue ? ` (USD ${Number(rec.poValue).toLocaleString('en-US')})` : ''}.`,
          'Production will match the approved samples exactly. We will keep a counter-sample from this lot for reference.',
          'You will receive our production schedule within two working days.',
        ]
    }
  }

  const text = [greeting(rec, tone), '', ...body.filter(Boolean).flatMap((p) => [p, '']), signoff(tone, sender)].join('\n')
  return { subject, body: text }
}

function resolutionText(rec) {
  const map = {
    replacement: 'replacement goods at our cost',
    credit: 'a credit note against your next order',
    refund: 'a refund',
    repair: 'repair of the affected goods',
    rework: 'rework of the affected goods',
    rejected: 'after investigation, the claim was not accepted; our findings are attached',
  }
  return map[rec.resolution] || rec.resolution
}

export function mailtoLink(to, { subject, body }) {
  return `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
