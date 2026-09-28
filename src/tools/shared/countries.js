// Country names from the browser's own locale data (Intl.DisplayNames), so
// every language gets correct names without shipping a table.

// Groupings and reserved codes, plus retired ones for engines that do not
// canonicalise them (DD = East Germany would shadow DE).
const NOT_COUNTRIES = new Set(['EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ', 'AC', 'CP', 'DG', 'EA', 'IC', 'TA', 'CQ', 'DD', 'BU', 'FX', 'TP', 'YU', 'ZR', 'CS', 'NT', 'SU', 'YD', 'UK', 'AN', 'HV', 'DY', 'NH', 'RH', 'VD'])
const LOCALES = { EN: 'en', ZH: 'zh-Hans', TW: 'zh-Hant' }

// Retired codes canonicalise to their successor (HV -> BF, SU -> RU).
function canonical(c) {
  try { return new Intl.Locale(`und-${c}`).region === c } catch { return true }
}

let codes = null
function countryCodes() {
  if (codes) return codes
  codes = []
  let dn = null
  try { dn = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' }) } catch { /* old browser */ }
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const c = String.fromCharCode(a, b)
      if (NOT_COUNTRIES.has(c) || !canonical(c)) continue
      if (dn && dn.of(c)) codes.push(c)
    }
  }
  return codes
}

const cache = {}
function names(lang) {
  const locale = LOCALES[lang] || 'en'
  if (cache[locale]) return cache[locale]
  let dn = null
  try { dn = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' }) } catch { /* old browser */ }
  cache[locale] = (c) => (dn ? dn.of(c) : c)
  return cache[locale]
}

export const countryName = (code, lang) => (code ? names(lang)(code) : '')

const sorted = {}
export function countryOptions(lang) {
  if (sorted[lang]) return sorted[lang]
  const name = names(lang)
  const collator = new Intl.Collator(LOCALES[lang] || 'en')
  sorted[lang] = countryCodes().map((c) => ({ code: c, name: name(c) })).sort((x, y) => collator.compare(x.name, y.name))
  return sorted[lang]
}

// "Germany", "德国", "de" -> "DE". Unknown text is returned unchanged.
export function toCountryCode(input) {
  const s = String(input || '').trim()
  if (!s) return ''
  if (/^[a-z]{2}$/i.test(s) && countryCodes().includes(s.toUpperCase())) return s.toUpperCase()
  const want = s.toLowerCase()
  for (const lang of Object.keys(LOCALES)) {
    const name = names(lang)
    const hit = countryCodes().find((c) => String(name(c)).toLowerCase() === want)
    if (hit) return hit
  }
  return s
}
