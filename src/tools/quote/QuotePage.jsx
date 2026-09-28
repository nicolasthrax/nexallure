import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearch } from 'wouter'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/Auth'
import { newId, nextRef, useRecords } from '../shared/store.js'
import { useProfile } from '../shared/profile.js'
import { SaveState } from '../shared/ui.jsx'
import { date } from '../shared/format.js'
import { newSample } from '../tracker/model.js'
import { blankLine, computeQuote, newQuote } from './engine.js'
import { destination } from './presets.js'
import { exampleQuote } from './example.js'
import Manifest from './Manifest.jsx'
import Results from './Results.jsx'
import QuoteSheet from './QuoteSheet.jsx'
import QuoteList, { STATUSES } from './QuoteList.jsx'
import '../shared/tools.css'

const CURRENT = 'nexallure_quote_current'
const prefix = () => `Q-${new Date().getFullYear()}-`
// Every quote gets its id up front so autosave updates one record.
const fresh = (quotes) => ({ ...newQuote(nextRef(prefix(), quotes, 'number')), id: newId() })

function readCurrent() {
  try { return localStorage.getItem(CURRENT) || '' } catch { return '' }
}
function writeCurrent(id) {
  try { localStorage.setItem(CURRENT, id) } catch { /* ignore */ }
}

