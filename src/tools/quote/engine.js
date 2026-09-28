// The export quoting engine. Pure functions only: every number the Quote Desk
// shows comes from computeQuote(), so it can be tested without a browser.
//
// Money is carried in CNY internally. Freight is entered in USD (that is how
// forwarders quote) and converted with the user's USD rate; the result is
// converted to the quote currency at the very end.
//
// Each Incoterm is priced as its own quote, the way Chinese export desks are
// taught to do it: the target margin is a share of *that* term's price, so a
// CIF price is not simply FOB plus freight; the margin applies to the freight
// too.

import { AIR_KG_PER_CBM, CONTAINER_TYPES, cartonCbm, cartonCount, packInto, shipmentTotals, spareRoom } from './packing.js'
import { ANY_MODE_TERMS, PAYMENT_TERMS, SEA_ONLY, SEA_TERMS, TERM_ADDS, destination } from './presets.js'

const num = (v, d = 0) => {
  const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : d
}
const pct = (v) => num(v) / 100

// ─── Shipping plans ─────────────────────────────────────────────────────────

function modeRates(q, mode) {
  const r = q.rates?.[mode] || {}
  return {
    freight: num(r.freight),
    origin: num(r.origin),
    haulage: num(r.haulage),
    dest: num(r.dest),
    delivery: num(r.delivery),
  }
}

// A plan's cost split into the components each Incoterm picks up. All CNY.
function planCosts(q, plan, fxUSD) {
  const c = { haulage: 0, docs: num(q.exportDocs), origin: 0, freight: 0, dest: 0, delivery: 0, broker: num(q.importBroker) * fxUSD }
  for (const part of plan.parts) {
    const r = modeRates(q, part.mode)
    const u = part.units
    if (part.mode === 'LCL' || part.mode === 'AIR') {
      c.freight += r.freight * u * fxUSD
      c.origin += r.origin * u
      c.dest += r.dest * u * fxUSD
      c.haulage += r.haulage
      c.delivery += r.delivery * fxUSD
    } else {
      c.freight += r.freight * u * fxUSD
      c.origin += r.origin * u
      c.dest += r.dest * u * fxUSD
      c.haulage += r.haulage * u
      c.delivery += r.delivery * u * fxUSD
    }
  }
  return c
}

const wm = (cbm, kg) => Math.max(cbm, kg / 1000, 1)
const airKg = (cbm, kg) => Math.max(kg, cbm * AIR_KG_PER_CBM)

// Every realistic way to move the cargo, cheapest first by freight + origin +
// haulage (the costs the seller always sees up to FOB/CFR).
function shippingPlans(q) {
  // Keep every line, even empty ones: block and allocation indexes must match
  // q.lines. packInto skips lines without cartons.
  const lines = q.lines || []
  const totals = shipmentTotals(lines)
  if (!lines.some((l) => cartonCount(l) > 0)) return []
  const fxUSD = num(q.fx?.USD, 7)
  const plans = []
  const offered = (mode) => num(q.rates?.[mode]?.freight) > 0

  if (offered('LCL')) {
    plans.push({ id: 'LCL', parts: [{ mode: 'LCL', units: wm(totals.cbm, totals.kg) }], boxes: [] })
  }
  if (offered('AIR')) {
    plans.push({ id: 'AIR', parts: [{ mode: 'AIR', units: airKg(totals.cbm, totals.kg) }], boxes: [] })
  }
  for (const type of CONTAINER_TYPES) {
    if (!offered(type)) continue
    const boxes = packInto(lines, type, q.payloadLimit)
    if (!boxes || !boxes.length) continue
    plans.push({ id: `${boxes.length}x${type}`, parts: [{ mode: type, units: boxes.length }], boxes })

    // Several boxes: the last one may be better as a smaller box or LCL.
    if (boxes.length > 1) {
      const last = boxes[boxes.length - 1]
      const rest = lines.map((l, i) => ({ ...l, qty: last.blocks.filter((b) => b.index === i).reduce((s, b) => s + b.cartons, 0) * Math.max(1, Math.floor(num(l.perCarton, 1))) }))
      const head = { mode: type, units: boxes.length - 1 }
      if (type !== '20GP' && offered('20GP')) {
        const tail = packInto(rest, '20GP', q.payloadLimit)
        if (tail && tail.length === 1) plans.push({ id: `${boxes.length - 1}x${type}+1x20GP`, parts: [head, { mode: '20GP', units: 1 }], boxes: [...boxes.slice(0, -1), ...tail] })
      }
      if (offered('LCL')) {
        plans.push({ id: `${boxes.length - 1}x${type}+LCL`, parts: [head, { mode: 'LCL', units: wm(last.cbm, last.kg) }], boxes: boxes.slice(0, -1) })
      }
    }
  }
  for (const p of plans) {
    p.costs = planCosts(q, p, fxUSD)
    p.toPort = p.costs.freight + p.costs.origin + p.costs.haulage
    p.air = p.parts.some((x) => x.mode === 'AIR')
  }
  plans.sort((a, b) => a.toPort - b.toPort)
  return plans
}

