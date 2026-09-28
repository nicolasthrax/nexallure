// Sample & After-Sales Tracker: the rules, as pure functions.
//
// Samples move through a pipeline; after-sales cases move through the 8D
// problem-solving method. Both are "buyer threads", and both go cold if
// nobody touches them, so every record carries a due date for its next
// contact and a warmth score that decays with silence.

import { toCountryCode } from '../shared/countries.js'

const DAY = 86400000
const HOUR = 3600000
const ms = (d) => (d ? Date.parse(d) : NaN)

// ─── Samples ────────────────────────────────────────────────────────────────

export const SAMPLE_STAGES = ['requested', 'making', 'qc', 'transit', 'delivered', 'won', 'lost']
export const SAMPLE_COLUMNS = [
  { id: 'requested', stages: ['requested'] },
  { id: 'making', stages: ['making', 'qc'] },
  { id: 'transit', stages: ['transit'] },
  { id: 'delivered', stages: ['delivered'] },
  { id: 'decided', stages: ['won', 'lost'] },
]
const OPEN_SAMPLE = new Set(['requested', 'making', 'qc', 'transit', 'delivered'])

// How long each stage can go without contact before it needs a touch, and
// how fast the buyer's interest fades there (half-life, days). A landed
// sample is the hottest moment in export sales: the buyer is testing it now.
const SAMPLE_RULES = {
  requested: { every: 2, halfLife: 10 },
  making: { every: 5, halfLife: 14 },
  qc: { every: 2, halfLife: 14 },
  transit: { every: 3, halfLife: 12 },
  delivered: { every: 4, halfLife: 6 },
}
// After delivery the follow-up gaps widen: day 4, then 7, then 14, then 30.
const DELIVERED_STEPS = [4, 7, 14, 30]

export const COURIERS = ['DHL', 'FedEx', 'UPS', 'SF', 'EMS', 'Other']

export function trackingUrl(courier, awb) {
  const n = encodeURIComponent(String(awb || '').replace(/\s+/g, ''))
  if (!n) return null
  switch (courier) {
    case 'DHL': return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`
    case 'FedEx': return `https://www.fedex.com/fedextrack/?trknbr=${n}`
    case 'UPS': return `https://www.ups.com/track?tracknum=${n}`
    default: return `https://t.17track.net/en#nums=${n}`
  }
}

export function newSample(ref) {
  const now = new Date().toISOString()
  return {
    ref,
    stage: 'requested',
    stageAt: { requested: now },
    buyer: { company: '', contact: '', email: '', country: '' },
    item: '',
    qty: '',
    costPolicy: 'free',
    goodsCost: '',
    courierCost: '',
    courier: 'DHL',
    awb: '',
    poValue: '',
    lostReason: '',
    notes: '',
    lastTouchAt: now,
    snoozeUntil: '',
    quoteId: '',
    log: [{ at: now, type: 'created' }],
  }
}

// ─── After-sales cases (8D) ─────────────────────────────────────────────────

export const DISCIPLINES = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8']

// Due times after the case opens, in hours. Containment inside 24 hours and
// D1–D3 inside three days are what automotive and industrial buyers write
// into supplier agreements; D4–D6 inside 30 days, D7–D8 inside 60.
const DUE_HOURS = { D0: 4, D1: 24, D2: 24, D3: 24, D4: 10 * 24, D5: 30 * 24, D6: 30 * 24, D7: 60 * 24, D8: 60 * 24 }
// A minor issue gets three times as long for the urgent steps.
const MINOR_SLACK = { D0: 3, D1: 3, D2: 3, D3: 3 }

export const CASE_TYPES = ['quality', 'shortage', 'damage', 'docs', 'late', 'other']
export const SEVERITIES = ['critical', 'major', 'minor']
export const ROOT_CAUSES = ['material', 'process', 'design', 'packaging', 'transport', 'supplier', 'human', 'unknown']
export const RESOLUTIONS = ['replacement', 'credit', 'refund', 'repair', 'rework', 'rejected']