export default function QuotePage({ t, setPage }) {
  const lang = t._lang
  const { session } = useAuth()
  const userId = session?.user?.id
  const { records: quotes, save, remove, status } = useRecords('quote', userId)
  const samples = useRecords('sample', userId)
  const [profile, setProfile] = useProfile()
  const [, navigate] = useLocation()
  const search = useSearch()
  const [q, setQ] = useState(null)
  const [listOpen, setListOpen] = useState(false)
  const timer = useRef(null)
  const pending = useRef(null)

  // Write edits after a short pause, and immediately when leaving the page.
  const flush = useCallback(() => {
    clearTimeout(timer.current)
    if (pending.current) {
      save(pending.current)
      pending.current = null
    }
  }, [save])
  useEffect(() => () => flush(), [flush])

  const set = useCallback((patch) => {
    setQ((prev) => {
      const next = { ...prev, ...patch }
      if (next.example && !('example' in patch)) next.example = false
      pending.current = next
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 500)
      return next
    })
  }, [flush])

  const openQuote = useCallback((id) => {
    flush()
    const found = quotes.find((x) => x.id === id)
    if (found) {
      setQ(found)
      writeCurrent(found.id)
      setListOpen(false)
    }
  }, [quotes, flush])

  const create = useCallback((base) => {
    flush()
    const saved = save(base)
    setQ(saved)
    writeCurrent(saved.id)
    return saved
  }, [flush, save])

  // First load: a sample handed over from the tracker, the quote open last
  // time, or a fresh one.
  const booted = useRef(false)
  useEffect(() => {
    if (booted.current) return
    const params = new URLSearchParams(search)
    const fromSample = params.get('sample')
    booted.current = true
    // Samples are read from this device synchronously, so it is there or not.
    const s = fromSample && samples.records.find((x) => x.id === fromSample)
    if (fromSample) navigate('/quoting', { replace: true })
    if (s) {
      const base = fresh(quotes)
      const d = destination(s.buyer?.country)
      const known = d.code !== 'OTHER'
      create({
        ...base,
        buyer: { ...base.buyer, company: s.buyer?.company || '', contact: s.buyer?.contact || '' },
        ...(known ? { destCountry: d.code, destPort: d.ports[0] || '', valuation: d.valuation, importVat: d.vat, importFees: d.fees || 0 } : {}),
        sampleId: s.id,
        lines: [{ ...blankLine(), name: s.item || '' }],
      })
      return
    }
    const wanted = params.get('id')
    if (wanted) navigate('/quoting', { replace: true })
    const last = quotes.find((x) => x.id === wanted) || quotes.find((x) => x.id === readCurrent()) || quotes[0]
    if (last) writeCurrent(last.id)
    setQ(last || fresh(quotes))
  }, [search, samples.records, quotes, create, navigate])

  // Keep the open quote current when another device's edit syncs in.
  useEffect(() => {
    if (!q?.id || pending.current) return
    const fresh = quotes.find((x) => x.id === q.id)
    if (fresh && fresh.updatedAt !== q.updatedAt && Date.parse(fresh.updatedAt) > Date.parse(q.updatedAt || 0)) setQ(fresh)
  }, [quotes, q])

  const dq = useDeferredValue(q)
  const r = useMemo(() => (dq ? computeQuote(dq) : null), [dq])

  if (!q || !r) {
    return <main className="tl-page" aria-busy="true" />
  }

  const validTo = new Date(Date.parse(q.issuedAt || new Date()) + (parseInt(q.validDays, 10) || 0) * 86400000)
  const expired = validTo < new Date() && q.status !== 'won' && q.status !== 'lost'

  const logSample = () => {
    const s = samples.save({
      ...newSample(nextRef('S-', samples.records)),
      buyer: { company: q.buyer.company, contact: q.buyer.contact, email: '', country: q.destCountry === 'OTHER' ? '' : q.destCountry },
      item: q.lines.map((l) => l.name).filter(Boolean).join(', '),
      quoteId: q.id,
    })
    flush()
    navigate(`/tracker?open=${s.id}`)
  }

  return (
    <main className="tl-page">
      <div className="nx-wrap">
        <header className="tl-head">
          <div className="tl-head__meta">
            <span className="tl-label">
              {t.q_kicker} · {q.number} · R{q.rev} · {expired ? <strong style={{ color: 'var(--danger)' }}>{t.q_expired}</strong> : t.q_valid_to.replace('{date}', date(validTo, lang))}
            </span>
            <h1 className="nx-display">{t.q_title}</h1>
            <div style={{ display: 'flex', gap: '8px 16px', alignItems: 'center', flexWrap: 'wrap', fontSize: 17 }}>
              <strong>{q.buyer.company || t.q_no_buyer}</strong>
              <select className="tl-input tl-select" style={{ width: 'auto', height: 36, fontSize: 15 }} value={q.status} onChange={(e) => set({ status: e.target.value })} aria-label={t.q_list_status}>
                {STATUSES.map((s) => <option key={s} value={s}>{t[`q_status_${s}`]}</option>)}
              </select>
              <SaveState status={status} signedIn={!!userId} t={t} onSignIn={() => setPage('login')} />
            </div>
          </div>
          <div className="tl-actions">
            <button type="button" className="nx-btn nx-btn--line" onClick={() => { flush(); setListOpen(true) }}>{t.q_quotes.replace('{n}', quotes.length)}</button>
            <button type="button" className="nx-btn nx-btn--line" onClick={() => create(fresh(quotes))}>{t.q_new}</button>
            <button type="button" className="nx-btn nx-btn--line" onClick={() => { const { id, createdAt, updatedAt, ...rest } = q; create({ ...rest, rev: (q.rev || 1) + 1, status: 'draft', issuedAt: new Date().toISOString().slice(0, 10) }); toast.success(t.q_revised) }}>{t.q_revise}</button>
            <button type="button" className="nx-btn nx-btn--seal" onClick={() => { flush(); window.print() }}>{t.q_print}</button>
          </div>
        </header>

        {q.example && (
          <div className="tl-callout tl-callout--info" style={{ marginTop: 20 }} role="status">
            <span>{t.q_example_note}</span>
          </div>
        )}
        {!q.example && !q.lines.some((l) => l.name || l.unitCost) && (
          <div className="tl-callout tl-callout--info" style={{ marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ flex: '1 1 300px' }}>{t.q_start}</span>
            <button type="button" className="tl-btn tl-btn--ink" onClick={() => set({ ...exampleQuote(q.number), number: q.number, example: true })}>{t.q_load_example}</button>
          </div>
        )}
      </div>

      <div className="qd-layout" style={{ marginTop: 20, borderTop: '2px solid var(--ink)' }}>
        <Manifest q={q} set={set} t={t} lang={lang} result={r} profile={profile} setProfile={setProfile} />
        <div>
          <Results q={q} r={r} t={t} lang={lang} set={set} />
          <div className="nx-wrap" style={{ paddingBottom: 72, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="tl-btn" onClick={logSample}>{t.q_to_tracker}</button>
            <span className="tl-hint">{t.q_to_tracker_hint}</span>
          </div>
        </div>
      </div>

      <QuoteSheet q={q} r={r} profile={profile} />
      <QuoteList
        open={listOpen}
        onClose={() => setListOpen(false)}
        quotes={quotes}
        currentId={q.id}
        t={t}
        lang={lang}
        onOpen={openQuote}
        onDuplicate={(src) => {
          const { id, createdAt, updatedAt, ...rest } = src
          create({ ...rest, number: nextRef(prefix(), quotes, 'number'), rev: 1, status: 'draft', issuedAt: new Date().toISOString().slice(0, 10) })
          setListOpen(false)
          toast.success(t.q_duplicated)
        }}
        onDelete={(id) => {
          remove(id)
          if (id === q.id) setQ(fresh(quotes.filter((x) => x.id !== id)))
        }}
        onStatus={(src, s) => (src.id === q.id ? set({ status: s }) : save({ ...src, status: s }))}
      />
    </main>
  )
}
