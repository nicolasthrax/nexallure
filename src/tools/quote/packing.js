// Container load planning.
//
// Real load planners build "walls": a cross-section of the container (width x
// height) is filled with cartons in one orientation, and walls are stacked
// back to front along the container's length. It is the method loading crews
// use, it keeps each SKU together for unloading, and it is within a few per
// cent of optimal for the carton sizes export factories ship.

// Internal dimensions (mm), door opening (mm) and maximum payload (kg) for
// ISO general-purpose boxes. Payload varies by carrier and by road limits at
// origin, so the quote lets the user lower it.
export const CONTAINERS = {
  '20GP': { L: 5898, W: 2352, H: 2393, doorH: 2280, payload: 28200 },
  '40GP': { L: 12032, W: 2352, H: 2393, doorH: 2280, payload: 26700 },
  '40HQ': { L: 12032, W: 2352, H: 2698, doorH: 2585, payload: 26500 },
}
export const CONTAINER_TYPES = Object.keys(CONTAINERS)

// Loading crews need a little air to get the last wall past the door seals
// and to stop cartons binding against the roof.
const CLEAR_L = 50
const CLEAR_H = 30

export const usableLength = (type) => CONTAINERS[type].L - CLEAR_L

// IATA volumetric divisor: 1 m3 counts as 166.67 kg of air freight.
export const AIR_KG_PER_CBM = 1e6 / 6000

export function cartonCount(line) {
  const qty = Math.max(0, Number(line.qty) || 0)
  const per = Math.max(1, Math.floor(Number(line.perCarton) || 1))
  return Math.ceil(qty / per)
}

export function cartonCbm(line) {
  return ((Number(line.cartonL) || 0) * (Number(line.cartonW) || 0) * (Number(line.cartonH) || 0)) / 1e6
}

