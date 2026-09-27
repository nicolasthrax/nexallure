import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

// A chainable fake of the Supabase query builder. Every call is recorded so the
// tests can assert on what the component asked the database to do.
const calls = []
let lookupResult = { data: null, error: { code: 'PGRST116' } }
let insertResult = { error: null }

function builder(table) {
  const chain = {
    select: (...a) => { calls.push([table, 'select', ...a]); return chain },
    eq: (...a) => { calls.push([table, 'eq', ...a]); return chain },
    single: () => Promise.resolve(lookupResult),
    insert: (row) => { calls.push([table, 'insert', row]); return Promise.resolve(insertResult) },
    delete: () => { calls.push([table, 'delete']); return chain },
    match: (m) => { calls.push([table, 'match', m]); return Promise.resolve({ error: null }) },
  }
  return chain
}

vi.mock('../lib/supabase.js', () => ({ supabase: { from: (table) => builder(table) } }))
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const { MonitorButton } = await import('../components/MonitorButton.jsx')

beforeEach(() => {
  calls.length = 0
  lookupResult = { data: null, error: { code: 'PGRST116' } }
  insertResult = { error: null }
})
afterEach(cleanup)

describe('MonitorButton', () => {
  it('renders inside a report without crashing (regression: missing useEffect import)', async () => {
    render(<MonitorButton industry="Industrial Machinery" region="European Union" userId="user-1" />)
    expect(await screen.findByRole('button', { name: /monitor this market/i })).toBeTruthy()
  })

  it('checks whether this market is already monitored for the user', async () => {
    render(<MonitorButton industry="Industrial Machinery" region="European Union" userId="user-1" />)
    await waitFor(() => expect(calls.some((c) => c[1] === 'select')).toBe(true))
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'user_id', 'user-1'])
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'category', 'Industrial Machinery'])
    expect(calls).toContainEqual(['monitored_markets', 'eq', 'region', 'European Union'])
  })

  it('confirms in a dialog, then inserts the market', async () => {
    render(<MonitorButton industry="Industrial Machinery" region="European Union" userId="user-1" />)
    fireEvent.click(await screen.findByRole('button', { name: /monitor this market/i }))

    const dialog = await screen.findByRole('dialog', { name: /initialize market monitor/i })
    expect(dialog).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /confirm monitoring/i }))
    await waitFor(() =>
      expect(calls.find((c) => c[1] === 'insert')?.[2]).toMatchObject({
        user_id: 'user-1',
        category: 'Industrial Machinery',
        region: 'European Union',
      }),
    )
    expect(await screen.findByRole('button', { name: /remove from monitor/i })).toBeTruthy()
  })

  it('closes the dialog with Escape and with the labelled close button', async () => {
    render(<MonitorButton industry="Textiles" region="ASEAN" userId="user-1" />)
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
    render(<MonitorButton industry="Industrial Machinery" region="European Union" userId="user-1" />)
    fireEvent.click(await screen.findByRole('button', { name: /remove from monitor/i }))
    await waitFor(() =>
      expect(calls).toContainEqual([
        'monitored_markets',
        'match',
        { user_id: 'user-1', category: 'Industrial Machinery', region: 'European Union' },
      ]),
    )
  })

  it('does not open the dialog for signed-out visitors', async () => {
    render(<MonitorButton industry="Industrial Machinery" region="European Union" userId={undefined} />)
    fireEvent.click(await screen.findByRole('button', { name: /monitor this market/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