// ─── Allocation ─────────────────────────────────────────────────────────────

// Shipment costs are shared between lines by what drives them: volume for
// sea freight, chargeable weight for air.
function allocationShares(lines, air) {
  const basis = lines.map((l) => {
    const n = cartonCount(l)
    const cbm = n * cartonCbm(l)
    const kg = n * num(l.cartonKg)
    return air ? airKg(cbm, kg) : Math.max(cbm, kg / 1000)
  })
  const sum = basis.reduce((a, b) => a + b, 0)
  if (sum > 0) return basis.map((b) => b / sum)
  const qty = lines.map((l) => num(l.qty))
  const qsum = qty.reduce((a, b) => a + b, 0) || 1
  return qty.map((x) => x / qsum)
}

// ─── Price build-up for one line at one term ────────────────────────────────

function financingShare(q) {
  const term = PAYMENT_TERMS[q.payment] || PAYMENT_TERMS.TT_30_70_BL
  const tranches = q.paymentDays?.length === term.tranches.length
    ? term.tranches.map(([share], i) => [share, num(q.paymentDays[i])])
    : term.tranches
  const rate = pct(q.capitalRate)
  return tranches.reduce((s, [share, days]) => s + share * Math.max(0, days) * rate / 365, 0)
}

function paymentBank(q) {
  const term = PAYMENT_TERMS[q.payment] || PAYMENT_TERMS.TT_30_70_BL
  return {
    pct: q.bankPct === '' || q.bankPct == null ? term.bankPct : num(q.bankPct),
    flat: q.bankFlat === '' || q.bankFlat == null ? term.bankFlat : num(q.bankFlat),
  }
}

// Everything that goes into one unit at term `term` when it sells for `p`
// (CNY). Returns the cost parts; profit is p minus their sum.
function decompose(ctx, li, term, p) {
  const { q, lineFixed, vat } = ctx
  const line = ctx.lines[li]
  const r = pct(line.rebateRate)
  const adds = new Set(TERM_ADDS[term])
  const f = lineFixed[li]

  const exVat = line.costIncludesVat === false ? num(line.unitCost) : num(line.unitCost) / (1 + vat)
  const parts = {
    goods: exVat,
    overhead: exVat * pct(q.overhead),
    traderVat: q.entity === 'trader' ? exVat * Math.max(0, vat - r) : 0,
    haulage: adds.has('haulage') ? f.haulage : 0,
    docs: adds.has('docs') ? f.docs : 0,
    origin: adds.has('origin') ? f.origin : 0,
    freight: adds.has('freight') ? f.freight : 0,
    dest: adds.has('dest') ? f.dest : 0,
    delivery: adds.has('delivery') ? f.delivery : 0,
    broker: adds.has('broker') ? f.broker : 0,
    insurance: 0,
    duty: 0,
    importFees: 0,
    importVat: 0,
    commission: p * ctx.commission,
    sinosure: p * ctx.sinosure,
    bank: p * ctx.bankPct + f.bankFlat,
    financing: p * ctx.financing,
    mfgVat: 0,
  }

  // Work back from the price to the CIF value it contains. Duty and import
  // VAT are charged on CIF (or FOB), and insurance on 110% of CIF, so this is
  // circular; it converges in a handful of steps because every rate is < 1.
  const post = parts.dest + parts.delivery + parts.broker
  let cif = p
  let ins = 0
  let duty = 0
  let fees = 0
  let ivat = 0
  const insured = adds.has('insurance')
  const ddp = adds.has('duty')
  for (let k = 0; k < 40; k++) {
    ins = insured ? ctx.insMarkup * ctx.insRate * cif : 0
    if (ddp) {
      const customs = ctx.valuation === 'FOB' ? cif - parts.freight - ins : cif
      duty = customs * pct(line.dutyRate)
      fees = customs * ctx.importFees
      ivat = ctx.vatRecoverable ? 0 : ctx.importVat * (cif + duty + fees + (ctx.valuation === 'CIF' ? parts.dest + parts.delivery : 0))
    }
    // Past CIF (DAP, DDP) the price also carries destination costs and taxes.
    const nextCif = adds.has('dest') ? p - post - duty - fees - ivat : p
    if (Math.abs(nextCif - cif) < 1e-9) break
    cif = nextCif
  }
  parts.insurance = ins
  parts.duty = duty
  parts.importFees = fees
  parts.importVat = ivat

  // Manufacturers (免抵退) cannot credit the VAT gap between 13% and the
  // rebate rate; it is charged on the FOB value the customs form declares.
  if (q.entity !== 'trader') {
    const fobValue = adds.has('freight') ? cif - parts.freight - ins : p
    parts.mfgVat = Math.max(0, vat - r) * Math.max(0, fobValue)
  }
  const cost = Object.values(parts).reduce((a, b) => a + b, 0)
  return { parts, cost, profit: p - cost, cif }
}

