import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/Auth'
import MarketLoader from '../components/MarketLoader'
import { MonitorButton } from '../components/MonitorButton.jsx'

// ─── Radar Chart ─────────────────────────────────────────────────────────────
function RadarChart({ data, size = 260 }) {
  const cx = size / 2, cy = size / 2
  // Reduce radius to provide more room for labels
  const r = size * 0.3
  const labels = data.map(d => d.label)
  const values = data.map(d => Math.min(Math.max(d.value, 0), 100))
  const n = labels.length
  const angle = i => (Math.PI * 2 * i) / n - Math.PI / 2

  const pt = (i, val) => {
    const a = angle(i), rr = (val / 100) * r
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]
  }

  const rings = [20, 40, 60, 80, 100]
  const polygon = values.map((v, i) => pt(i, v)).map(([x, y]) => `${x},${y}`).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {rings.map(ring => (
        <polygon key={ring}
          points = {Array.from({ length: n }, (_, i) => pt(i, ring)).map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none" stroke="rgba(201,178,122,0.12)" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {labels.map((_, i) => {
        const [x, y] = pt(i, 100)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(201,178,122,0.15)" strokeWidth="1" />
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill="rgba(201,178,122,0.15)" stroke="var(--seal-on-ink)" strokeWidth="2" />
      {/* Data dots */}
      {values.map((v, i) => {
        const [x, y] = pt(i, v)
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--seal-on-ink)" />
      })}
      {/* Labels */}
      {labels.map((label, i) => {
        const a = angle(i)
        const lx = cx + (r + 18) * Math.cos(a)
        const ly = cy + (r + 18) * Math.sin(a)
        
        // Smart alignment based on position around the circle
        const cosA = Math.cos(a)
        const sinA = Math.sin(a)
        
        let anchor = 'middle'
        if (cosA > 0.2) anchor = 'start'
        else if (cosA < -0.2) anchor = 'end'
        
        let dy = '0.35em' // middle
        if (sinA > 0.5) dy = '0.8em' // bottom
        else if (sinA < -0.5) dy = '-0.2em' // top
        
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor}
            fill="rgba(255,255,255,0.7)" fontSize="10"
            fontFamily="'IBM Plex Mono', monospace"
            style={{ dominantBaseline: 'middle' }}
            dy={dy}
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function PlatformHeatmap({ platforms }) {
  if (!platforms?.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {platforms.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            width: '120px',
            flexShrink: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{p.name}</div>
          <div style={{ flex: 1, height: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${p.score}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `rgba(201,178,122,${0.2 + (p.score / 100) * 0.7})`,
                borderRight: '2px solid var(--seal-on-ink)',
              }}
            />
            <span style={{
              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
              color: 'rgba(255,255,255,0.5)',
            }}>{p.score}</span>
          </div>
          <div style={{
            width: '60px', flexShrink: 0,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
            color: p.tier === 'PRIMARY' ? 'var(--seal-on-ink)' : p.tier === 'SECONDARY' ? 'rgba(201,178,122,0.6)' : 'rgba(255,255,255,0.3)',
          }}>{p.tier}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Opportunity Score Badge ──────────────────────────────────────────────────
function OpportunityScore({ score, label }) {
  const color = score >= 75 ? 'var(--seal-on-ink)' : score >= 50 ? 'rgba(201,178,122,0.7)' : 'rgba(201,178,122,0.4)'
  const circumference = 2 * Math.PI * 28
  const dash = (score / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx="36" cy="36" r="28" fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" fill={color}
          fontSize="14" fontWeight="700" fontFamily="'IBM Plex Mono', monospace">
          {score}
        </text>
      </svg>
      <div style={{
        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '9px',
        color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: '0.08em', maxWidth: '70px',
      }}>{label}</div>
    </div>
  )
}

// ─── Buyer Region Bar ─────────────────────────────────────────────────────────
function BuyerRegionBars({ regions }) {
  if (!regions?.length) return null
  const max = Math.max(...regions.map(r => r.concentration))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {regions.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: 'var(--warm-white)' }}>{r.country}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: 'var(--seal-on-ink)' }}>{r.concentration}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(r.concentration / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, rgba(201,178,122,0.5), var(--seal-on-ink))', borderRadius: '3px' }}
            />
          </div>
          {r.note && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>{r.note}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Blur Gate Overlay ────────────────────────────────────────────────────────
function BlurGateOverlay({ t, setPage }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(10,15,30,0.92)',
        border: '1px solid var(--border-dark)',
        padding: '40px 48px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: '24px',
          color: 'var(--warm-white)',
          marginBottom: '12px',
        }}>
          {t.mg_blur_title}
        </h3>
        <p style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '15px',
          color: 'var(--text-light)',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}>
          {t.mg_blur_body}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPage('login')}
            style={{
              background: 'var(--signal-gold)',
              color: 'var(--midnight-navy)',
              border: '1px solid var(--gold-shadow)',
              padding: '12px 24px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {t.mg_blur_signin}
          </button>
          <button
            onClick={() => setPage('register')}
            style={{
              background: 'transparent',
              color: 'var(--warm-white)',
              border: '1px solid var(--border-dark)',
              padding: '12px 24px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {t.mg_blur_signup}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketGuidePage({ setPage, t }) {
  const { session, loading: authLoading } = useAuth()
  const [industry, setIndustry] = useState('')
  const [market, setMarket] = useState('any')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const reportRef = useRef(null)



  // Whether the current user is authenticated — skip blur if true
  const isAuthenticated = !!session

  const industryKeys = [
    'industry_automotive','industry_electronics','industry_machinery',
    'industry_textiles','industry_chemicals','industry_pharma',
    'industry_food','industry_logistics','industry_other',
  ]
  const marketKeys = [
    'market_us','market_eu','market_uk','market_asean',
    'market_gcc','market_latam','market_africa','market_sa','market_anz',
  ]

  const handleFetch = async () => {
    if (!industry) {
      setError(t?.mg_error_select || 'Please select an industry first.')
      return
    }
    if (!isAuthenticated) {
      setError(t?.mg_blur_body || 'Please sign in or create an account to generate the market guide.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/market-guide', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
  },
  body: JSON.stringify({
    industry: industry,
    market: market,
    language: t?._lang || 'EN',
  }),
})
      
      // Handle HTML non-ok failures safely without crashing parsing routines
      if (!response.ok) {
        // Surface the server's own message when it sent JSON; the old version
        // threw inside its own try block and always fell back to the generic text.
        let serverMsg = null
        try {
          const errJson = JSON.parse(await response.text())
          serverMsg = errJson.detail || errJson.error || null
        } catch {
          // Non-JSON body (e.g. an HTML error page): keep the generic message.
        }
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in to generate market guides.')
        }
        throw new Error(serverMsg
          ? `${serverMsg} (Status ${response.status})`
          : `Server error (Status ${response.status}). Please try again later.`)
      }

      const parsed = await response.json()
      if (parsed.error) throw new Error(parsed.error)
      
      // Check if the backend returned an empty fallback layout
      if (!parsed.opportunity_scores || parsed.opportunity_scores.length === 0) {
        throw new Error('The AI engine returned an empty report. Please try generating it again.')
      }

      setResult(parsed)
    } catch (err) {
      console.error(err)
      setError(err.message || t?.mg_error || 'Could not load market data. Please try again.')
      // Ensure the result is cleared on error to prevent displaying stale data
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()


  const dropdownStyle = {
    width: '100%', height: '48px',
    background: 'var(--midnight-navy)',
    border: '1px solid var(--border-dark)',
    color: 'var(--warm-white)',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '14px', padding: '0 16px', outline: 'none',
    cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394A3B8' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .mg-container { 
            padding: 40px !important; 
            background-color: #ffffff !important; 
            color: #000000 !important;
          }
          h1, h2, h3, p, span, .insight-bullet, text {
            color: #000000 !important;
            fill: #000000 !important;
          }
          .card {
            background: transparent !important;
            border: 1px solid #e2e8f0 !important;
            color: #000000 !important;
          }
          .card-label {
            color: #000000 !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .reach-tag {
            color: #000000 !important;
            border: 1px solid #e2e8f0 !important;
            background: transparent !important;
          }
          .mistake-sev {
            color: #000000 !important;
            border: 1px solid #e2e8f0 !important;
            background: transparent !important;
          }
          svg text {
            fill: #000000 !important;
          }
        }
        .mg-container {
          min-height: 100vh;
          background: var(--midnight-navy);
          padding: 120px 48px 80px;
        }
        .mg-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }
        .mg-top-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .mg-mid-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .mg-full { margin-bottom: 24px; }
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-dark);
          padding: 28px 32px;
        }
        .card-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--signal-gold);
          letter-spacing: 0.12em;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(201,178,122,0.15);
        }
        .insight-bullet {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 14px;
          color: var(--warm-white);
          line-height: 1.55;
        }
        .insight-bullet:last-child { border-bottom: none; }
        .bullet-index {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: rgba(201,178,122,0.5);
          padding-top: 3px;
          flex-shrink: 0;
          width: 20px;
        }
        .reach-tag {
          display: inline-block;
          background: rgba(201,178,122,0.08);
          border: 1px solid rgba(201,178,122,0.2);
          color: var(--seal-on-ink);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          padding: 5px 12px;
          margin: 4px 4px 4px 0;
          letter-spacing: 0.04em;
        }
        .mistake-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .mistake-row:last-child { border-bottom: none; }
        .mistake-sev {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          padding: 3px 7px;
          border-radius: 2px;
          flex-shrink: 0;
          margin-top: 2px;
          letter-spacing: 0.05em;
        }
        .sev-high { background: var(--seal-on-ink); color: var(--ink); border: 1px solid var(--seal-on-ink); }
        .sev-med { background: transparent; color: var(--seal-on-ink); border: 1px solid var(--seal-on-ink); }
        .sev-low { background: transparent; color: var(--on-ink-2); border: 1px dashed rgba(238,233,221,0.35); }
        @media (max-width: 768px) {
          .mg-container { padding: 80px 20px 60px; }
          .mg-form-grid, .mg-top-grid, .mg-mid-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mg-container">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ marginBottom: '64px', textAlign: 'center' }} className="no-print">
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: 'var(--signal-gold)', letterSpacing: '0.15em', marginBottom: '20px' }}>
              {t?.mg_eyebrow}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 'clamp(36px, 5vw, 52px)', color: 'var(--warm-white)', lineHeight: 1.12, marginBottom: '20px', letterSpacing: '-0.01em' }}>
              {t?.mg_h1}
            </h1>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '17px', color: 'var(--text-light)', lineHeight: 1.65, maxWidth: '600px', margin: '0 auto' }}>
              {t?.mg_sub}
            </p>
          </motion.div>

          {/* Form */}
          {!result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '800px', margin: '0 auto' }} className="no-print">
              <div className="mg-form-grid">
                <div>
                  <label htmlFor="mg-industry" style={{ display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>
                    {t?.mg_label_industry}
                  </label>
                  <select id="mg-industry" value={industry} onChange={e => setIndustry(e.target.value)} style={dropdownStyle} disabled={loading}>
                    <option value="" disabled>-- {t?.mg_label_industry} --</option>
                    {industryKeys.map(k => <option key={k} value={k}>{t?.[k]}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="mg-market" style={{ display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>
                    {t?.mg_label_market}
                  </label>
                  <select id="mg-market" value={market} onChange={e => setMarket(e.target.value)} style={dropdownStyle} disabled={loading}>
                    <option value="any">{t?.mg_label_market_any}</option>
                    {marketKeys.map(k => <option key={k} value={k}>{t?.[k]}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                {error && <div role="alert" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--signal-gold)', marginBottom: '16px' }}>{error}</div>}
                {loading && (
                  <AnimatePresence>
                    <MarketLoader text="Analyzing export markets..." />
                  </AnimatePresence>
                )}
                {!loading && (
                  <button onClick={handleFetch} style={{ background: 'var(--signal-gold)', color: 'var(--midnight-navy)', border: '1px solid var(--gold-shadow)', borderRadius: '4px', minHeight: '48px', padding: '0 28px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                    {t?.mg_cta}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Results — wrapped with blur gate for unauthenticated users */}
          <AnimatePresence>
            {result && !authLoading && (
              <motion.div ref={reportRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ position: 'relative' }}>
                  {/* Blur wrapper — applied only when user is NOT authenticated */}
                  <div style={isAuthenticated ? {} : { filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>

                    {/* Report header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(201,178,122,0.15)' }}>
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(201,178,122,0.5)', letterSpacing: '0.1em', marginBottom: '6px' }}>
                          INTELLIGENCE REPORT · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                        </div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: '28px', color: 'var(--warm-white)', margin: 0 }}>
                          {t?.[industry]} → {market === 'any' ? (t?._lang === 'ZH' || t?._lang === 'TW' ? '全球市场' : 'Global Markets') : t?.[market]}
                        </h2>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }} className="no-print">
                        <MonitorButton 
                          industry={t?.[industry] || industry} 
                          region={market === 'any' ? (t?._lang === 'ZH' || t?._lang === 'TW' ? '全球市场' : 'Global Markets') : (t?.[market] || market)} 
                          userId={session?.user?.id} 
                        />
                        <button onClick={handlePrint} style={{ background: 'transparent', color: 'var(--seal-on-ink)', border: '1px solid rgba(201,178,122,0.3)', padding: '9px 18px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.05em' }}>
                          ↓ PDF
                        </button>
                        <button onClick={() => setResult(null)} style={{ background: 'transparent', color: 'var(--on-ink-2)', border: '1px solid rgba(255,255,255,0.2)', padding: '9px 18px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.05em' }}>
                          ← {t?.mg_try_another}
                        </button>
                      </div>
                    </div>

                    {/* Opportunity scores row */}
                    {result.opportunity_scores && (
                      <div className="card mg-full">
                        <div className="card-label">
                          {t?._lang === 'ZH' || t?._lang === 'TW' ? '市场机会评分' : 'MARKET OPPORTUNITY SCORES'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px', paddingTop: '8px' }}>
                          {result.opportunity_scores.map((s, i) => (
                            <OpportunityScore key={i} score={s.score} label={s.label} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Buyer regions + Radar */}
                    <div className="mg-top-grid">
                      {/* Where are buyers */}
                      <div className="card">
                        <div className="card-label">{t?.mg_section_where}</div>
                        {result.buyer_regions && result.buyer_regions.length > 0 ? (
                          <BuyerRegionBars regions={result.buyer_regions} />
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {(result.where_are_buyers || []).map((item, i) => (
                              <li key={i} className="insight-bullet">
                                <span className="bullet-index">0{i + 1}</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Radar — what buyers want */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="card-label">{t?.mg_section_what}</div>
                        {result.buyer_criteria_radar && result.buyer_criteria_radar.length > 0 ? (
                          <div style={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
                            <RadarChart data={result.buyer_criteria_radar} size={280} />
                          </div>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {(result.what_they_want || []).map((item, i) => (
                              <li key={i} className="insight-bullet">
                                <span className="bullet-index">0{i + 1}</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Platform heatmap + How to reach */}
                    <div className="mg-mid-grid">
                      <div className="card">
                        <div className="card-label">{t?.mg_section_platforms}</div>
                        {result.platform_scores && result.platform_scores.length > 0 ? (
                          <PlatformHeatmap platforms={result.platform_scores} />
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {(result.platforms || []).map((item, i) => (
                              <li key={i} className="insight-bullet">
                                <span className="bullet-index">0{i + 1}</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="card">
                        <div className="card-label">{t?.mg_section_howto}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', marginBottom: '16px' }}>
                          {(result.outreach_channels || result.how_to_reach || []).slice(0, 5).map((item, i) => (
                            <span key={i} className="reach-tag">{item}</span>
                          ))}
                        </div>
                        {result.outreach_detail && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {result.outreach_detail.map((item, i) => (
                              <li key={i} className="insight-bullet" style={{ fontSize: '13px' }}>
                                <span className="bullet-index">→</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Mistakes */}
                    <div className="card mg-full">
                      <div className="card-label">{t?.mg_section_redflags}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 32px' }}>
                        {(result.mistakes_structured || result.mistakes_to_avoid || []).map((item, i) => {
  const isObj = typeof item === 'object'
  const text = isObj ? item.mistake : item
  const sev = isObj ? item.severity : (i < 2 ? 'HIGH' : 'MED')
  return (
    <div key={i} className="mistake-row">
      <span className={`mistake-sev ${sev === 'HIGH' ? 'sev-high' : sev === 'LOW' ? 'sev-low' : 'sev-med'}`}>{sev}</span>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: 'var(--warm-white)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
})}
</div>
</div>

{/* Disclaimer */}
<div style={{ textAlign: 'center', marginTop: '16px' }} className="no-print">
<p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
{t?.mg_disclaimer}
</p>
</div>

                  </div>
                  {/* END blur wrapper */}

                  {/* Blur gate overlay — shown only when NOT authenticated */}
                  {!isAuthenticated && (
                    <BlurGateOverlay t={t} setPage={setPage} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
