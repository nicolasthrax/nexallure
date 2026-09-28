import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearch } from 'wouter'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/Auth'
import { nextRef, useRecords } from '../shared/store.js'
import { useProfile } from '../shared/profile.js'
import { Drawer, Empty, SaveState } from '../shared/ui.jsx'
import { download, money, number, percent, relative, toNum, yuan } from '../shared/format.js'
import { parseCsv, toCsv } from '../shared/csv.js'
import { countryName } from '../shared/countries.js'
import { insights, mapImport, newCase, newSample, snooze, todayQueue, touch, trackingUrl } from './model.js'
import { SampleBoard, CaseBoard } from './Board.jsx'
import SampleDrawerBody from './SampleDrawer.jsx'
import CaseDrawerBody from './CaseDrawer.jsx'
import Insights from './Insights.jsx'
import '../shared/tools.css'

const SETTINGS = 'nexallure_tracker_settings'
function readSettings() {
  try { return { fx: '6.713', days: 365, ...(JSON.parse(localStorage.getItem(SETTINGS) || '{}') || {}) } } catch { return { fx: '6.713', days: 365 } }
}

// Edits in the drawer are written after a short pause (typing a note should
// not upload on every key); stage moves and 8D steps are written at once.
function useDraft(rec, save) {
  const [draft, setDraft] = useState(rec)
  const timer = useRef(null)
  const latest = useRef(rec)
  const dirty = useRef(false)
  useEffect(() => {
    // A different record, or a newer copy synced from another device.
    if (!rec) return
    if (rec.id !== latest.current?.id || (!dirty.current && rec.updatedAt !== latest.current?.updatedAt)) {
      latest.current = rec
      setDraft(rec)
    }
  }, [rec])
  const flush = useCallback(() => {
    clearTimeout(timer.current)
    if (dirty.current && latest.current) {
      dirty.current = false
      latest.current = save(latest.current)
    }
  }, [save])
  useEffect(() => () => flush(), [flush])
  const update = useCallback((patch) => {
    const next = { ...latest.current, ...patch }
    latest.current = next
    dirty.current = true
    setDraft(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, 600)
  }, [flush])
  const commit = useCallback((next) => {
    clearTimeout(timer.current)
    dirty.current = false
    latest.current = save(next)
    setDraft(latest.current)
  }, [save])
  return [draft, update, commit, flush]
}

function RecordDrawer({ rec, onClose, save, t, lang, profile, samples, onQuote, onOpenQuote, onCase, onOpen, remove }) {
  const [draft, update, commit, flush] = useDraft(rec, save)
  const close = useCallback(() => { flush(); onClose() }, [flush, onClose])
  if (!draft) return <Drawer open={false} onClose={close} />
  const isCase = draft.kind === 'case'
  const title = isCase ? (draft.title || draft.buyer?.company || draft.ref) : (draft.buyer?.company || t.tr_no_buyer)
  const label = isCase ? `${t.tr_case_label} · ${draft.ref}` : `${t.tr_sample_label} · ${draft.ref}${draft.item ? ` · ${draft.item}` : ''}`
  return (
    <Drawer open={!!rec} onClose={close} title={title} label={label} closeLabel={t.nav_close}>
      {isCase ? (
        <CaseDrawerBody
          key={draft.id}
          rec={draft}
          update={update}
          commit={commit}
          t={t}
          lang={lang}
          profile={profile}
          sample={samples.find((s) => s.id === draft.sampleId)}
          onOpenSample={(id) => { flush(); onOpen(id) }}
          onDelete={() => { remove(draft.id); onClose() }}
        />
      ) : (
        <SampleDrawerBody
          key={draft.id}
          rec={draft}
          update={update}
          commit={commit}
          t={t}
          lang={lang}
          profile={profile}
          onQuote={() => { flush(); onQuote(draft) }}
          onOpenQuote={(id) => { flush(); onOpenQuote(id) }}
          onCase={() => { flush(); onCase(draft) }}
          onDelete={() => { remove(draft.id); onClose() }}
        />
      )}
    </Drawer>
  )
}

