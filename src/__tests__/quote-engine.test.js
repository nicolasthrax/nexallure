// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { bestWall, packInto, spareRoom } from '../tools/quote/packing.js'
import { blankLine, breakEvenRate, computeQuote, containerBreaks, fillSuggestion, marginAt, newQuote, sensitivity } from '../tools/quote/engine.js'

const carton = { cartonL: 48, cartonW: 36, cartonH: 30, cartonKg: 24.5, perCarton: 50 }

// A quote with every cost switched off, so a price can be checked by hand.
function bare(overrides = {}) {
  const q = newQuote('Q-TEST')
  return {
    ...q,
    fx: { ...q.fx, USD: 7 },
    overhead: 0,
    margin: 20,
    payment: 'TT_ADVANCE',
    bankFlat: 0,
    capitalRate: 0,
    decimals: 4,
    lines: [{ ...q.lines[0], name: 'Valve', unitCost: 113, qty: 1000, rebateRate: 13, ...carton }],
    ...overrides,
  }
}

describe('packing', () => {
  it('finds the densest wall for a carton, mixing orientations (hand-checked)', () => {
    // 480 mm deep. 3 columns 300 wide x 6 high (360) + 4 columns 360 wide x
    // 7 high (300) = 18 + 28 = 46 cartons, using 2340 of 2352 mm across.
    // One orientation alone manages 42.
    const w = bestWall(carton, '20GP')
    expect(w.perWall).toBe(46)
    expect(w.depth).toBe(480)
    const across = w.regions.reduce((s, r) => s + r.cols * r.a, 0)
    expect(across).toBeLessThanOrEqual(2352)
    for (const r of w.regions) expect(r.rows * r.u).toBeLessThanOrEqual(2393 - 30)
  })

  it('loads 12 walls = 552 cartons of that carton in a 20GP', () => {
    const boxes = packInto([{ ...carton, qty: 552 * 50 }], '20GP')
    expect(boxes).toHaveLength(1)
    expect(boxes[0].cartons).toBe(552)
    const over = packInto([{ ...carton, qty: 553 * 50 }], '20GP')
    expect(over).toHaveLength(2)
  })

  it('chooses walls by the length a line really needs, not density alone', () => {
    // Two lines that only share one 20GP when each picks the wall that wastes
    // the least floor for its own count.
    const a = { ...carton, qty: 12000 }
    const b = { cartonL: 52, cartonW: 40, cartonH: 34, cartonKg: 26, perCarton: 20, qty: 4000 }
    const boxes = packInto([a, b], '20GP')
    expect(boxes).toHaveLength(1)
    expect(boxes[0].cartons).toBe(440)
  })

  it('respects "this side up"', () => {
    // 130 cm tall: only one fits upright under the roof, five fit lying down.
    const tall = { cartonL: 40, cartonW: 40, cartonH: 130, cartonKg: 5, perCarton: 1 }
    expect(bestWall(tall, '20GP').dims[2]).toBe(400)
    expect(bestWall({ ...tall, upright: true }, '20GP').dims[2]).toBe(1300)
  })

  it('stops at the payload limit before the box is full', () => {
    const heavy = { ...carton, cartonKg: 100, qty: 504 * 50 }
    const boxes = packInto([heavy], '20GP', 20000)
    expect(boxes[0].cartons).toBe(200)
    expect(boxes[0].kg).toBeLessThanOrEqual(20000)
  })

  it('rejects a carton taller than the door when it must stay upright', () => {
    const odd = { cartonL: 100, cartonW: 100, cartonH: 235, cartonKg: 10, perCarton: 1, upright: true }
    expect(bestWall(odd, '20GP')).toBeNull()
    expect(bestWall(odd, '40HQ')).not.toBeNull()
  })

  it('reports spare room in a part-filled box', () => {
    const [box] = packInto([{ ...carton, qty: 400 * 50 }], '20GP')
    // 400 cartons: 9 walls (the last holds 32 of 46), 1528 mm left = 3 walls.
    expect(spareRoom([{ ...carton, qty: 400 * 50 }], box)[0]).toBe(152)
  })
})