// Solve for the price that earns the target margin. Everything above is
// linear in p, so the secant method lands on the exact root.
function solvePrice(ctx, li, term, margin) {
  const target = (d, p) => (ctx.q.marginBasis === 'cost' ? margin * (d.cost) : margin * p)
  const h = (p) => {
    const d = decompose(ctx, li, term, p)
    return d.profit - target(d, p)
  }
  let p0 = 0
  let p1 = Math.max(1, decompose(ctx, li, term, 0).cost * 2)
  let h0 = h(p0)
  let h1 = h(p1)
  for (let k = 0; k < 8 && Math.abs(h1) > 1e-9; k++) {
    if (h1 === h0) break
    const p2 = p1 - (h1 * (p1 - p0)) / (h1 - h0)
    p0 = p1; h0 = h1
    p1 = p2; h1 = h(p1)
  }
  return p1
}

// ─── The whole quote ────────────────────────────────────────────────────────

function context(q, plan, { fxScale = 1, freightScale = 1 } = {}) {
  const lines = q.lines || []
  const fxUSD = num(q.fx?.USD, 7) * fxScale
  const fxQuote = (q.currency === 'USD' ? num(q.fx?.USD, 7) : num(q.fx?.[q.currency], 7)) * fxScale
  const dest = destination(q.destCountry)
  const bank = paymentBank(q)
  const shares = allocationShares(lines, plan?.air)
  const costs = plan ? planCosts(q, plan, fxUSD) : { haulage: 0, docs: num(q.exportDocs), origin: 0, freight: 0, dest: 0, delivery: 0, broker: num(q.importBroker) * fxUSD }
  costs.freight *= freightScale
  const lineFixed = lines.map((l, i) => {
    const qty = num(l.qty)
    const per = (x) => (qty > 0 ? (x * shares[i]) / qty : 0)
    return {
      haulage: per(costs.haulage), docs: per(costs.docs), origin: per(costs.origin), freight: per(costs.freight),
      dest: per(costs.dest), delivery: per(costs.delivery), broker: per(costs.broker),
      bankFlat: per(bank.flat * fxUSD),
    }
  })
  return {
    q, lines, lineFixed, fxUSD, fxQuote,
    vat: pct(q.vatRate ?? 13),
    commission: pct(q.commission),
    sinosure: pct(q.sinosure),
    bankPct: pct(bank.pct),
    financing: financingShare(q),
    insRate: pct(q.insuranceRate),
    insMarkup: num(q.insuranceMarkup, 110) / 100,
    valuation: q.valuation || dest.valuation,
    importVat: pct(q.importVat ?? dest.vat),
    importFees: pct(q.importFees ?? dest.fees ?? 0),
    vatRecoverable: !!q.vatRecoverable,
  }
}

export const round = (v, dp) => {
  const f = 10 ** dp
  return Math.round(v * f + Number.EPSILON * f) / f
}

function termsFor(plan) {
  return plan?.air ? ANY_MODE_TERMS : SEA_TERMS
}

