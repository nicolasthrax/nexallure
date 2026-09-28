// Reference data for the quoting engine. Nothing here is a live rate: freight,
// FX and tariff figures are always entered by the user. These presets only
// decide *how* things are calculated (customs valuation basis, import VAT).

// Where customs duty is charged on the FOB value (the US, Canada, Australia
// value goods at the point of export) versus on CIF (the EU, UK and most of
// the world). Import VAT/GST is the headline rate: reduced rates exist, and
// the user can edit it.
export const DESTINATIONS = [
  { code: 'DE', valuation: 'CIF', vat: 19, ports: ['Hamburg · DEHAM', 'Bremerhaven · DEBRV'] },
  { code: 'NL', valuation: 'CIF', vat: 21, ports: ['Rotterdam · NLRTM'] },
  { code: 'BE', valuation: 'CIF', vat: 21, ports: ['Antwerp · BEANR'] },
  { code: 'FR', valuation: 'CIF', vat: 20, ports: ['Le Havre · FRLEH'] },
  { code: 'IT', valuation: 'CIF', vat: 22, ports: ['Genoa · ITGOA'] },
  { code: 'ES', valuation: 'CIF', vat: 21, ports: ['Valencia · ESVLC'] },
  { code: 'PL', valuation: 'CIF', vat: 23, ports: ['Gdańsk · PLGDN'] },
  { code: 'GB', valuation: 'CIF', vat: 20, ports: ['Felixstowe · GBFXT', 'Southampton · GBSOU'] },
  // US: MPF 0.3464% (subject to a minimum and cap) + HMF 0.125% on sea freight.
  { code: 'US', valuation: 'FOB', vat: 0, fees: 0.4714, ports: ['Los Angeles · USLAX', 'Long Beach · USLGB', 'New York · USNYC', 'Savannah · USSAV'] },
  { code: 'CA', valuation: 'FOB', vat: 5, ports: ['Vancouver · CAVAN'] },
  { code: 'AU', valuation: 'FOB', vat: 10, ports: ['Sydney · AUSYD', 'Melbourne · AUMEL'] },
  { code: 'JP', valuation: 'CIF', vat: 10, ports: ['Tokyo · JPTYO', 'Osaka · JPOSA'] },
  { code: 'KR', valuation: 'CIF', vat: 10, ports: ['Busan · KRPUS'] },
  { code: 'AE', valuation: 'CIF', vat: 5, ports: ['Jebel Ali · AEJEA'] },
  { code: 'SA', valuation: 'CIF', vat: 15, ports: ['Jeddah · SAJED', 'Dammam · SADMM'] },
  { code: 'MX', valuation: 'CIF', vat: 16, ports: ['Manzanillo · MXZLO'] },
  { code: 'OTHER', valuation: 'CIF', vat: 0, ports: [] },
]
export const destination = (code) => DESTINATIONS.find((d) => d.code === code) || DESTINATIONS[DESTINATIONS.length - 1]

export const ORIGIN_PORTS = [
  'Ningbo · CNNGB', 'Shanghai · CNSHA', 'Shenzhen Yantian · CNYTN', 'Shenzhen Shekou · CNSHK',
  'Guangzhou Nansha · CNNSA', 'Qingdao · CNTAO', 'Xiamen · CNXMN', 'Tianjin Xingang · CNTXG', 'Dalian · CNDLC',
]

// Tranches of each payment term: share of the invoice and when it arrives,
// in days after the goods ship (negative = before). Bank costs are typical
// China-side charges; every number is editable in the quote.
export const PAYMENT_TERMS = {
  TT_ADVANCE: { tranches: [[1, -20]], bankPct: 0, bankFlat: 30 },
  TT_30_70_BL: { tranches: [[0.3, -30], [0.7, 10]], bankPct: 0, bankFlat: 60 },
  TT_30_70_BEFORE: { tranches: [[0.3, -30], [0.7, -3]], bankPct: 0, bankFlat: 60 },
  LC_SIGHT: { tranches: [[1, 14]], bankPct: 0.25, bankFlat: 150 },
  LC_60: { tranches: [[1, 74]], bankPct: 0.35, bankFlat: 150 },
  DP_SIGHT: { tranches: [[1, 21]], bankPct: 0.15, bankFlat: 80 },
  OA_30: { tranches: [[1, 30]], bankPct: 0, bankFlat: 30 },
  OA_60: { tranches: [[1, 60]], bankPct: 0, bankFlat: 30 },
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'AED']

// Sea and inland-waterway terms versus terms for any mode. Quoting FOB/CFR/
// CIF on air freight is a classic error: risk transfers "on board a vessel".
export const SEA_TERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP']
export const ANY_MODE_TERMS = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DDP']
export const SEA_ONLY = new Set(['FOB', 'CFR', 'CIF'])

// What each term adds on top of the one before it.
export const TERM_ADDS = {
  EXW: [],
  FCA: ['haulage', 'docs'],
  FOB: ['haulage', 'docs', 'origin'],
  CFR: ['haulage', 'docs', 'origin', 'freight'],
  CPT: ['haulage', 'docs', 'origin', 'freight'],
  CIF: ['haulage', 'docs', 'origin', 'freight', 'insurance'],
  CIP: ['haulage', 'docs', 'origin', 'freight', 'insurance'],
  DAP: ['haulage', 'docs', 'origin', 'freight', 'insurance', 'dest', 'delivery'],
  DDP: ['haulage', 'docs', 'origin', 'freight', 'insurance', 'dest', 'delivery', 'broker', 'duty', 'importVat'],
}