describe('pricing', () => {
  it('prices FOB for a manufacturer at the full 13% rebate (hand-checked)', () => {
    // ¥113 incl. VAT = ¥100 ex VAT. No VAT leak at 13%. 20% margin on price:
    // 100 / 0.8 = ¥125 = $17.857.
    const r = computeQuote(bare())
    expect(r.quoteTerm).toBe('FOB')
    expect(r.lines[0].price).toBeCloseTo(17.8571, 4)
    expect(r.margin).toBeCloseTo(0.2, 4)
  })

  it('charges a manufacturer the VAT gap on the FOB value (免抵退)', () => {
    // P = 100 + 0.04P + 0.2P  ->  P = 100 / 0.76 = ¥131.58 = $18.797
    const r = computeQuote(bare({ lines: [{ ...bare().lines[0], rebateRate: 9 }] }))
    expect(r.lines[0].price).toBeCloseTo(100 / 0.76 / 7, 3)
  })

  it('charges a trading company the VAT gap on its purchase cost (免退)', () => {
    // Cost = 100 x (1 + 0.13 - 0.09) = ¥104; / 0.8 = ¥130 = $18.571
    const r = computeQuote(bare({ entity: 'trader', lines: [{ ...bare().lines[0], rebateRate: 9 }] }))
    expect(r.lines[0].price).toBeCloseTo(130 / 7, 3)
    expect(r.rebate).toBeCloseTo(100 * 0.09 * 1000, 2)
  })

  it('supports markup on cost as well as margin on price', () => {
    const r = computeQuote(bare({ marginBasis: 'cost' }))
    expect(r.lines[0].price).toBeCloseTo(120 / 7, 3)
  })

  it('grosses CIF up for insurance on 110% of CIF', () => {
    const q = bare({
      term: 'CIF',
      insuranceRate: 0.5,
      rates: { ...bare().rates, LCL: { freight: 50, origin: 0, haulage: 0, dest: 0, delivery: 0 } },
    })
    const r = computeQuote(q)
    // 1000 units in 20 cartons = 1.0368 m3 -> 1.0368 W/M x $50 = $51.84 total.
    const freightPerUnit = (1.0368 * 50 * 7) / 1000
    const expected = (100 + freightPerUnit) / (1 - 1.1 * 0.005 - 0.2) / 7
    expect(r.lines[0].price).toBeCloseTo(expected, 3)
    expect(r.lines[0].parts.insurance).toBeCloseTo(1.1 * 0.005 * r.lines[0].price * 7, 3)
  })

  it('puts duty on FOB value for the US and on CIF value for the EU', () => {
    const base = {
      term: 'DDP',
      insuranceRate: 0,
      rates: { ...bare().rates, LCL: { freight: 500, origin: 0, haulage: 0, dest: 0, delivery: 0 } },
      lines: [{ ...bare().lines[0], dutyRate: 10 }],
    }
    const us = computeQuote(bare({ ...base, destCountry: 'US', valuation: 'FOB', importVat: 0, importFees: 0 }))
    const eu = computeQuote(bare({ ...base, destCountry: 'DE', valuation: 'CIF', importVat: 0, importFees: 0 }))
    const usParts = us.lines[0].parts
    const euParts = eu.lines[0].parts
    const usFob = us.lines[0].price * 7 - usParts.duty - usParts.freight
    expect(usParts.duty).toBeCloseTo(usFob * 0.1, 3)
    expect(euParts.duty).toBeCloseTo((eu.lines[0].price * 7 - euParts.duty) * 0.1, 3)
    expect(euParts.duty).toBeGreaterThan(usParts.duty)
  })

  it('keeps the ladder in order: each term costs at least the one before', () => {
    const q = bare({
      insuranceRate: 0.2,
      exportDocs: 300,
      importBroker: 150,
      importVat: 19,
      lines: [{ ...bare().lines[0], dutyRate: 2.2, qty: 12000 }],
      rates: { ...bare().rates, '20GP': { freight: 1450, origin: 1600, haulage: 1800, dest: 380, delivery: 420 } },
    })
    const r = computeQuote(q)
    const totals = r.ladder.map((x) => x.total)
    for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeGreaterThanOrEqual(totals[i - 1])
    expect(r.ladder.map((x) => x.term)).toEqual(['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'])
  })

  it('uses a hand-typed price and reports the margin it earns', () => {
    const q = bare()
    q.lines[0].price = 20
    const r = computeQuote(q)
    expect(r.lines[0].price).toBe(20)
    expect(r.margin).toBeCloseTo(1 - 100 / 140, 4)
  })

  it('switches to any-mode terms for air freight', () => {
    const q = bare({ term: 'FOB', rates: { ...bare().rates, AIR: { freight: 4, origin: 0, haulage: 0, dest: 0, delivery: 0 } } })
    const r = computeQuote(q)
    expect(r.terms).toContain('CPT')
    expect(r.terms).not.toContain('FOB')
    expect(r.warnings.some((w) => w.code === 'sea_term_air')).toBe(true)
  })
})