export function newCase(ref) {
  const now = new Date().toISOString()
  return {
    ref,
    openedAt: now,
    buyer: { company: '', contact: '', email: '', country: '' },
    title: '',
    type: 'quality',
    severity: 'major',
    product: '',
    poRef: '',
    lot: '',
    affectedQty: '',
    totalQty: '',
    claimValue: '',
    rootCause: '',
    resolution: '',
    costCny: '',
    d: Object.fromEntries(DISCIPLINES.map((k) => [k, { done: false, at: '', note: '' }])),
    sampleId: '',
    lastTouchAt: now,
    snoozeUntil: '',
    log: [{ at: now, type: 'created' }],
  }
}

export function dueAt(rec, step) {
  const open = ms(rec.openedAt)
  const slack = rec.severity === 'minor' ? MINOR_SLACK[step] || 1 : 1
  return new Date(open + DUE_HOURS[step] * slack * HOUR)
}

export function nextStep(rec) {
  return DISCIPLINES.find((k) => !rec.d?.[k]?.done) || null
}

function caseClosed(rec) {
  return !!rec.d?.D8?.done
}

// Where a case sits on the board, derived from its 8D progress.
export function caseColumn(rec) {
  const done = (k) => !!rec.d?.[k]?.done
  if (done('D8')) return 'closed'
  if (done('D6')) return 'preventing'
  if (done('D4')) return 'fixing'
  if (done('D3')) return 'contained'
  return 'open'
}
export const CASE_COLUMNS = ['open', 'contained', 'fixing', 'preventing', 'closed']

// ─── Due dates, warmth, today's queue ───────────────────────────────────────

function sampleDue(rec) {
  const rule = SAMPLE_RULES[rec.stage]
  if (!rule) return null
  const touch = ms(rec.lastTouchAt) || ms(rec.createdAt) || Date.now()
  if (rec.stage === 'delivered') {
    const landed = ms(rec.stageAt?.delivered) || touch
    // How many follow-ups since landing decides the next gap.
    const since = (rec.log || []).filter((e) => e.type === 'touch' && ms(e.at) >= landed).length
    const gap = DELIVERED_STEPS[Math.min(since, DELIVERED_STEPS.length - 1)]
    return new Date(Math.max(touch, landed) + gap * DAY)
  }
  return new Date(touch + rule.every * DAY)
}

// When this record next needs someone to act on it.
export function nextDue(rec) {
  let due
  if (rec.kind === 'case') {
    if (caseClosed(rec)) return null
    due = dueAt(rec, nextStep(rec))
  } else {
    due = sampleDue(rec)
  }
  if (!due) return null
  const snooze = ms(rec.snoozeUntil)
  return Number.isFinite(snooze) && snooze > due.getTime() ? new Date(snooze) : due
}

// 0–100. Halves every `halfLife` days without contact.
export function warmth(rec, now = Date.now()) {
  if (rec.kind === 'case') return null
  const rule = SAMPLE_RULES[rec.stage]
  if (!rule) return rec.stage === 'won' ? 100 : 0
  const touch = ms(rec.lastTouchAt) || ms(rec.createdAt) || now
  const days = Math.max(0, (now - touch) / DAY)
  return Math.round(100 * 0.5 ** (days / rule.halfLife))
}

export function todayQueue(samples, cases, now = Date.now(), horizonHours = 24) {
  const limit = now + horizonHours * HOUR
  const rows = []
  for (const r of samples) {
    if (!OPEN_SAMPLE.has(r.stage)) continue
    const due = nextDue(r)
    if (due && due.getTime() <= limit) rows.push({ rec: r, due, reason: sampleReason(r, now) })
  }
  for (const c of cases) {
    const due = nextDue(c)
    if (due && due.getTime() <= limit) rows.push({ rec: c, due, reason: { code: 'step', step: nextStep(c) } })
  }
  // Cases before samples at equal lateness: a buyer with a defect waits least.
  return rows.sort((a, b) => a.due - b.due || (a.rec.kind === 'case' ? -1 : 1))
}

function sampleReason(r, now) {
  const since = (d) => Math.floor((now - ms(d)) / DAY)
  switch (r.stage) {
    case 'requested': return { code: 'approve' }
    case 'making': return { code: 'update' }
    case 'qc': return { code: 'qc' }
    case 'transit': return { code: 'track', days: since(r.stageAt?.transit) }
    case 'delivered': return { code: warmth(r, now) < 25 ? 'cold' : 'feedback', days: since(r.stageAt?.delivered) }
    default: return { code: 'update' }
  }
}

