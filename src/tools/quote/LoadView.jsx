import { CONTAINERS } from './packing.js'

// Colours for quote lines, shared with the manifest swatches.
const LINE_COLORS = ['#1F4FBF', '#B4471F', '#1E6B4E', '#C99400', '#545C69', '#0F7C8C', '#7A3E9D', '#8A5A1F']
export const lineColor = (i) => LINE_COLORS[i % LINE_COLORS.length]

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `rgb(${r},${g},${b})`
}

// Cabinet-style oblique projection: length runs left to right, depth recedes
// up and to the right at half scale, height goes up. A 40′ box stays long and
// readable in a wide panel, which an isometric view would not.
const K = 0.5
const COS = Math.cos(Math.PI / 6)
const SIN = Math.sin(Math.PI / 6)

export default function LoadView({ box, lines, title }) {
  const def = CONTAINERS[box.type]
  const s = 560 / CONTAINERS['40HQ'].L // same scale for every box size
  const P = (x, y, z) => [x * s + y * K * COS * s, -(z * s) - y * K * SIN * s]
  const pts = (arr) => arr.map(([x, y, z]) => P(x, y, z).join(',')).join(' ')
  const pad = 14
  const w = def.L * s + def.W * K * COS * s + pad * 2
  const h = def.H * s + def.W * K * SIN * s + pad * 2
  const ox = pad
  const oy = h - pad

  // One cuboid of cartons: length x0..x1, across y0..y1, up to height H,
  // with a seam every d along the length, every a across and every u up.
  const cuboid = (key, color, x0, x1, y0, y1, H, d, a, u) => {
    const front = [[x0, y0, 0], [x1, y0, 0], [x1, y0, H], [x0, y0, H]]
    const top = [[x0, y0, H], [x1, y0, H], [x1, y1, H], [x0, y1, H]]
    const side = [[x1, y0, 0], [x1, y1, 0], [x1, y1, H], [x1, y0, H]]
    const seams = []
    const walls = Math.round((x1 - x0) / d)
    if (walls <= 60) for (let k = 1; k < walls; k++) {
      const x = x0 + k * d
      seams.push([P(x, y0, 0), P(x, y0, H)], [P(x, y0, H), P(x, y1, H)])
    }
    const layers = Math.round(H / u)
    if (layers <= 30) for (let k = 1; k < layers; k++) {
      const z = k * u
      seams.push([P(x0, y0, z), P(x1, y0, z)], [P(x1, y0, z), P(x1, y1, z)])
    }
    const cols = Math.round((y1 - y0) / a)
    if (cols <= 30) for (let k = 1; k < cols; k++) {
      const y = y0 + k * a
      seams.push([P(x0, y, H), P(x1, y, H)], [P(x1, y, 0), P(x1, y, H)])
    }
    return (
      <g key={key}>
        <polygon points={pts(front)} fill={color} />
        <polygon points={pts(top)} fill={shade(color, 0.35)} />
        <polygon points={pts(side)} fill={shade(color, -0.25)} />
        {seams.map(([p, q], i) => (
          <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />
        ))}
        <polygon points={pts(front)} fill="none" stroke="#0E1116" strokeWidth="1" />
        <polygon points={pts(top)} fill="none" stroke="#0E1116" strokeWidth="1" />
        <polygon points={pts(side)} fill="none" stroke="#0E1116" strokeWidth="1" />
      </g>
    )
  }

  const faces = []
  box.blocks.forEach((b, bi) => {
    const d = b.wall.depth
    const color = lineColor(b.index)
    const full = Math.floor(b.cartons / b.wall.perWall)
    let rem = b.cartons - full * b.wall.perWall
    // Regions further back are drawn first so nearer ones cover them.
    const back = [...b.wall.regions].sort((p, q) => q.y0 - p.y0)
    if (full) {
      for (const r of back) {
        faces.push(cuboid(`${bi}f${r.y0}`, color, b.start, b.start + full * d, r.y0, r.y0 + r.cols * r.a, r.rows * r.u, d, r.a, r.u))
      }
    }
    if (rem) {
      // The last wall fills front region first, bottom up.
      const parts = b.wall.regions.map((r) => {
        const take = Math.min(rem, r.cols * r.rows)
        rem -= take
        return { r, layers: Math.ceil(take / r.cols) }
      }).filter((x) => x.layers > 0).sort((p, q) => q.r.y0 - p.r.y0)
      const x0 = b.start + full * d
      for (const { r, layers } of parts) {
        faces.push(cuboid(`${bi}p${r.y0}`, color, x0, x0 + d, r.y0, r.y0 + r.cols * r.a, layers * r.u, d, r.a, r.u))
      }
    }
  })

  const { L, W, H } = def
  const floor = [[0, 0, 0], [L, 0, 0], [L, W, 0], [0, W, 0]]
  const back = [[0, W, 0], [L, W, 0], [L, W, H], [0, W, H]]
  const left = [[0, 0, 0], [0, W, 0], [0, W, H], [0, 0, H]]
  const edges = [
    [[0, 0, H], [L, 0, H]], [[L, 0, 0], [L, 0, H]], [[L, 0, H], [L, W, H]], [[0, 0, H], [0, W, H]], [[L, W, 0], [L, W, H]],
  ]
  const name = lines.map((l, i) => l.name || `#${i + 1}`)

  return (
    <svg className="qd-iso" viewBox={`0 0 ${w.toFixed(0)} ${h.toFixed(0)}`} role="img" aria-label={title}>
      <title>{title}</title>
      <g transform={`translate(${ox},${oy})`}>
        <polygon points={pts(floor)} fill="#E1E4EA" stroke="#B4BAC5" />
        <polygon points={pts(back)} fill="#ECEEF2" stroke="#B4BAC5" />
        <polygon points={pts(left)} fill="#E6E9EE" stroke="#B4BAC5" />
        {faces}
        {edges.map(([a, b], i) => {
          const [x1, y1] = P(...a)
          const [x2, y2] = P(...b)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0E1116" strokeWidth="1.5" strokeDasharray={i < 2 ? '5 4' : undefined} />
        })}
      </g>
      <desc>{box.blocks.map((b) => `${name[b.index]}: ${b.cartons}`).join('; ')}</desc>
    </svg>
  )
}