describe('money checks', () => {
  it('换汇成本 equals the break-even exchange rate', () => {
    const q = bare()
    const r = computeQuote(q)
    expect(r.exchangeCost).toBeCloseTo(100 / r.lines[0].price, 3)
    expect(breakEvenRate(q, r)).toBeCloseTo(r.exchangeCost, 2)
  })

  it('a stronger yuan cuts the margin; freight does not touch an FOB quote', () => {
    const q = bare({ rates: { ...bare().rates, LCL: { freight: 60, origin: 0, haulage: 0, dest: 0, delivery: 0 } } })
    const r = computeQuote(q)
    expect(marginAt(q, r, { fxScale: 0.95 })).toBeLessThan(r.margin)
    const grid = sensitivity(q, r)
    const col = grid.map((row) => row.cells[3].margin)
    for (const m of col) expect(m).toBeCloseTo(col[0], 9)
  })

  it('finance cost follows the payment term', () => {
    const tt = computeQuote(bare({ payment: 'TT_ADVANCE', capitalRate: 6 }))
    const lc = computeQuote(bare({ payment: 'LC_60', capitalRate: 6, bankFlat: '' }))
    expect(tt.financingCny).toBe(0)
    expect(lc.lines[0].price).toBeGreaterThan(tt.lines[0].price)
  })
})

describe('container suggestions', () => {
  const q = bare({
    lines: [{ ...bare().lines[0], qty: 400 * 50 }],
    rates: { ...bare().rates, '20GP': { freight: 1400, origin: 0, haulage: 0, dest: 0, delivery: 0 }, '40HQ': { freight: 2400, origin: 0, haulage: 0, dest: 0, delivery: 0 } },
  })

  it('suggests the cartons that fill the last box', () => {
    const r = computeQuote(q)
    expect(r.plan.id).toBe('1x20GP')
    const s = fillSuggestion(q, r)
    expect(s.cartons).toBe(152)
    expect(s.newQty).toBe(552 * 50)
    expect(s.freightDrop).toBeCloseTo(1 - 400 / 552, 3)
  })

  it('prices full-container quantities', () => {
    const breaks = containerBreaks(q)
    const twenty = breaks.find((b) => b.type === '20GP')
    expect(twenty.lines[0].qty).toBe(552 * 50)
    // A 40HQ of 24.5 kg cartons runs out of payload (26.5 t) before space.
    const hq = breaks.find((b) => b.type === '40HQ')
    const cartons = hq.lines[0].qty / 50
    expect(cartons * 24.5).toBeLessThanOrEqual(26500)
    expect((cartons + 1) * 24.5).toBeGreaterThan(26500)
  })

  it('keeps load plan indexes on the right line when an earlier line is blank', () => {
    const withBlank = { ...q, lines: [blankLine(), ...q.lines] }
    const r = computeQuote(withBlank)
    expect(r.plan.boxes[0].blocks[0].index).toBe(1)
    expect(fillSuggestion(withBlank, r).index).toBe(1)
  })
})
