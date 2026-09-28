// Local-first records for the export tools.
//
// Every record is written to this browser first, so the tools work offline,
// without an account, and on slow connections inside China. When the user is
// signed in and the `tool_records` table exists (supabase/migrations), records
// are also synced to their account; the newest edit of a record wins.
//
// Deletes are kept as tombstones so they sync to other devices too.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const TABLE = 'tool_records'
const bucketKey = (kind, userId) => `nexallure_${kind}_v1:${userId || 'guest'}`

function readBucket(key) {
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((r) => r && typeof r.id === 'string') : []
  } catch {
    return []
  }
}

function writeBucket(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
    return true
  } catch {
    return false // private mode or quota: the page still works for this visit
  }
}

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // RFC 4122 v4 from Math.random for very old browsers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const newer = (a, b) => (Date.parse(a?.updatedAt) || 0) > (Date.parse(b?.updatedAt) || 0)

// Newest edit of each record wins. Exported for tests.
export function mergeRecords(local, remote) {
  const byId = new Map(local.map((r) => [r.id, r]))
  for (const r of remote) {
    const mine = byId.get(r.id)
    if (!mine || newer(r, mine)) byId.set(r.id, r)
  }
  return [...byId.values()]
}

// Errors meaning "the table isn't there yet" rather than a real failure.
const missingTable = (e) => e && (e.code === '42P01' || e.code === 'PGRST205' || e.code === 'PGRST106' || /does not exist|schema cache/i.test(e.message || ''))

const toRow = (r, userId) => ({ id: r.id, user_id: userId, kind: r.kind, doc: r, deleted: !!r.deleted, updated_at: r.updatedAt })

/**
 * useRecords('quote' | 'sample' | 'case', userId)
 * status: 'local' (this device only) | 'syncing' | 'synced' | 'error'
 */
export function useRecords(kind, userId) {
  const key = bucketKey(kind, userId)
  const [all, setAll] = useState(() => readBucket(key))
  const [status, setStatus] = useState('local')
  const cloud = useRef(false)
  const allRef = useRef(all)
  allRef.current = all

  // Switch buckets when the user signs in or out. Records made as a guest on
  // this device join the account the first time someone signs in here.
  useEffect(() => {
    let list = readBucket(key)
    if (userId) {
      const guestKey = bucketKey(kind, null)
      const guest = readBucket(guestKey)
      if (guest.length) {
        list = mergeRecords(list, guest)
        writeBucket(key, list)
        try { localStorage.removeItem(guestKey) } catch { /* ignore */ }
      }
    }
    setAll(list)
  }, [key, kind, userId])

  const persist = useCallback((list) => {
    allRef.current = list
    setAll(list)
    writeBucket(key, list)
  }, [key])

  // Pull the account's records, merge, and push anything newer from here.
  useEffect(() => {
    if (!userId || !supabase) {
      cloud.current = false
      setStatus('local')
      return
    }
    let cancelled = false
    setStatus('syncing')
    ;(async () => {
      const { data, error } = await supabase.from(TABLE).select('doc').eq('user_id', userId).eq('kind', kind)
      if (cancelled) return
      if (error) {
        cloud.current = false
        setStatus(missingTable(error) ? 'local' : 'error')
        if (!missingTable(error)) console.error(`[tools] ${kind} sync failed:`, error)
        return
      }
      cloud.current = true
      const remote = (data || []).map((row) => row.doc).filter((d) => d && d.id)
      const local = readBucket(key)
      const merged = mergeRecords(local, remote)
      const remoteById = new Map(remote.map((r) => [r.id, r]))
      const push = merged.filter((r) => !remoteById.has(r.id) || newer(r, remoteById.get(r.id)))
      writeBucket(key, merged)
      setAll(merged)
      if (push.length) {
        const { error: upErr } = await supabase.from(TABLE).upsert(push.map((r) => toRow(r, userId)))
        if (cancelled) return
        if (upErr) {
          console.error(`[tools] ${kind} upload failed:`, upErr)
          setStatus('error')
          return
        }
      }
      setStatus('synced')
    })()
    return () => { cancelled = true }
  }, [kind, key, userId])

  const pushOne = useCallback(async (record) => {
    if (!cloud.current || !userId || !supabase) return
    setStatus('syncing')
    const { error } = await supabase.from(TABLE).upsert(toRow(record, userId))
    if (error) {
      console.error(`[tools] ${kind} save failed:`, error)
      setStatus('error')
    } else {
      setStatus('synced')
    }
  }, [kind, userId])

  const save = useCallback((record) => {
    const now = new Date().toISOString()
    const list = allRef.current
    const existing = record.id ? list.find((r) => r.id === record.id) : null
    const next = { ...record, kind, id: record.id || newId(), createdAt: record.createdAt || existing?.createdAt || now, updatedAt: now }
    const i = list.findIndex((r) => r.id === next.id)
    persist(i === -1 ? [next, ...list] : list.map((r) => (r.id === next.id ? next : r)))
    pushOne(next)
    return next
  }, [kind, persist, pushOne])

  const saveMany = useCallback((records) => {
    const now = new Date().toISOString()
    const byId = new Map(allRef.current.map((r) => [r.id, r]))
    const saved = records.map((record) => {
      const next = { ...record, kind, id: record.id || newId(), createdAt: record.createdAt || now, updatedAt: now }
      byId.set(next.id, next)
      return next
    })
    persist([...byId.values()])
    if (cloud.current && userId && supabase) {
      setStatus('syncing')
      supabase.from(TABLE).upsert(saved.map((r) => toRow(r, userId))).then(({ error }) => {
        setStatus(error ? 'error' : 'synced')
        if (error) console.error(`[tools] ${kind} import failed:`, error)
      })
    }
    return saved
  }, [kind, persist, userId])

  const remove = useCallback((id) => {
    const target = allRef.current.find((r) => r.id === id)
    if (!target) return
    const tomb = { ...target, deleted: true, updatedAt: new Date().toISOString() }
    persist(allRef.current.map((r) => (r.id === id ? tomb : r)))
    pushOne(tomb)
  }, [persist, pushOne])

  const records = useMemo(
    () => all.filter((r) => !r.deleted).sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)),
    [all],
  )

  return { records, save, saveMany, remove, status }
}

// Next free reference like "S-0007" for records of one kind.
export function nextRef(prefix, records, field = 'ref') {
  const max = records.reduce((m, r) => {
    const n = parseInt(String(r[field] || '').replace(/^\D+-?(\d{4}-)?/, ''), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}