function Today({ rows, t, lang, onOpen, save }) {
  const reason = (row) => {
    const r = row.reason
    if (r.code === 'step') return t.tr_why_step.replace('{step}', r.step).replace('{name}', t[`tr_d_${r.step}`])
    return (t[`tr_why_${r.code}`] || '').replace('{n}', r.days ?? '')
  }
  return (
    <aside className="tr-today" aria-labelledby="tr-today-h">
      <div className="tl-sec__h">
        <h2 id="tr-today-h" className="nx-display" style={{ fontSize: 36, fontStretch: '90%' }}>{t.tr_today}</h2>
        <span className="tl-label">{t.tr_today_n.replace('{n}', rows.length)}</span>
      </div>
      {!rows.length && <p className="tl-note">{t.tr_today_empty}</p>}
      {rows.map((row) => {
        const rec = row.rec
        const late = row.due < new Date()
        const link = rec.kind === 'sample' && rec.stage === 'transit' ? trackingUrl(rec.courier, rec.awb) : null
        return (
          <div key={rec.id} className="tr-todo">
            <div className="tr-todo__top">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: late ? 'var(--rust)' : 'var(--yellow)', border: '2px solid var(--ink)' }} />
                <span style={{ overflowWrap: 'anywhere' }}>{rec.buyer?.company || rec.ref}{rec.buyer?.country ? ` · ${countryName(rec.buyer.country, lang)}` : ''}</span>
              </strong>
              <span className="tr-due" data-late={late}>{relative(row.due, t)}</span>
            </div>
            <span style={{ fontSize: 15, color: 'var(--ink-2)' }}>{rec.kind === 'case' ? `${rec.ref} · ` : ''}{reason(row)}</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="tl-btn tl-btn--ink" onClick={() => onOpen(rec.id)}>{t.tr_open}</button>
              {rec.kind === 'sample' && <button type="button" className="tl-btn" onClick={() => { save(touch(rec)); toast.success(t.tr_touched) }}>{t.tr_act_touch_short}</button>}
              {link && <a className="tl-btn" href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{t.tr_track} ↗</a>}
              <button type="button" className="tl-btn tl-btn--quiet" onClick={() => save(snooze(rec, rec.kind === 'case' ? 1 : 2))}>{rec.kind === 'case' ? t.tr_snooze_1 : t.tr_snooze_2}</button>
            </div>
          </div>
        )
      })}
    </aside>
  )
}