export function computeQuote(q) {
  const plans = shippingPlans(q)
  const plan = plans.find((p) => p.id === q.planId) || plans[0] || null
  const ctx = context(q, plan)
  const lines = ctx.lines
  const terms = termsFor(plan)
  const quoteTerm = terms.includes(q.term) ? q.term : terms.includes('FOB') ? 'FOB' : 'FCA'
  // A margin of 100% of the price has no solution; cap it well below.
  const target = q.marginBasis === 'cost' ? Math.max(0, pct(q.margin)) : Math.min(Math.max(0, pct(q.margin)), 0.9)
  const dp = Math.max(0, Math.min(4, Math.floor(num(q.decimals, 2))))
  const fxQ = ctx.fxQuote || 1

  // Quoted price per line: the user's own figure if they typed one, else the
  // solved price rounded to invoice precision.
  const quoted = lines.map((l, i) => {
    const override = num(l.price, NaN)
    if (Number.isFinite(override) && override > 0) return override
    return round(solvePrice(ctx, i, quoteTerm, target) / fxQ, dp)
  })

  const lineResults = lines.map((l, i) => {
    const qty = num(l.qty)
    const d = decompose(ctx, i, quoteTerm, quoted[i] * fxQ)
    const margin = ctx.q.marginBasis === 'cost' ? d.profit / (d.cost || 1) : d.profit / (quoted[i] * fxQ || 1)
    return { qty, price: quoted[i], amount: quoted[i] * qty, parts: d.parts, cost: d.cost, profit: d.profit, margin, cif: d.cif }
  })
  const revenue = lineResults.reduce((s, r) => s + r.amount * fxQ, 0)
  const profit = lineResults.reduce((s, r) => s + r.profit * r.qty, 0)
  const costSum = lineResults.reduce((s, r) => s + r.cost * r.qty, 0)
  const achieved = q.marginBasis === 'cost' ? profit / (costSum || 1) : profit / (revenue || 1)

  // The other terms, priced at the margin the quoted price actually earns,
  // so rounding or a hand-typed price carries through the whole ladder.
  const ladder = terms.map((term) => {
    const prices = lines.map((_, i) => round(solvePrice(ctx, i, term, achieved) / fxQ, dp))
    const total = prices.reduce((s, p, i) => s + p * num(lines[i].qty), 0)
    const parts = lines.map((_, i) => decompose(ctx, i, term, prices[i] * fxQ).parts)
    return { term, prices, total, parts }
  })

  // 换汇成本: yuan spent for each unit of foreign currency earned at FOB (or
  // FCA on air). Below today's rate = profitable.
  const fobTerm = terms.includes('FOB') ? 'FOB' : 'FCA'
  const fobRung = ladder.find((x) => x.term === fobTerm)
  let fobCost = 0
  let fobNet = 0
  lines.forEach((l, i) => {
    const qty = num(l.qty)
    const d = decompose(ctx, i, fobTerm, fobRung.prices[i] * fxQ)
    fobCost += (d.cost - d.parts.commission) * qty
    fobNet += (fobRung.prices[i] - d.parts.commission / fxQ) * qty
  })
  const exchangeCost = fobNet > 0 ? fobCost / fobNet : 0

  const fobValueCny = fobRung.total * fxQ
  const vat = ctx.vat
  const rebate = q.entity === 'trader'
    ? lines.reduce((s, l) => s + (l.costIncludesVat === false ? num(l.unitCost) : num(l.unitCost) / (1 + vat)) * pct(l.rebateRate) * num(l.qty), 0)
    : lines.reduce((s, l, i) => s + fobRung.prices[i] * fxQ * num(l.qty) * pct(l.rebateRate), 0)
  const nonCreditable = q.entity === 'trader'
    ? lineResults.reduce((s, r) => s + r.parts.traderVat * r.qty, 0)
    : lines.reduce((s, l, i) => s + fobRung.prices[i] * fxQ * num(l.qty) * Math.max(0, vat - pct(l.rebateRate)), 0)

  return {
    plans, plan, terms, quoteTerm, lines: lineResults, ladder,
    total: lineResults.reduce((s, r) => s + r.amount, 0),
    revenueCny: revenue, profitCny: profit, margin: achieved,
    exchangeCost, fxQuote: fxQ, fobValueCny, rebate, nonCreditable,
    logistics: ctx.lineFixed.map((f) => ({ ...f, toPort: f.haulage + f.docs + f.origin + f.freight })),
    financingCny: lineResults.reduce((s, r) => s + r.parts.financing * r.qty, 0),
    shipment: shipmentTotals(lines.filter((l) => cartonCount(l) > 0)),
    warnings: warnings(q, plan, plans, quoteTerm, achieved),
  }
}

