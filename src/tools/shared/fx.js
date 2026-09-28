// Reference exchange rates (European Central Bank, via Frankfurter). They are
// a starting point: a quote should use the rate the factory's bank offers.

const URL_ = 'https://api.frankfurter.dev/v1/latest?base=CNY&symbols=USD,EUR,GBP,AUD,CAD,JPY'
const KEY = 'nexallure_fx_ref'
// The dirham is pegged to the dollar, and the ECB does not publish it.
const AED_PER_USD = 3.6725

export function cachedRates() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    return v && v.rates ? v : null
  } catch {
    return null
  }
}

// Resolves to { date, rates: { USD: yuan per dollar, ... } }.
export async function fetchRates() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(URL_, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rates = {}
    for (const [cur, perYuan] of Object.entries(data.rates || {})) {
      if (perYuan > 0) rates[cur] = Math.round((1 / perYuan) * 1e4) / 1e4
    }
    if (!rates.USD) throw new Error('no USD rate')
    rates.AED = Math.round((rates.USD / AED_PER_USD) * 1e4) / 1e4
    const out = { date: data.date, rates }
    try { localStorage.setItem(KEY, JSON.stringify(out)) } catch { /* ignore */ }
    return out
  } finally {
    clearTimeout(timer)
  }
}
