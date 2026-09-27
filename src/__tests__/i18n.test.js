// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { translations } from '../i18n.js'

const LANGS = ['EN', 'ZH', 'TW']

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(p)
    return /\.jsx?$/.test(e.name) && e.name !== 'i18n.js' ? [p] : []
  })
}

describe('translations', () => {
  it('every language has exactly the same keys', () => {
    const en = Object.keys(translations.EN).sort()
    for (const lang of LANGS) {
      expect(Object.keys(translations[lang]).sort(), lang).toEqual(en)
    }
  })

  it('no translation is empty', () => {
    for (const lang of LANGS) {
      const empty = Object.entries(translations[lang]).filter(([, v]) => typeof v !== 'string' || !v.trim())
      expect(empty.map(([k]) => k), lang).toEqual([])
    }
  })

  it('every t.key the code reads exists (catches silent English fallbacks)', () => {
    const src = sourceFiles(path.resolve(__dirname, '..')).map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    const used = new Set([...src.matchAll(/\bt\??\.([a-z][a-z0-9_]*)\b/g)].map((m) => m[1]))
    used.delete('_lang') // set at runtime, not a translation
    const missing = [...used].filter((k) => !(k in translations.EN))
    expect(missing).toEqual([])
  })
})