// Margin earned by fixed quoted prices if the yuan or freight moves.
export function marginAt(q, result, { fxScale = 1, freightScale = 1 }) {
  const ctx = context(q, result.plan, { fxScale, freightScale })
  let profit = 0
  let revenue = 0
  let cost = 0
  result.lines.forEach((r, i) => {
    const p = r.price * ctx.fxQuote
    const d = decompose(ctx, i, result.quoteTerm, p)
    profit += d.profit * r.qty
    revenue += p * r.qty
    cost += d.cost * r.qty
  })
  return q.marginBasis === 'cost' ? profit / (cost || 1) : profit / (revenue || 1)
}

export function sensitivity(q, result, fxSteps = [-6, -4, -2, 0, 2, 4, 6], freightSteps = [-30, -15, 0, 25, 50]) {
  return freightSteps.map((fr) => ({
    freight: fr,
    cells: fxSteps.map((fx) => ({ fx, margin: marginAt(q, result, { fxScale: 1 + fx / 100, freightScale: 1 + fr / 100 }) })),
  }))
}

// The exchange rate at which the quoted prices stop making money.
export function breakEvenRate(q, result) {
  let lo = 0.3
  let hi = 1
  if (marginAt(q, result, { fxScale: hi }) <= 0) return null
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2
    if (marginAt(q, result, { fxScale: mid }) > 0) hi = mid
    else lo = mid
  }
  return hi * result.fxQuote
}

// ─── Fill the box ───────────────────────────────────────────────────────────

// If the last container has room, which line should grow to fill it, and
// what that does to freight per unit. Rounded to whole cartons.
export function fillSuggestion(q, result) {
  const plan = result.plan
  if (!plan || !plan.boxes.length || plan.parts.some((p) => p.mode === 'LCL' || p.mode === 'AIR')) return null
  const last = plan.boxes[plan.boxes.length - 1]
  if (last.volumeFill > 0.97 || last.weightFill > 0.97) return null
  const lines = q.lines || []
  const room = spareRoom(lines, last)
  let best = null
  room.forEach((cartons, i) => {
    if (!cartons) return
    const per = Math.max(1, Math.floor(num(lines[i].perCarton, 1)))
    const addQty = cartons * per
    const value = addQty * result.lines[i].price
    if (!best || value > best.value) best = { index: i, cartons, addQty, value }
  })
  if (!best) return null
  // Re-price with the bigger quantity to be sure it still fits the same plan.
  const grown = { ...q, planId: plan.id, lines: lines.map((l, i) => (i === best.index ? { ...l, qty: num(l.qty) + best.addQty, price: '' } : { ...l, price: '' })) }
  const after = computeQuote(grown)
  if (!after.plan || after.plan.id !== plan.id) return null
  // Freight to the destination port per unit, whatever term is quoted.
  const freightNow = result.logistics[best.index].toPort
  const freightAfter = after.logistics[best.index].toPort
  return {
    ...best,
    newQty: num(lines[best.index].qty) + best.addQty,
    freightDrop: freightNow > 0 ? 1 - freightAfter / freightNow : 0,
    volumeFill: after.plan.boxes[after.plan.boxes.length - 1].volumeFill,
  }
}

// ─── Quantity breaks by container ───────────────────────────────────────────

// Scale every line by the same factor until the cargo exactly fills one box
// of each type. Gives the buyer a price ladder they can act on.
export function containerBreaks(q) {
  const lines = (q.lines || []).filter((l) => cartonCount(l) > 0)
  if (!lines.length) return []
  const scaled = (s) => lines.map((l) => ({ ...l, qty: Math.max(1, Math.floor(num(l.qty) * s)), price: '' }))
  const out = []
  for (const type of CONTAINER_TYPES) {
    if (!(num(q.rates?.[type]?.freight) > 0)) continue
    const fits = (s) => {
      const b = packInto(scaled(s), type, q.payloadLimit)
      return b && b.length <= 1
    }
    if (!fits(0)) continue
    let lo = 0
    let hi = 1
    while (fits(hi) && hi < 1e6) { lo = hi; hi *= 2 }
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2
      if (fits(mid)) lo = mid
      else hi = mid
    }
    // Snap each line down to whole cartons.
    const full = lines.map((l) => {
      const per = Math.max(1, Math.floor(num(l.perCarton, 1)))
      return { ...l, qty: Math.max(per, Math.floor((num(l.qty) * lo) / per) * per), price: '' }
    })
    const res = computeQuote({ ...q, lines: full, planId: `1x${type}` })
    if (res.plan?.id !== `1x${type}`) continue
    out.push({ type, scale: lo, lines: res.lines.map((r, i) => ({ name: full[i].name, qty: r.qty, price: r.price })), total: res.total, fill: res.plan.boxes[0].volumeFill })
  }
  return out
}

