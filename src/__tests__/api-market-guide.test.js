// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Supabase auth: "good-token" belongs to a user, anything else is rejected.
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token) =>
        token === 'good-token'
          ? { data: { user: { id: 'user-1' } }, error: null }
          : { data: { user: null }, error: { message: 'invalid JWT' } },
    },
  }),
}))

const { default: handler } = await import('../../api/market-guide.js')

function call({ method = 'POST', headers = {}, body } = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v },
    status(code) { this.statusCode = code; return this },
    json(obj) { this.payload = obj; return this },
    end() { return this },
  }
  const req = { method, headers: { origin: 'https://nexallure.com', ...headers }, body }
  return handler(req, res).then(() => res)
}

const auth = { authorization: 'Bearer good-token' }
const validBody = { industry: 'industry_machinery', market: 'market_eu', language: 'EN' }
const report = {
  opportunity_scores: [{ label: 'Market Size', score: 75 }],
  buyer_regions: [{ country: 'Germany', concentration: 35, note: 'x' }],
  buyer_criteria_radar: [], platform_scores: [], outreach_channels: [],
  outreach_detail: [], mistakes_structured: [],
}

function groqReplies(content, { ok = true, error } = {}) {
  return vi.fn(async () => ({
    ok,
    json: async () => (ok ? { choices: [{ message: { content } }] } : { error }),
  }))
}

beforeEach(() => { process.env.GROQ_API_KEY = 'test-key' })
afterEach(() => { vi.unstubAllGlobals() })

describe('POST /api/market-guide', () => {
  it('answers CORS preflight for the production origin', async () => {
    const res = await call({ method: 'OPTIONS' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('https://nexallure.com')
  })

  it('does not grant CORS to unknown origins', async () => {
    const res = await call({ method: 'OPTIONS', headers: { origin: 'https://evil.example' } })
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('rejects other methods', async () => {
    expect((await call({ method: 'GET' })).statusCode).toBe(405)
  })

  it('requires a bearer token', async () => {
    const res = await call({ body: validBody })
    expect(res.statusCode).toBe(401)
  })

  it('rejects an invalid token', async () => {
    const res = await call({ headers: { authorization: 'Bearer nope' }, body: validBody })
    expect(res.statusCode).toBe(401)
    expect(res.payload.detail).toMatch(/invalid or expired/i)
  })

  it('validates industry and market', async () => {
    const res = await call({ headers: auth, body: { industry: 'industry_spaceships', market: 'market_eu' } })
    expect(res.statusCode).toBe(400)
  })

  it('returns the parsed report and asks Groq in the requested language', async () => {
    const fetchMock = groqReplies(JSON.stringify(report))
    vi.stubGlobal('fetch', fetchMock)
    const res = await call({ headers: auth, body: { ...validBody, language: 'ZH' } })

    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual(report)
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.response_format).toEqual({ type: 'json_object' })
    expect(sent.messages[0].content).toMatch(/Simplified Chinese/)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-key')
  })

  it('accepts a JSON body sent as a string and strips markdown fences', async () => {
    vi.stubGlobal('fetch', groqReplies('```json\n' + JSON.stringify(report) + '\n```'))
    const res = await call({ headers: auth, body: JSON.stringify(validBody) })
    expect(res.statusCode).toBe(200)
    expect(res.payload.buyer_regions[0].country).toBe('Germany')
  })

  it('falls back to an empty report when the model returns broken JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', groqReplies('{not json'))
    const res = await call({ headers: auth, body: validBody })
    expect(res.statusCode).toBe(200)
    expect(res.payload.opportunity_scores).toEqual([])
  })

  it('reports upstream Groq failures as 502 with their message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', groqReplies(null, { ok: false, error: { message: 'Rate limit reached' } }))
    const res = await call({ headers: auth, body: validBody })
    expect(res.statusCode).toBe(502)
    expect(res.payload.detail).toBe('Rate limit reached')
  })
})
