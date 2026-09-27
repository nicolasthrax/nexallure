import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import * as d3 from 'd3'

// Ningbo-Zhoushan, the origin every arc starts from.
const ORIGIN = [121.55, 29.87]

// One arc per region the Market Guide covers, ending at a major port there.
export const REGIONS = [
  { key: 'market_us',     port: 'port_us',     at: [-118.27, 33.74], lift: 0.18 },
  { key: 'market_latam',  port: 'port_latam',  at: [-46.33, -23.96], lift: -0.14 },
  { key: 'market_anz',    port: 'port_anz',    at: [151.2, -33.87],  lift: -0.25 },
  { key: 'market_asean',  port: 'port_asean',  at: [103.82, 1.26],   lift: 0.2 },
  { key: 'market_sa',     port: 'port_sa',     at: [72.95, 18.95],   lift: 0.16 },
  { key: 'market_gcc',    port: 'port_gcc',    at: [55.03, 25.01],   lift: 0.2 },
  { key: 'market_africa', port: 'port_africa', at: [39.67, -4.06],   lift: -0.18 },
  { key: 'market_eu',     port: 'port_eu',     at: [4.14, 51.95],    lift: 0.16 },
  { key: 'market_uk',     port: 'port_uk',     at: [1.35, 51.96],    lift: 0.26 },
]

const W = 1000
const H = 520
const CYCLE_MS = 2800

let landCache = null
function loadLand() {
  if (!landCache) {
    landCache = fetch('/ne_110m_land.json')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  }
  return landCache
}

// Pacific-centred so every arc leaves Ningbo without wrapping the map edge.
function makeProjection() {
  return d3.geoNaturalEarth1()
    .rotate([-150, 0])
    .scale(178)
    .translate([W / 2, 272])
}

function arcPath(a, b, lift) {
  const [x1, y1] = a
  const [x2, y2] = b
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  // Control point pushed perpendicular to the chord.
  const cx = mx + (dy / len) * len * lift
  const cy = my - (dx / len) * len * lift * (dx < 0 ? -1 : 1)
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
}

// A container-shaped marker that travels the highlighted arc once.
function Cargo({ d }) {
  const anim = useRef(null)
  useLayoutEffect(() => {
    try { anim.current?.beginElement() } catch { /* SMIL unsupported: marker stays at origin */ }
  }, [d])
  return (
    <rect x="-7" y="-3.5" width="14" height="7" rx="1" fill="var(--seal)">
      <animateMotion
        ref={anim}
        begin="indefinite"
        dur={`${CYCLE_MS * 0.8}ms`}
        path={d}
        rotate="auto"
        fill="freeze"
        calcMode="spline"
        keyTimes="0;1"
        keySplines="0.45 0 0.2 1"
      />
    </rect>
  )
}