// Every way a carton can stand. [depth along container, across, up].
// "This side up" cartons may only turn on the floor.
function orientations(l, w, h, upright) {
  const all = upright
    ? [[l, w, h], [w, l, h]]
    : [[l, w, h], [w, l, h], [l, h, w], [h, l, w], [w, h, l], [h, w, l]]
  const seen = new Set()
  return all.filter((o) => {
    const k = o.join('x')
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// Best wall for one carton type in one container: the arrangement that puts
// the most cartons in each millimetre of container length. A wall may mix two
// orientations side by side (a few columns turned 90°), which is how crews
// use the strip of width a single orientation leaves empty.
export function bestWall(line, type) {
  const options = wallOptions(line, type)
  return options.reduce((b, o) => (!b || o.density > b.density + 1e-9 ? o : b), null)
}

// Every sensible wall for this carton: each orientation, each split of the
// width between upright and turned columns.
function wallOptions(line, type) {
  const box = CONTAINERS[type]
  const l = (Number(line.cartonL) || 0) * 10
  const w = (Number(line.cartonW) || 0) * 10
  const h = (Number(line.cartonH) || 0) * 10
  if (!(l > 0 && w > 0 && h > 0)) return []
  const H = box.H - CLEAR_H
  const upright = !!line.upright
  const out = []
  const consider = (d, regions) => {
    const perWall = regions.reduce((s, r) => s + r.cols * r.rows, 0)
    if (!perWall) return
    let y0 = 0
    const placed = regions.filter((r) => r.cols * r.rows).map((r) => {
      const o = { ...r, y0 }
      y0 += r.cols * r.a
      return o
    })
    out.push({ depth: d, perWall, density: perWall / d, regions: placed, dims: [d, placed[0].a, placed[0].u] })
  }
  for (const [d, a, u] of orientations(l, w, h, upright)) {
    if (d > box.L - CLEAR_L || u > box.doorH) continue
    const rowsA = Math.floor(H / u)
    const maxCols = Math.floor(box.W / a)
    // The same depth with the face turned: across and up swap. Not allowed
    // for "this side up" cartons, whose height must stay vertical.
    const turned = !upright && a <= box.doorH ? { a: u, u: a, rows: Math.floor(H / a) } : null
    for (let cols = maxCols; cols >= 0; cols--) {
      const regions = [{ cols, rows: rowsA, a, u }]
      if (turned) {
        const rest = Math.floor((box.W - cols * a) / turned.a)
        regions.push({ cols: rest, rows: turned.rows, a: turned.a, u: turned.u })
      }
      consider(d, regions)
      if (!turned) break
    }
  }
  return out
}

// For a known number of cartons the densest wall is not always best: whole
// walls are what take up floor, so pick the wall that needs the least length
// for this count.
function wallFor(line, type, n) {
  let best = null
  for (const o of wallOptions(line, type)) {
    const len = Math.ceil(n / o.perWall) * o.depth
    if (!best || len < best.len || (len === best.len && o.density > best.o.density)) best = { len, o }
  }
  return best?.o || null
}

// Pack every line into containers of one type. Returns the containers, each
// with the wall blocks it holds, or null if some carton cannot fit at all.
export function packInto(lines, type, payloadLimit) {
  const box = CONTAINERS[type]
  const usableL = box.L - CLEAR_L
  const payload = Math.min(box.payload, Number(payloadLimit) || box.payload)
  const jobs = []
  for (const [index, line] of lines.entries()) {
    const n = cartonCount(line)
    if (!n) continue
    const wall = wallFor(line, type, n)
    if (!wall) return null
    jobs.push({ index, line, n, wall, kg: Number(line.cartonKg) || 0 })
  }
  // Heaviest, bulkiest SKUs go in first, against the front wall.
  jobs.sort((a, b) => b.wall.depth * b.wall.perWall - a.wall.depth * a.wall.perWall)

  const boxes = []
  let cur = null
  const open = () => {
    cur = { type, usedL: 0, kg: 0, cartons: 0, cbm: 0, blocks: [] }
    boxes.push(cur)
  }
  open()
  for (const job of jobs) {
    let left = job.n
    while (left > 0) {
      const lengthLeft = usableL - cur.usedL
      const wallsByLength = Math.floor(lengthLeft / job.wall.depth)
      const byWeight = job.kg > 0 ? Math.floor((payload - cur.kg) / job.kg) : Infinity
      const room = Math.min(wallsByLength * job.wall.perWall, byWeight)
      if (room <= 0) {
        if (!cur.cartons) return null // an empty box cannot take even one carton
        open()
        continue
      }
      const take = Math.min(left, room)
      const walls = Math.ceil(take / job.wall.perWall)
      cur.blocks.push({
        index: job.index,
        start: cur.usedL,
        walls,
        cartons: take,
        wall: job.wall,
      })
      cur.usedL += walls * job.wall.depth
      cur.kg += take * job.kg
      cur.cartons += take
      cur.cbm += take * cartonCbm(job.line)
      left -= take
    }
  }
  if (!boxes[0].cartons) return []
  const cap = (box.L * box.W * box.H) / 1e9
  for (const b of boxes) {
    b.volumeFill = b.cbm / cap
    b.weightFill = b.kg / payload
    b.lengthFill = b.usedL / usableL
    b.payload = payload
    b.capacityCbm = cap
  }
  return boxes
}

// How many more cartons of each line would fit in the space the last
// container has left. Used for the "fill the box" suggestion.
export function spareRoom(lines, box) {
  const def = CONTAINERS[box.type]
  const lengthLeft = def.L - CLEAR_L - box.usedL
  // The last wall of the last block is often only part full.
  const last = box.blocks[box.blocks.length - 1]
  const partial = last ? last.walls * last.wall.perWall - last.cartons : 0
  return lines.map((line, index) => {
    const kg = Number(line.cartonKg) || 0
    const byWeight = kg > 0 ? Math.floor((box.payload - box.kg) / kg) : Infinity
    const wall = bestWall(line, box.type)
    if (!wall || !cartonCount(line)) return 0
    let fit = Math.floor(lengthLeft / wall.depth) * wall.perWall
    if (last && last.index === index) fit += partial
    return Math.max(0, Math.min(fit, byWeight))
  })
}

export function shipmentTotals(lines) {
  let cartons = 0
  let cbm = 0
  let kg = 0
  for (const line of lines) {
    const n = cartonCount(line)
    cartons += n
    cbm += n * cartonCbm(line)
    kg += n * (Number(line.cartonKg) || 0)
  }
  return { cartons, cbm, kg }
}