// ─── Warnings ───────────────────────────────────────────────────────────────

function warnings(q, plan, plans, term, margin) {
  const w = []
  const lines = q.lines || []
  if (!lines.length) return w
  lines.forEach((l, i) => {
    // A line nobody has started filling in is not an error yet.
    if (!l.name && !num(l.qty) && !num(l.unitCost)) return
    const per = Math.max(1, Math.floor(num(l.perCarton, 1)))
    const qty = num(l.qty)
    if (qty > 0 && qty % per) w.push({ code: 'part_carton', line: i, n: qty % per })
    if (num(l.rebateRate) > num(q.vatRate ?? 13)) w.push({ code: 'rebate_gt_vat', line: i })
    if (!(num(l.cartonL) > 0 && num(l.cartonW) > 0 && num(l.cartonH) > 0)) w.push({ code: 'no_carton', line: i })
    if (term === 'DDP' && !(num(l.dutyRate) > 0)) w.push({ code: 'ddp_no_duty', line: i })
  })
  if (!(num(q.fx?.USD) > 0) || !(num(q.fx?.[q.currency]) > 0)) w.push({ code: 'no_fx' })
  if (!plan && lines.some((l) => cartonCount(l) > 0)) w.push({ code: 'no_plan' })
  if (plan?.air && SEA_ONLY.has(q.term)) w.push({ code: 'sea_term_air', term: q.term })
  if (plan && !plan.air && SEA_ONLY.has(term) && plan.boxes.length) w.push({ code: 'fca_hint' })
  const priced = lines.some((l) => num(l.qty) > 0 && num(l.unitCost) > 0)
  if (priced && Number.isFinite(margin) && margin < pct(q.marginFloor ?? 10)) w.push({ code: 'below_floor' })
  const lcl = plans.find((p) => p.id === 'LCL')
  if (plan?.id === 'LCL' && lcl && shipmentTotals(lines).cbm > 15) w.push({ code: 'lcl_big' })
  return w
}

// ─── A new quote ────────────────────────────────────────────────────────────

export function blankLine() {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: '', spec: '', hs: '', unitCost: '', costIncludesVat: true, qty: '', perCarton: '',
    cartonL: '', cartonW: '', cartonH: '', cartonKg: '', rebateRate: 13, dutyRate: '', upright: false, price: '',
  }
}

export function newQuote(number) {
  const today = new Date()
  return {
    number,
    rev: 1,
    status: 'draft',
    issuedAt: today.toISOString().slice(0, 10),
    validDays: 14,
    leadDays: 35,
    buyer: { company: '', contact: '', city: '', country: 'DE' },
    seller: { company: '', address: '', email: '', phone: '' },
    entity: 'manufacturer',
    vatRate: 13,
    lines: [blankLine()],
    origin: 'Ningbo · CNNGB',
    originPlace: '',
    destCountry: 'DE',
    destPort: 'Hamburg · DEHAM',
    destPlace: '',
    valuation: 'CIF',
    importVat: 19,
    importFees: 0,
    vatRecoverable: false,
    rates: {
      LCL: { freight: '', origin: '', haulage: '', dest: '', delivery: '' },
      '20GP': { freight: '', origin: '', haulage: '', dest: '', delivery: '' },
      '40GP': { freight: '', origin: '', haulage: '', dest: '', delivery: '' },
      '40HQ': { freight: '', origin: '', haulage: '', dest: '', delivery: '' },
      AIR: { freight: '', origin: '', haulage: '', dest: '', delivery: '' },
    },
    exportDocs: '',
    importBroker: '',
    payloadLimit: '',
    insuranceRate: 0.15,
    insuranceMarkup: 110,
    currency: 'USD',
    // ECB reference rates of 25 Sep 2026 as a starting point; the desk can
    // fetch the latest or take the rate the bank actually offers.
    fx: { USD: 6.713, EUR: 7.655, GBP: 8.897, AUD: 4.72, CAD: 4.747, JPY: 0.0426, AED: 1.828 },
    fxAsOf: '',
    payment: 'TT_30_70_BL',
    paymentDays: null,
    bankPct: '',
    bankFlat: '',
    capitalRate: 4.5,
    sinosure: 0,
    commission: 0,
    overhead: 5,
    margin: 15,
    marginBasis: 'price',
    marginFloor: 8,
    term: 'FOB',
    planId: '',
    decimals: 2,
    sheetTerms: ['CIF'],
    notes: '',
  }
}
