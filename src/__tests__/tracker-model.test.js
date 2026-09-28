// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  caseColumn, completeStep, dueAt, insights, mapImport, moveSample, newCase, newSample, nextDue,
  snooze, todayQueue, touch, trackingUrl, warmth,
} from '../tools/tracker/model.js'
import { parseCsv, toCsv } from '../tools/shared/csv.js'
import { compose, suggestedTemplate } from '../tools/tracker/composer.js'
import { mergeRecords, nextRef } from '../tools/shared/store.js'

const DAY = 86400000
const at = (iso) => new Date(iso).toISOString()
const sample = (over = {}) => ({ ...newSample('S-0001'), kind: 'sample', id: 's1', ...over })
const kase = (over = {}) => ({ ...newCase('NC-0001'), kind: 'case', id: 'c1', ...over })

describe('samples', () => {
  it('a landed sample is due for follow-up after 4 days, then 7', () => {
    const landed = at('2026-09-01T09:00:00Z')
    let s = sample({ stage: 'delivered', stageAt: { requested: at('2026-08-20T00:00:00Z'), delivered: landed }, lastTouchAt: landed })
    expect(nextDue(s).toISOString()).toBe(at('2026-09-05T09:00:00Z'))
    s = { ...s, lastTouchAt: at('2026-09-05T10:00:00Z'), log: [...s.log, { at: at('2026-09-05T10:00:00Z'), type: 'touch' }] }
    expect(nextDue(s).toISOString()).toBe(at('2026-09-12T10:00:00Z'))
  })

  it('warmth halves every half-life of silence', () => {
    const t0 = Date.parse('2026-09-01T00:00:00Z')
    const s = sample({ stage: 'delivered', lastTouchAt: new Date(t0).toISOString() })
    expect(warmth(s, t0)).toBe(100)
    expect(warmth(s, t0 + 6 * DAY)).toBe(50)
    expect(warmth(s, t0 + 12 * DAY)).toBe(25)
  })

  it('snoozing pushes the due date; touching clears the snooze', () => {
    const s = sample({ lastTouchAt: new Date(Date.now() - 10 * DAY).toISOString() })
    expect(nextDue(s).getTime()).toBeLessThan(Date.now())
    const later = snooze(s, 2)
    expect(nextDue(later).getTime()).toBeGreaterThan(Date.now() + DAY)
    expect(touch(later).snoozeUntil).toBe('')
  })

  it('moving a sample stamps the stage time and the log', () => {
    const s = moveSample(sample(), 'transit', { awb: '123' })
    expect(s.stage).toBe('transit')
    expect(s.stageAt.transit).toBeTruthy()
    expect(s.awb).toBe('123')
    expect(s.log.at(-1)).toMatchObject({ type: 'stage', stage: 'transit' })
  })

  it('builds carrier tracking links and escapes the number', () => {
    expect(trackingUrl('DHL', '12 34')).toContain('tracking-id=1234')
    expect(trackingUrl('FedEx', 'x')).toContain('fedex.com')
    expect(trackingUrl('SF', 'SF1<script>')).toBe('https://t.17track.net/en#nums=SF1%3Cscript%3E')
    expect(trackingUrl('DHL', '')).toBeNull()
  })
})

describe('after-sales 8D', () => {
  const opened = '2026-09-27T14:00:00Z'

  it('sets 8D due dates from the open time, with slack for minor issues', () => {
    const c = kase({ openedAt: opened, severity: 'major' })
    expect(dueAt(c, 'D3').toISOString()).toBe(at('2026-09-28T14:00:00Z'))
    expect(dueAt(c, 'D4').toISOString()).toBe(at('2026-10-07T14:00:00Z'))
    expect(dueAt({ ...c, severity: 'minor' }, 'D3').toISOString()).toBe(at('2026-09-30T14:00:00Z'))
    expect(dueAt({ ...c, severity: 'minor' }, 'D4').toISOString()).toBe(at('2026-10-07T14:00:00Z'))
  })

  it('moves across the board as steps complete', () => {
    let c = kase({ openedAt: opened })
    expect(caseColumn(c)).toBe('open')
    for (const k of ['D0', 'D1', 'D2', 'D3']) c = completeStep(c, k)
    expect(caseColumn(c)).toBe('contained')
    for (const k of ['D4', 'D5', 'D6', 'D7', 'D8']) c = completeStep(c, k)
    expect(caseColumn(c)).toBe('closed')
    expect(nextDue(c)).toBeNull()
  })

  it("puts an overdue case ahead of samples in today's queue", () => {
    const old = new Date(Date.now() - 3 * DAY).toISOString()
    const q = todayQueue([sample({ lastTouchAt: old })], [kase({ openedAt: old })])
    expect(q.map((r) => r.rec.kind)).toEqual(['case', 'sample'])
    expect(q[0].reason).toEqual({ code: 'step', step: 'D0' })
  })
})