// ─── Moving records ─────────────────────────────────────────────────────────

export function moveSample(rec, stage, extra = {}) {
  const now = new Date().toISOString()
  return {
    ...rec,
    ...extra,
    stage,
    stageAt: { ...(rec.stageAt || {}), [stage]: now },
    lastTouchAt: now,
    snoozeUntil: '',
    log: [...(rec.log || []), { at: now, type: 'stage', stage }],
  }
}

export function touch(rec, note = '') {
  const now = new Date().toISOString()
  return { ...rec, lastTouchAt: now, snoozeUntil: '', log: [...(rec.log || []), { at: now, type: 'touch', note }] }
}

export function snooze(rec, days) {
  const until = new Date(Date.now() + days * DAY).toISOString()
  return { ...rec, snoozeUntil: until, log: [...(rec.log || []), { at: new Date().toISOString(), type: 'snooze', days }] }
}

export function completeStep(rec, step, note) {
  const now = new Date().toISOString()
  const d = { ...rec.d, [step]: { ...(rec.d?.[step] || {}), done: true, at: now, note: note ?? rec.d?.[step]?.note ?? '' } }
  return { ...rec, d, lastTouchAt: now, snoozeUntil: '', log: [...(rec.log || []), { at: now, type: 'step', step }] }
}

// ─── Insights ───────────────────────────────────────────────────────────────

const n = (v) => {
  const x = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v)
  return Number.isFinite(x) ? x : 0
}

function median(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!v.length) return null
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

// The sample's cost to us. When the buyer pays, it costs nothing net.
const sampleSpend = (s) => (s.costPolicy === 'buyer_pays' ? 0 : n(s.goodsCost) + n(s.courierCost))

export function insights(samples, cases, { fx = 7.1, now = Date.now(), days = 365 } = {}) {
  const since = now - days * DAY
  const recent = samples.filter((s) => (ms(s.stageAt?.requested) || ms(s.createdAt) || now) >= since)
  const won = recent.filter((s) => s.stage === 'won')
  const lost = recent.filter((s) => s.stage === 'lost')
  const decided = won.length + lost.length
  const spend = recent.reduce((a, s) => a + sampleSpend(s), 0)
  const poUsd = won.reduce((a, s) => a + n(s.poValue), 0)
  const daysToPo = median(won.map((s) => (ms(s.stageAt?.won) - ms(s.stageAt?.requested)) / DAY))

  // Median days a sample spends in each stage, counting only finished stays.
  const order = ['requested', 'making', 'qc', 'transit', 'delivered']
  const dwell = order.map((st, i) => {
    const vals = recent.map((s) => {
      const a = ms(s.stageAt?.[st])
      if (!Number.isFinite(a)) return NaN
      const later = [...order.slice(i + 1), 'won', 'lost'].map((x) => ms(s.stageAt?.[x])).filter((t) => Number.isFinite(t) && t >= a)
      return later.length ? (Math.min(...later) - a) / DAY : NaN
    })
    return { stage: st, days: median(vals) }
  })

  // Funnel: how many samples reached at least each point.
  const reached = (s, st) => Number.isFinite(ms(s.stageAt?.[st]))
  const funnel = [
    { id: 'requested', count: recent.length },
    { id: 'transit', count: recent.filter((s) => reached(s, 'transit') || reached(s, 'delivered') || s.stage === 'won' || s.stage === 'lost').length },
    { id: 'delivered', count: recent.filter((s) => reached(s, 'delivered') || s.stage === 'won' || s.stage === 'lost').length },
    { id: 'won', count: won.length },
  ]

  const byCountry = {}
  for (const s of recent) {
    const c = (s.buyer?.country || '—').toUpperCase()
    byCountry[c] ||= { country: c, samples: 0, won: 0, lost: 0, spend: 0, po: 0 }
    const row = byCountry[c]
    row.samples++
    row.spend += sampleSpend(s)
    if (s.stage === 'won') { row.won++; row.po += n(s.poValue) }
    if (s.stage === 'lost') row.lost++
  }

  const lostReasons = {}
  for (const s of lost) {
    const k = s.lostReason || 'other'
    lostReasons[k] = (lostReasons[k] || 0) + 1
  }

  const recentCases = cases.filter((c) => (ms(c.openedAt) || now) >= since)
  const pareto = {}
  for (const c of recentCases) {
    const k = c.rootCause || 'unknown'
    pareto[k] ||= { cause: k, cases: 0, cost: 0 }
    pareto[k].cases++
    pareto[k].cost += n(c.costCny)
  }
  const paretoRows = Object.values(pareto).sort((a, b) => b.cost - a.cost || b.cases - a.cases)
  const totalCost = paretoRows.reduce((a, r) => a + r.cost, 0)
  let run = 0
  for (const r of paretoRows) {
    run += r.cost
    r.cumulative = totalCost ? run / totalCost : 0
  }

  const contained = recentCases.filter((c) => c.d?.D3?.done)
  const onTime = contained.filter((c) => ms(c.d.D3.at) <= dueAt(c, 'D3').getTime()).length

  return {
    samples: recent.length,
    open: recent.filter((s) => OPEN_SAMPLE.has(s.stage)).length,
    won: won.length,
    lost: lost.length,
    winRate: decided ? won.length / decided : null,
    spend,
    poUsd,
    returnPerYuan: spend ? (poUsd * fx) / spend : null,
    daysToPo,
    dwell,
    funnel,
    byCountry: Object.values(byCountry).sort((a, b) => b.samples - a.samples),
    lostReasons,
    cases: recentCases.length,
    openCases: recentCases.filter((c) => !caseClosed(c)).length,
    containedOnTime: contained.length ? { onTime, of: contained.length } : null,
    pareto: paretoRows,
    qualityCost: totalCost,
    qualityShare: poUsd ? totalCost / (poUsd * fx) : null,
  }
}

