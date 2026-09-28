import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase admin client for server-side JWT verification.
// Uses the SERVICE_ROLE key so we can call supabase.auth.getUser(token)
// without a valid session cookie on the server.
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ---------------------------------------------------------------------------
// Trusted origins for CORS — only our production domain and localhost for dev.
// Remove the wildcard '*' to prevent cross-origin abuse.
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://nexallure.com',
  'https://www.nexallure.com',
  'http://localhost:5173',   // Vite dev server
  'http://localhost:3000',   // Alternative dev port
]

function getCorsOrigin(req) {
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/')
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin
  return null
}

// ---------------------------------------------------------------------------
// TODO: Rate Limiting with Vercel KV
// ---------------------------------------------------------------------------
// This endpoint should be rate-limited to prevent Denial-of-Wallet attacks
// against our Groq API quota. Implementation plan:
//
// 1. Install:  npm i @vercel/kv
//
// 2. Set up a Vercel KV store (redis) in your Vercel dashboard and ensure
//    the KV_REST_API_URL and KV_REST_API_TOKEN env vars are available.
//
// 3. At the top of the handler (after auth check), add:
//
//    import { kv } from '@vercel/kv'
//
//    const userKey = `ratelimit:market-guide:${user.id}`
//    const count   = await kv.incr(userKey)
//    if (count === 1) await kv.expire(userKey, 60)   // 1-minute window
//    if (count > 5) {
//      return res.status(429).json({ error: 'Rate limit exceeded', detail: 'Please wait a minute before requesting another guide.' })
//    }
//
// This enforces a maximum of 5 requests per minute per authenticated user.
// Adjust the threshold (5) or window (60s) as needed.
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // --- CORS: Only allow trusted origins ------------------------------------
  const corsOrigin = getCorsOrigin(req)
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin)
    res.setHeader('Vary', 'Origin')           // required when origin is dynamic
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // --- Authentication: Require a valid Supabase JWT -------------------------
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', detail: 'Missing or invalid Authorization header.' })
  }

  const token = authHeader.replace('Bearer ', '').trim()

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized', detail: 'Invalid or expired token.' })
  }

  // Safe request body parsing to guard against undefined body or raw strings
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  const { industry, market, language } = body

  // Server-side validation allowlist
  const VALID_INDUSTRIES = [
    'industry_automotive', 'industry_electronics', 'industry_machinery', 
    'industry_textiles', 'industry_chemicals', 'industry_pharma', 
    'industry_food', 'industry_logistics', 'industry_other'
  ]
  const VALID_MARKETS = [
    'any', 'market_us', 'market_eu', 'market_uk', 'market_asean', 
    'market_gcc', 'market_latam', 'market_africa', 'market_sa', 'market_anz'
  ]

  if (!industry || !market || !VALID_INDUSTRIES.includes(industry) || !VALID_MARKETS.includes(market)) {
    return res.status(400).json({ 
      error: 'Invalid input parameters', 
      detail: 'The provided industry or market is missing or not supported.' 
    })
  }

  let langInstruction = ''
  // The "severity" and "tier" codes drive the report's styling, so they stay in English.
  const keepCodes = ' Exception: "severity" must stay exactly HIGH, MED or LOW, and "tier" must stay exactly PRIMARY, SECONDARY or NICHE, in English.'
  if (language === 'ZH') langInstruction = 'ALL string values in the JSON must be written in Simplified Chinese (中文简体). Do not use English for any values, only keys stay in English.' + keepCodes
  if (language === 'TW') langInstruction = 'ALL string values in the JSON must be written in Traditional Chinese (中文繁體). Do not use English for any values, only keys stay in English.' + keepCodes

  const systemPrompt = `You are a senior B2B export intelligence analyst with 20+ years advising Chinese manufacturers on entering foreign markets. You have deep insider knowledge of trade flows, procurement behavior, platform algorithms, and common failure modes.

Your task: produce a data-rich, specific intelligence report for a ${industry} manufacturer targeting ${market}.

Respond ONLY with valid JSON. No preamble, no markdown, no code fences. ${langInstruction}

The JSON must have EXACTLY these keys and follow this structural format:

{
  "opportunity_scores": [
    { "label": "Market Size", "score": 75 },
    { "label": "Entry Ease", "score": 60 },
    { "label": "Competition", "score": 80 },
    { "label": "Margin Potential", "score": 65 },
    { "label": "Growth Rate", "score": 70 }
  ],
  "buyer_regions": [
    { "country": "Germany", "concentration": 35, "note": "Largest importer of industrial machinery in EU" }
  ],
  "buyer_criteria_radar": [
    { "label": "Price", "value": 85 },
    { "label": "Quality", "value": 90 },
    { "label": "Certifications", "value": 95 },
    { "label": "Lead Time", "value": 70 },
    { "label": "MOQ Flex", "value": 60 },
    { "label": "After-Sales", "value": 75 }
  ],
  "platform_scores": [
    { "name": "Alibaba", "score": 85, "tier": "PRIMARY" }
  ],
  "outreach_channels": [
    "Hannover Messe 2025"
  ],
  "outreach_detail": [
    "Message procurement managers directly on LinkedIn — use local language intro, attach CE certificate in first message"
  ],
  "mistakes_structured": [
    { "mistake": "Failing to secure CE markings prior to shipping, causing custom seizures.", "severity": "HIGH" }
  ]
}

Structural Rules for Lists:
- "buyer_regions": Provide 5-7 specific countries with real concentration percentages that sum to approximately 100, each with a short insider note.
- "platform_scores": Provide 6-8 real platforms specific to the industry/market, scored by actual buyer traffic and conversion. Use tiers: PRIMARY, SECONDARY, or NICHE.
- "outreach_channels": Provide 3-6 short action-oriented channel names.
- "outreach_detail": Provide 3-4 specific insider tactics with concrete detail.
- "mistakes_structured": Provide 5-6 mistakes total, each with severity HIGH, MED or LOW, at least 2 of them HIGH, specific to this industry/market.

Be ruthlessly specific. Name real trade shows, real platforms, real certification requirements (CE, FCC, ISO numbers), real countries with real import data context. This should read like a briefing from someone who has done this for 20 years, not a generic overview.`

  const fallbackResponse = {
    opportunity_scores: [],
    buyer_regions: [],
    buyer_criteria_radar: [],
    platform_scores: [],
    outreach_channels: [],
    outreach_detail: [],
    mistakes_structured: []
  }

  try {
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Industry: ${industry}\nTarget market: ${market}` },
          ],
          max_tokens: 2000,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      }
    )

    const data = await groqRes.json()

    if (!groqRes.ok) {
      console.error('Groq error:', data.error)
      return res.status(502).json({ error: 'Groq API error', detail: data.error?.message })
    }

    const raw = data.choices?.[0]?.message?.content
    if (!raw) {
      console.error('No content in Groq response:', data)
      return res.status(502).json({ error: 'No response from Groq' })
    }
    
    try {
      // Clean occasional markdown blocks that LLM engines produce despite JSON Mode
      const cleanedRaw = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanedRaw)
      return res.status(200).json(parsed)
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr)
      console.error('Raw text attempted to parse:', raw)
      return res.status(200).json(fallbackResponse)
    }
  } catch (err) {
    // Internal logging for debugging — never leak stack traces to the client
    console.error('Handler error:', err)
    return res.status(500).json({ error: 'An internal server error occurred' })
  }
}