export default function RouteMap({ t, onPick }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()
  const [land, setLand] = useState(null)
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    let alive = true
    loadLand().then((geo) => alive && setLand(geo))
    return () => { alive = false }
  }, [])

  const projection = useMemo(makeProjection, [])
  const geoPath = useMemo(() => d3.geoPath(projection), [projection])

  const landPath = useMemo(() => (land ? geoPath(land) : null), [land, geoPath])
  const graticule = useMemo(() => geoPath(d3.geoGraticule().step([30, 30])()), [geoPath])

  const origin = projection(ORIGIN)
  const routes = useMemo(
    () => REGIONS.map((r) => {
      const end = projection(r.at)
      return { ...r, end, d: arcPath(origin, end, r.lift) }
    }),
    [projection] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Arcs draw once, then one region at a time is highlighted.
  useEffect(() => {
    if (!inView) return
    const timer = setTimeout(() => setDrawn(true), reduce ? 0 : 900 + REGIONS.length * 90)
    return () => clearTimeout(timer)
  }, [inView, reduce])

  useEffect(() => {
    if (!drawn || held || reduce) return
    const id = setInterval(() => setActive((i) => (i + 1) % REGIONS.length), CYCLE_MS)
    return () => clearInterval(id)
  }, [drawn, held, reduce])

  const current = routes[active]

  return (
    <div ref={ref} className="nx-map">
      <style>{`
        .nx-map { position: relative; }
        .nx-map svg { display: block; width: 100%; height: auto; overflow: hidden; }
        .nx-map__ping { transform-box: fill-box; transform-origin: center; animation: nx-ping 1.4s ease-out 1; }
        @keyframes nx-ping { from { transform: scale(0.4); opacity: 1; } to { transform: scale(2.6); opacity: 0; } }
        .nx-regions {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid var(--ink); margin-top: 8px;
        }
        .nx-regions button {
          display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
          min-height: 48px; padding: 10px 12px 10px 0; text-align: left;
          background: none; border: 0; border-bottom: 1px solid var(--rule);
          color: var(--ink-2); font-size: 14px;
          transition: color 150ms ease;
        }
        .nx-regions button small { font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); }
        .nx-regions button[data-active="true"] { color: var(--ink); font-weight: 600; }
        .nx-regions button[data-active="true"] small { color: var(--seal); }
        .nx-regions button:hover { color: var(--ink); }
        @media (max-width: 640px) {
          .nx-regions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>

      <svg viewBox={`0 50 ${W} ${H - 120}`} role="img" aria-label={t.map_title}>
        <defs>
          <pattern id="nx-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink-3)" strokeWidth="1.05" />
          </pattern>
        </defs>

        <path d={graticule} fill="none" stroke="var(--rule)" strokeWidth="0.6" />
        {landPath && (
          <motion.path
            d={landPath}
            fill="url(#nx-hatch)"
            stroke="var(--ink-3)"
            strokeWidth="0.6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.8 }}
          />
        )}

        {routes.map((r, i) => (
          <motion.path
            key={r.key}
            d={r.d}
            fill="none"
            stroke={i === active && drawn ? 'var(--seal)' : 'var(--ink)'}
            strokeWidth={i === active && drawn ? 2 : 1}
            strokeOpacity={i === active && drawn ? 1 : 0.55}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.9, delay: 0.25 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            style={{ transition: 'stroke 300ms ease, stroke-width 300ms ease' }}
          />
        ))}

        {routes.map((r, i) => (
          <circle
            key={r.key + '-end'}
            cx={r.end[0]}
            cy={r.end[1]}
            r={i === active && drawn ? 4.5 : 2.6}
            fill={i === active && drawn ? 'var(--seal)' : 'var(--ink)'}
            style={{ transition: 'r 300ms ease, fill 300ms ease' }}
          />
        ))}

        {drawn && current && (
          <g key={`hl-${active}`}>
            {!reduce && <Cargo d={current.d} />}
            <circle className="nx-map__ping" cx={current.end[0]} cy={current.end[1]} r="6" fill="none" stroke="var(--seal)" strokeWidth="1.5" />
            <text
              x={current.end[0] + (current.end[0] > W - 160 ? -10 : 10)}
              y={current.end[1] - 10}
              textAnchor={current.end[0] > W - 160 ? 'end' : 'start'}
              fontFamily="var(--font-mono)"
              fontSize="19"
              fontWeight="500"
              fill="var(--ink)"
              stroke="var(--paper)"
              strokeWidth="4"
              paintOrder="stroke"
            >
              {t[current.port]}
            </text>
          </g>
        )}

        {/* Origin chop */}
        <g transform={`translate(${origin[0]},${origin[1]})`}>
          <rect x="-7" y="-7" width="14" height="14" fill="var(--ink)" transform="rotate(-6)" />
          <text x="-12" y="24" textAnchor="end" fontFamily="var(--font-mono)" fontSize="18" fill="var(--ink)" stroke="var(--paper)" strokeWidth="4" paintOrder="stroke">
            {t.map_origin}
          </text>
        </g>
      </svg>

      <div className="nx-regions" onMouseLeave={() => setHeld(false)}>
        {routes.map((r, i) => (
          <button
            key={r.key}
            data-active={i === active && drawn}
            onMouseEnter={() => { setHeld(true); setActive(i) }}
            onFocus={() => { setHeld(true); setActive(i) }}
            onBlur={() => setHeld(false)}
            onClick={() => onPick?.(r.key)}
          >
            <span>{t[r.key]}</span>
            <small>{t[r.port]}</small>
          </button>
        ))}
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)' }}>{t.map_caption}</p>
    </div>
  )
}