// ─── Import ─────────────────────────────────────────────────────────────────

// Map an imported sheet's columns onto sample fields by header name, in
// English or Chinese, so a factory's existing spreadsheet imports as is.
const HEADERS = {
  company: ['buyer', 'company', 'customer', 'client', '客户', '客戶', '公司', '买家', '買家'],
  contact: ['contact', 'name', '联系人', '聯絡人'],
  email: ['email', 'e-mail', '邮箱', '郵箱', '电子邮件'],
  country: ['country', '国家', '國家'],
  item: ['item', 'product', 'sample', 'description', '产品', '產品', '样品', '樣品', '品名'],
  qty: ['qty', 'quantity', '数量', '數量'],
  courier: ['courier', 'carrier', '快递', '快遞', '承运商'],
  awb: ['awb', 'tracking', 'waybill', '运单', '運單', '单号', '單號'],
  goodsCost: ['sample cost', 'goods cost', 'cost', '样品成本', '成本'],
  courierCost: ['courier cost', 'shipping cost', 'freight', '运费', '運費', '快递费'],
  notes: ['notes', 'note', 'remark', 'remarks', '备注', '備註'],
}

export function mapImport(rows) {
  if (rows.length < 2) return []
  const head = rows[0].map((h) => h.trim().toLowerCase())
  const col = {}
  const taken = new Set()
  // Exact header names first, so "courier cost" is not claimed by "cost".
  for (const loose of [false, true]) {
    for (const [field, names] of Object.entries(HEADERS)) {
      if (col[field] != null) continue
      const i = head.findIndex((h, j) => !taken.has(j) && names.some((nm) => (loose ? h.includes(nm) : h === nm)))
      if (i !== -1) { col[field] = i; taken.add(i) }
    }
  }
  if (col.company == null && col.item == null) return []
  return rows.slice(1).map((r) => {
    const get = (f) => (col[f] != null ? (r[col[f]] || '').trim() : '')
    return {
      buyer: { company: get('company'), contact: get('contact'), email: get('email'), country: toCountryCode(get('country')) },
      item: get('item'),
      qty: get('qty'),
      courier: COURIERS.find((c) => c.toLowerCase() === get('courier').toLowerCase()) || (get('courier') ? 'Other' : 'DHL'),
      awb: get('awb'),
      goodsCost: get('goodsCost'),
      courierCost: get('courierCost'),
      notes: get('notes'),
    }
  }).filter((r) => r.buyer.company || r.item)
}