describe('insights', () => {
  const now = Date.parse('2026-09-28T00:00:00Z')
  const d = (days) => new Date(now - days * DAY).toISOString()
  const samples = [
    sample({ id: 'a', stage: 'won', poValue: '10000', goodsCost: 300, courierCost: 200, buyer: { country: 'DE' }, stageAt: { requested: d(60), delivered: d(40), won: d(20) } }),
    sample({ id: 'b', stage: 'lost', lostReason: 'price', goodsCost: 100, courierCost: 100, buyer: { country: 'DE' }, stageAt: { requested: d(50), delivered: d(30), lost: d(10) } }),
    sample({ id: 'c', stage: 'delivered', costPolicy: 'buyer_pays', goodsCost: 999, buyer: { country: 'US' }, stageAt: { requested: d(10), delivered: d(2) } }),
  ]
  const cases = [
    kase({ id: 'x', openedAt: d(30), rootCause: 'process', costCny: '3000' }),
    kase({ id: 'y', openedAt: d(20), rootCause: 'packaging', costCny: '1000' }),
  ]
  const r = insights(samples, cases, { fx: 7, now })

  it('win rate counts only decided samples; buyer-paid samples cost nothing', () => {
    expect(r.winRate).toBe(0.5)
    expect(r.spend).toBe(700)
    expect(r.returnPerYuan).toBeCloseTo((10000 * 7) / 700, 6)
    expect(r.daysToPo).toBe(40)
  })

  it('measures time in each stage and the funnel', () => {
    expect(r.dwell.find((x) => x.stage === 'delivered').days).toBe(20)
    expect(r.funnel.map((f) => f.count)).toEqual([3, 3, 3, 1])
    expect(r.byCountry[0]).toMatchObject({ country: 'DE', samples: 2, won: 1 })
  })

  it('ranks root causes by cost, with a running share', () => {
    expect(r.pareto.map((p) => p.cause)).toEqual(['process', 'packaging'])
    expect(r.pareto[0].cumulative).toBeCloseTo(0.75)
    expect(r.qualityShare).toBeCloseTo(4000 / 70000)
  })
})

describe('csv', () => {
  it('round-trips quotes, commas and newlines, and defuses formulas', () => {
    const csv = toCsv([{ a: 'x, "y"\nz', b: '=HYPERLINK("evil")' }], [{ label: 'A', get: (r) => r.a }, { label: 'B', get: (r) => r.b }])
    const rows = parseCsv(csv)
    expect(rows[1][0]).toBe('x, "y"\nz')
    expect(rows[1][1].startsWith("'=")).toBe(true)
  })

  it('maps English and Chinese headers onto sample fields', () => {
    const rows = parseCsv('客户,国家,样品,数量,快递,运单,Courier cost,Cost\nHofmann,Germany,DN25,5,dhl,4471,120,80\n')
    const [m] = mapImport(rows)
    expect(m.buyer.company).toBe('Hofmann')
    expect(m.buyer.country).toBe('DE')
    expect(m).toMatchObject({ item: 'DN25', qty: '5', courier: 'DHL', awb: '4471', courierCost: '120', goodsCost: '80' })
  })
})

describe('composer', () => {
  it('never invents a contact name and includes the tracking link', () => {
    const s = sample({ stage: 'transit', item: 'DN25 valve', courier: 'DHL', awb: '4471', buyer: { contact: '' } })
    expect(suggestedTemplate(s)).toBe('dispatched')
    const m = compose(s, 'dispatched')
    expect(m.body.startsWith('Dear Sir or Madam,')).toBe(true)
    expect(m.body).toContain('tracking-id=4471')
    expect(m.body).toContain('[Your name]')
  })

  it('quotes the 8D dates in a case acknowledgement', () => {
    const c = kase({ openedAt: '2026-09-27T14:00:00Z', buyer: { contact: 'Erik Lindqvist' }, affectedQty: '42', totalQty: '1200' })
    const m = compose(c, 'acknowledge', { tone: 'friendly' })
    expect(m.body.startsWith('Hi Erik,')).toBe(true)
    expect(m.body).toContain('42 of 1200 pcs')
    expect(m.body).toContain('28 Sept 2026'.replace('Sept', new Date('2026-09-28').toLocaleDateString('en-GB', { month: 'short' })))
  })
})

describe('store', () => {
  it('keeps the newest edit of each record', () => {
    const local = [{ id: '1', v: 'local', updatedAt: '2026-09-02T00:00:00Z' }, { id: '2', v: 'local', updatedAt: '2026-09-01T00:00:00Z' }]
    const remote = [{ id: '1', v: 'remote', updatedAt: '2026-09-01T00:00:00Z' }, { id: '2', v: 'remote', updatedAt: '2026-09-03T00:00:00Z' }, { id: '3', v: 'remote', updatedAt: '2026-09-01T00:00:00Z' }]
    const m = Object.fromEntries(mergeRecords(local, remote).map((r) => [r.id, r.v]))
    expect(m).toEqual({ 1: 'local', 2: 'remote', 3: 'remote' })
  })

  it('numbers references after the highest one in use', () => {
    expect(nextRef('S-', [{ ref: 'S-0007' }, { ref: 'S-0003' }])).toBe('S-0008')
    expect(nextRef('Q-2026-', [{ number: 'Q-2026-0142' }], 'number')).toBe('Q-2026-0143')
    expect(nextRef('NC-', [])).toBe('NC-0001')
  })
})
