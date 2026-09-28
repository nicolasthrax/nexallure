import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

// A chainable fake of the Supabase query builder. Every call is recorded so the
// tests can assert on what the component asked the database to do.
const calls = []
let lookupResult = { data: null, error: null }
let insertResult = { error: null }

function builder(table) {
  const chain = {
    select: (...a) => { calls.push([table, 'select', ...a]); return chain },
    eq: (...a) => { calls.push([table, 'eq', ...a]); return chain },
    maybeSingle: () => Promise.resolve(lookupResult),
    insert: (row) => { calls.push([table, 'insert', row]); return Promise.resolve(insertResult) },
    delete: () => { calls.push([table, 'delete']); return chain },
    match: (m) => { calls.push([table, 'match', m]); return Promise.resolve({ error: null }) },
  }
  return chain
}

vi.mock('../lib/supabase.js', () => ({ supabase: { from: (table) => builder(table) } }))
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const { MonitorButton } = await import('../components/MonitorButton.jsx')
const { translations } = await import('../i18n.js')
const t = translations.EN

beforeEach(() => {
  calls.length = 0
  lookupResult = { data: null, error: null }
  insertResult = { error: null }
})
afterEach(cleanup)

describe('MonitorButton', () => {
  it('renders inside a report without crashing (regression: missing useEffect import)', async () => {
    render(<MonitorButton industry="industry_machinery" region="market_eu" t={t} userId="user-1" />)
    expect(await screen.findByRole('button', { name: /monitor this market/i })).toBeTruthy()
  })

  it('checks whether this market is already monitored for the user', async () => {
    render(<MonitorButton industry="industry_machinery" region="market_eu" t={t} userId="user-1" />)
    await waitFor(() => expect(calls.some((c) => c[1] === 'select')).toBe(true))
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'user_id', 'user-1'])
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'category', 'industry_machinery'])
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'region', 'market_eu'])
  })

  it('confirms in a dialog, then inserts the market', async () => {
    render(<MonitorButton industry="industry_machinery" region="market_eu" t={t} userId="user-1" />)
    fireEvent.click(await screen.findByRole('button', { name: /monitor this market/i }))

    const dialog = await screen.findByRole('dialog', { name: /add this market to monitor/i })
    expect(dialog).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^add to monitor$/i }))
    await waitFor(() =>
      expect(calls.find((c) => c[1] === 'insert')?.[2]).toMatchObject({
        user_id: 'user-1',
        category: 'industry_machinery',
        region: 'market_eu',
      }),
    )
    expect(await screen.findByRole('button', { name: /remove from monitor/i })).toBeTruthy()
  })

  it('closes the dialog with Escape and with the labelled close button', async () => {
    render(<MonitorButton industry="industry_textiles" region="market_asean" t={t} userId="user-1" />)
    const open = await screen.findByRole('button', { name: /monitor this market/i })

    fireEvent.click(open)
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    fireEvent.click(open)
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('shows "remove" when the market is already monitored, and deletes it', async () => {
    lookupResult = { data: { id: 'row-1' }, error: null }
    render(<MonitorButton industry="industry_machinery" region="market_eu" t={t} userId="user-1" />)
    fireEvent.click(await screen.findByRole('button', { name: /remove from monitor/i }))
    await waitFor(() =>
      expect(calls).toContainEqual([
        'monitored_markets',
        'match',
        { user_id: 'user-1', category: 'industry_machinery', region: 'market_eu' },
      ]),
    )
  })

  it('does not open the dialog for signed-out visitors', async () => {
    render(<MonitorButton industry="industry_machinery" region="market_eu" t={t} userId={undefined} />)
    fireEvent.click(await screen.findByRole('button', { name: /monitor this market/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stores keys, not labels, so a market saved in English still matches in Chinese', async () => {
    render(<MonitorButton industry="industry_machinery" region="market_eu" userId="user-1" t={translations.ZH} />)
    await waitFor(() => expect(calls.some((c) => c[1] === 'select')).toBe(true))
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'category', 'industry_machinery'])
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'region', 'market_eu'])
    expect(await screen.findByRole('button', { name: translations.ZH.mon_add })).toBeTruthy()
  })
})
