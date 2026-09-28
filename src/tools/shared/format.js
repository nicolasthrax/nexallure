// Number and date formatting for the tools, in the reader's language.

const LOCALE = { EN: 'en-GB', ZH: 'zh-CN', TW: 'zh-TW' }
const loc = (lang) => LOCALE[lang] || 'en-GB'

export const toNum = (v, d = 0) => {
  const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : d
}

export function money(v, currency, lang, dp = 2) {
  if (!Number.isFinite(v)) return '—'
  try {
    return new Intl.NumberFormat(loc(lang), { style: 'currency', currency, minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v)
  } catch {
    return `${currency} ${v.toFixed(dp)}`
  }
}

export const yuan = (v, lang, dp = 0) => money(v, 'CNY', lang, dp)

export function number(v, lang, dp = 0) {
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat(loc(lang), { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v)
}

export function percent(v, lang, dp = 1) {
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat(loc(lang), { style: 'percent', minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v)
}

export function date(v, lang, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(loc(lang), opts)
}

export function dateTime(v, lang) {
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(loc(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// "in 5 h", "2 d late": for due dates.
export function relative(due, t, now = Date.now()) {
  const diff = due - now
  const h = Math.round(Math.abs(diff) / 3600000)
  const d = Math.round(Math.abs(diff) / 86400000)
  const span = h < 36 ? t.tl_hours.replace('{n}', Math.max(1, h)) : t.tl_days.replace('{n}', d)
  return diff < 0 ? t.tl_late.replace('{span}', span) : t.tl_in.replace('{span}', span)
}

export function download(filename, text, type = 'text/csv;charset=utf-8') {
  // A byte-order mark so Excel opens Chinese text in UTF-8.
  const blob = new Blob([type.startsWith('text/csv') ? '﻿' + text : text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