export default function TrackerPage({ t, setPage }) {
  const lang = t._lang
  const { session } = useAuth()
  const userId = session?.user?.id
  const S = useRecords('sample', userId)
  const C = useRecords('case', userId)
  const [profile] = useProfile()
  const [, navigate] = useLocation()
  const search = useSearch()
  const [tab, setTab] = useState('samples')
  const [openId, setOpenId] = useState(null)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [settings, setSettings] = useState(readSettings)
  const fileRef = useRef(null)

  const putSettings = (patch) => setSettings((s) => {
    const next = { ...s, ...patch }
    try { localStorage.setItem(SETTINGS, JSON.stringify(next)) } catch { /* ignore */ }
    return next
  })

  // ?open=<id> from the quote desk.
  useEffect(() => {
    const id = new URLSearchParams(search).get('open')
    if (id) {
      setOpenId(id)
      navigate('/tracker', { replace: true })
    }
  }, [search, navigate])

  const save = useCallback((rec) => (rec.kind === 'case' ? C.save(rec) : S.save(rec)), [C, S])
  const remove = useCallback((id) => {
    if (S.records.some((r) => r.id === id)) S.remove(id)
    else C.remove(id)
    toast.success(t.tr_deleted)
  }, [S, C, t])

  const match = useCallback((r) => {
    if (country && (r.buyer?.country || '') !== country) return false
    if (!query.trim()) return true
    const hay = [r.ref, r.buyer?.company, r.buyer?.contact, r.item, r.awb, r.title, r.product, r.poRef, r.lot].join(' ').toLowerCase()
    return hay.includes(query.trim().toLowerCase())
  }, [query, country])

  const samples = useMemo(() => S.records.filter(match), [S.records, match])
  const cases = useMemo(() => C.records.filter(match), [C.records, match])
  const queue = useMemo(() => todayQueue(S.records, C.records), [S.records, C.records])
  const stats = useMemo(() => insights(S.records, C.records, { fx: toNum(settings.fx, 6.713), days: settings.days }), [S.records, C.records, settings])
  const countries = useMemo(() => [...new Set([...S.records, ...C.records].map((r) => r.buyer?.country).filter(Boolean))].sort(), [S.records, C.records])
  const openRec = S.records.find((r) => r.id === openId) || C.records.find((r) => r.id === openId) || null

  const addSample = () => {
    const rec = S.save(newSample(nextRef('S-', S.records)))
    setTab('samples')
    setOpenId(rec.id)
  }
  const addCase = (from) => {
    const base = newCase(nextRef('NC-', C.records))
    const rec = C.save(from ? { ...base, buyer: { ...from.buyer }, product: from.item || '', sampleId: from.id } : base)
    setTab('cases')
    setOpenId(rec.id)
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2_000_000) { toast.error(t.tr_import_big); return }
    const rows = mapImport(parseCsv(await file.text()))
    if (!rows.length) { toast.error(t.tr_import_none); return }
    const first = parseInt(nextRef('S-', S.records).slice(2), 10)
    const recs = rows.map((row, i) => {
      const rec = { ...newSample(`S-${String(first + i).padStart(4, '0')}`), ...row, stage: row.awb ? 'transit' : 'requested' }
      if (row.awb) rec.stageAt = { ...rec.stageAt, transit: rec.stageAt.requested }
      return rec
    })
    S.saveMany(recs)
    toast.success(t.tr_imported.replace('{n}', recs.length))
  }

  const exportCsv = (kind) => {
    const stamp = new Date().toISOString().slice(0, 10)
    if (kind === 'samples') {
      const cols = [
        ['ref', (r) => r.ref], ['stage', (r) => r.stage], ['buyer', (r) => r.buyer?.company], ['contact', (r) => r.buyer?.contact],
        ['email', (r) => r.buyer?.email], ['country', (r) => r.buyer?.country], ['item', (r) => r.item], ['qty', (r) => r.qty],
        ['cost policy', (r) => r.costPolicy], ['goods cost CNY', (r) => r.goodsCost], ['courier cost CNY', (r) => r.courierCost],
        ['courier', (r) => r.courier], ['awb', (r) => r.awb], ['requested', (r) => r.stageAt?.requested], ['dispatched', (r) => r.stageAt?.transit],
        ['delivered', (r) => r.stageAt?.delivered], ['po value USD', (r) => r.poValue], ['lost reason', (r) => r.lostReason], ['notes', (r) => r.notes],
      ].map(([label, get]) => ({ label, get }))
      download(`nexallure-samples-${stamp}.csv`, toCsv(S.records, cols))
    } else {
      const cols = [
        ['ref', (r) => r.ref], ['opened', (r) => r.openedAt], ['buyer', (r) => r.buyer?.company], ['country', (r) => r.buyer?.country],
        ['title', (r) => r.title], ['type', (r) => r.type], ['severity', (r) => r.severity], ['product', (r) => r.product],
        ['po', (r) => r.poRef], ['lot', (r) => r.lot], ['affected qty', (r) => r.affectedQty], ['claim USD', (r) => r.claimValue],
        ['root cause', (r) => r.rootCause], ['resolution', (r) => r.resolution], ['cost CNY', (r) => r.costCny],
        ...['D3', 'D4', 'D8'].map((k) => [`${k} done`, (r) => r.d?.[k]?.at || '']),
      ].map(([label, get]) => ({ label, get }))
      download(`nexallure-after-sales-${stamp}.csv`, toCsv(C.records, cols))
    }
  }

  const kpis = [
    [t.tr_kpi_win, stats.winRate != null ? percent(stats.winRate, lang, 0) : '—', t.tr_kpi_win_n.replace('{won}', stats.won).replace('{n}', stats.won + stats.lost)],
    [t.tr_kpi_days, stats.daysToPo != null ? number(stats.daysToPo, lang) : '—', t.tr_kpi_days_n],
    [t.tr_kpi_spend, yuan(stats.spend, lang), t.tr_kpi_spend_n.replace('{n}', settings.days)],
    [t.tr_kpi_roi, stats.returnPerYuan != null ? `¥${number(stats.returnPerYuan, lang)}` : '—', t.tr_kpi_roi_n.replace('{po}', money(stats.poUsd, 'USD', lang, 0))],
    [t.tr_kpi_8d, stats.containedOnTime ? `${stats.containedOnTime.onTime} / ${stats.containedOnTime.of}` : '—', t.tr_kpi_8d_n.replace('{n}', stats.openCases)],
  ]
  const status = S.status === 'error' || C.status === 'error' ? 'error' : S.status === 'syncing' || C.status === 'syncing' ? 'syncing' : S.status

  return (
    <main className="tl-page">
      <div className="nx-wrap">
        <header className="tl-head">
          <div className="tl-head__meta">
            <span className="tl-label">{t.tr_kicker.replace('{n}', stats.open + stats.openCases)}</span>
            <h1 className="nx-display">{t.tr_title}</h1>
            <SaveState status={status} signedIn={!!userId} t={t} onSignIn={() => setPage('login')} />
          </div>
          <div className="tl-actions">
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" onChange={onImport} hidden />
            <button type="button" className="nx-btn nx-btn--line" onClick={() => fileRef.current?.click()}>{t.tr_import}</button>
            <button type="button" className="nx-btn nx-btn--line" onClick={() => addCase(null)}>{t.tr_new_case}</button>
            <button type="button" className="nx-btn nx-btn--seal" onClick={addSample}>{t.tr_new_sample}</button>
          </div>
        </header>

        <div className="tl-kpis" style={{ marginTop: 24 }}>
          {kpis.map(([label, v, note]) => (
            <div key={label} className="tl-kpi">
              <span className="tl-label">{label}</span>
              <span className="tl-kpi__v">{v}</span>
              <span className="tl-kpi__n">{note}</span>
            </div>
          ))}
        </div>

        <div className="tr-layout">
          <Today rows={queue} t={t} lang={lang} onOpen={setOpenId} save={save} />

          <section style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="tl-tabs" role="tablist" aria-label={t.tr_title}>
                {[['samples', t.tr_tab_samples.replace('{n}', S.records.length)], ['cases', t.tr_tab_cases.replace('{n}', C.records.length)], ['insights', t.tr_tab_insights]].map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
                ))}
              </div>
              {tab !== 'insights' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input className="tl-input" style={{ width: 220, height: 40 }} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.tr_search} aria-label={t.tr_search} />
                  <select className="tl-input tl-select" style={{ width: 'auto', height: 40 }} value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t.tr_country}>
                    <option value="">{t.tr_all_countries}</option>
                    {countries.map((c) => <option key={c} value={c}>{countryName(c, lang) || c}</option>)}
                  </select>
                  <button type="button" className="tl-btn" onClick={() => exportCsv(tab)}>{t.tr_export}</button>
                </div>
              )}
            </div>

            {tab === 'samples' && (S.records.length ? (
              <>
                <SampleBoard samples={samples} t={t} onOpen={setOpenId} save={S.save} />
                <p className="tl-hint">{t.tr_board_hint}</p>
              </>
            ) : (
              <Empty title={t.tr_empty_samples} body={t.tr_empty_samples_body}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" className="tl-btn tl-btn--ink" onClick={addSample}>{t.tr_new_sample}</button>
                  <button type="button" className="tl-btn" onClick={() => fileRef.current?.click()}>{t.tr_import}</button>
                </div>
                <p className="tl-hint">{t.tr_import_hint}</p>
              </Empty>
            ))}
            {tab === 'cases' && (C.records.length ? (
              <CaseBoard cases={cases} t={t} onOpen={setOpenId} />
            ) : (
              <Empty title={t.tr_empty_cases} body={t.tr_empty_cases_body}>
                <button type="button" className="tl-btn tl-btn--ink" onClick={() => addCase(null)}>{t.tr_new_case}</button>
              </Empty>
            ))}
            {tab === 'insights' && (
              <Insights stats={stats} t={t} lang={lang} fx={settings.fx} setFx={(v) => putSettings({ fx: v })} days={settings.days} setDays={(v) => putSettings({ days: v })} />
            )}
          </section>
        </div>
      </div>

      <RecordDrawer
        rec={openRec}
        onClose={() => setOpenId(null)}
        save={save}
        remove={remove}
        t={t}
        lang={lang}
        profile={profile}
        samples={S.records}
        onOpen={setOpenId}
        onQuote={(s) => navigate(`/quoting?sample=${s.id}`)}
        onOpenQuote={(id) => navigate(`/quoting?id=${id}`)}
        onCase={(s) => addCase(s)}
      />
    </main>
  )
}
