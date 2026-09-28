import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

// The nine regions the Market Guide covers, and a major port in each.
const REGIONS = [
  ['market_eu', 'port_eu'],
  ['market_us', 'port_us'],
  ['market_uk', 'port_uk'],
  ['market_asean', 'port_asean'],
  ['market_gcc', 'port_gcc'],
  ['market_sa', 'port_sa'],
  ['market_latam', 'port_latam'],
  ['market_africa', 'port_africa'],
  ['market_anz', 'port_anz'],
]

const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const HAN = '港口船货欧美亚非澳海湾南北东西中英国'
const isHan = (c) => /[㐀-鿿]/.test(c)
const TICK_MS = 50

// Text on split-flap tiles. When `run` becomes true every tile shuffles
// through a few glyphs of its own script, then settles left to right.
function Flaps({ text, run, delay = 0, reduce }) {
  const chars = [...text]
  const [shown, setShown] = useState(() => (reduce ? chars : chars.map((c) => (c === ' ' ? ' ' : ''))))

  useEffect(() => {
    const target = [...text]
    if (reduce) { setShown(target); return }
    if (!run) return
    let interval
    // Settling is timed by the clock, not by counting ticks, so a slow or
    // throttled device still finishes on time; it just flips fewer times.
    const settleAt = target.map((_, i) => (4 + i) * TICK_MS)
    const start = setTimeout(() => {
      const t0 = performance.now()
      interval = setInterval(() => {
        const elapsed = performance.now() - t0
        setShown(target.map((c, i) => {
          if (c === ' ' || elapsed >= settleAt[i]) return c
          const pool = isHan(c) ? HAN : LATIN
          return pool[Math.floor(Math.random() * pool.length)]
        }))
        if (elapsed >= settleAt[settleAt.length - 1]) clearInterval(interval)
      }, TICK_MS)
    }, delay)
    return () => { clearTimeout(start); clearInterval(interval) }
  }, [text, run, delay, reduce])

  return (
    <span className="db-flaps" aria-hidden="true">
      {shown.map((c, i) => (c === ' '
        ? <span key={i} className="db-gap" />
        : <span key={i + c} className={`db-tile${isHan(text[i] || '') ? ' db-tile--han' : ''}`}>{c}</span>
      ))}
    </span>
  )
}

function useNingboTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
}

export default function DeparturesBoard({ t, onPick }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const reduce = useReducedMotion()
  const time = useNingboTime()
  // Hovering a row flips its port again, like the board updating.
  const [replay, setReplay] = useState({})

  return (
    <div ref={ref} className="db">
      <style>{`
        .db { background: #0B0E13; border: 2px solid var(--ink); box-shadow: 10px 10px 0 var(--yellow); color: #F4F5F7; }
        .db__head {
          display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 16px 20px; border-bottom: 2px solid #232933;
        }
        .db__title { font-family: var(--font-display); font-weight: 800; font-stretch: 115%; font-size: 22px; letter-spacing: 0.01em; }
        .db__clock { display: flex; align-items: center; gap: 10px; font-size: 15px; color: #B9C0CC; }
        .db__cols, .db__row {
          display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) 118px; gap: 16px; align-items: center;
          padding: 0 20px;
        }
        .db__cols { padding-top: 12px; padding-bottom: 8px; font-size: 14px; color: #B9C0CC; }
        .db__row {
          width: 100%; min-height: 56px; text-align: left; background: none; border: 0; color: inherit;
          border-top: 1px solid #1B2029; cursor: pointer; transition: background-color 150ms ease;
        }
        .db__row:hover, .db__row:focus-visible { background: #151A22; }
        .db__row:hover .db-tile, .db__row:focus-visible .db-tile { color: var(--yellow); }
        .db__go {
          justify-self: end; display: inline-flex; align-items: center; gap: 8px;
          font-size: 16px; font-weight: 700; color: #F4F5F7;
          padding: 6px 12px; border: 2px solid #3B4350; transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
        }
        .db__row:hover .db__go, .db__row:focus-visible .db__go { background: var(--yellow); color: var(--ink); border-color: var(--yellow); }
        .db-flaps { display: inline-flex; flex-wrap: wrap; gap: 2px; row-gap: 3px; }
        .db-tile {
          display: inline-grid; place-items: center; min-width: 1.1em; height: 1.55em; padding: 0 1px;
          background: linear-gradient(#1D232C 0 49%, #0B0E13 49% 51%, #232A34 51% 100%);
          border-radius: 3px; font-family: var(--font-mono); font-weight: 600; font-size: 18px; line-height: 1;
          color: #F4F5F7; transition: color 150ms ease;
          animation: db-flip 90ms ease-out;
        }
        .db-tile--han { min-width: 1.5em; font-family: var(--font-body); }
        .db-gap { display: inline-block; width: 0.45em; }
        @keyframes db-flip { from { transform: perspective(200px) rotateX(-70deg); } to { transform: none; } }
        .db__foot { padding: 12px 20px 16px; border-top: 2px solid #232933; font-size: 15px; color: #B9C0CC; }
        @media (max-width: 720px) {
          .db__cols { display: none; }
          .db__row { grid-template-columns: minmax(0, 1fr) auto; row-gap: 6px; padding-top: 12px; padding-bottom: 12px; }
          .db__row > :nth-child(2) { grid-column: 1; grid-row: 2; }
          .db__row > :nth-child(3) { grid-column: 2; grid-row: 1 / span 2; }
          .db-tile { font-size: 15px; }
        }
      `}</style>

      <div className="db__head">
        <span className="db__title">{t.board_title}</span>
        <span className="db__clock">
          {t.board_time}
          <Flaps text={time} run={inView} reduce={reduce} />
        </span>
      </div>

      <div className="db__cols" aria-hidden="true">
        <span>{t.board_dest}</span>
        <span>{t.board_port}</span>
        <span style={{ justifySelf: 'end' }}>{t.board_brief}</span>
      </div>

      <div role="list">
        {REGIONS.map(([region, port], i) => (
          <div role="listitem" key={region}>
            <button
              className="db__row"
              aria-label={`${t[region]}, ${t[port]}. ${t.board_open} ${t.board_brief}`}
              onClick={() => onPick?.(region)}
              onMouseEnter={() => setReplay((r) => ({ ...r, [region]: (r[region] || 0) + 1 }))}
            >
              <Flaps text={t[region].toUpperCase()} run={inView} delay={i * 110} reduce={reduce} />
              <Flaps key={`${port}-${replay[region] || 0}`} text={t[port].toUpperCase()} run={inView} delay={replay[region] ? 0 : 400 + i * 110} reduce={reduce} />
              <span className="db__go" aria-hidden="true">
                {t.board_open}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" /></svg>
              </span>
            </button>
          </div>
        ))}
      </div>

      <p className="db__foot">{t.map_hint}</p>
    </div>
  )
}
