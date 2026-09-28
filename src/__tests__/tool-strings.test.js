// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { translations } from '../i18n.js'
import { PAYMENT_TERMS } from '../tools/quote/presets.js'
import { CASE_COLUMNS, CASE_TYPES, DISCIPLINES, RESOLUTIONS, ROOT_CAUSES, SAMPLE_COLUMNS, SAMPLE_STAGES, SEVERITIES } from '../tools/tracker/model.js'
import { CASE_TEMPLATES, SAMPLE_TEMPLATES } from '../tools/tracker/composer.js'
import { STATUSES } from '../tools/quote/QuoteList.jsx'

// Keys the tools build at run time (t[`q_pay_${k}`]) are invisible to the
// static check in i18n.test.js, so list every family here.
const families = {
  q_pay_: Object.keys(PAYMENT_TERMS),
  q_rate_: ['freight', 'origin', 'haulage', 'dest', 'delivery'],
  q_status_: STATUSES,
  q_w_: ['no_fx', 'part_carton', 'rebate_gt_vat', 'no_carton', 'ddp_no_duty', 'no_plan', 'sea_term_air', 'fca_hint', 'below_floor', 'lcl_big'],
  q_part_: ['goods', 'overhead', 'tax', 'origin', 'freight', 'destination', 'terms', 'profit'],
  q_add_: ['haulage', 'origin', 'freight', 'insurance', 'dest', 'duty'],
  tr_cause_: ROOT_CAUSES,
  tr_ccol_: CASE_COLUMNS,
  tr_col_: SAMPLE_COLUMNS.map((c) => c.id),
  tr_d_: [...DISCIPLINES, ...DISCIPLINES.map((d) => `${d}_help`)],
  tr_funnel_: ['requested', 'transit', 'delivered', 'won'],
  tr_lost_: ['price', 'quality', 'lead_time', 'no_reply', 'cancelled', 'competitor', 'other'],
  tr_policy_: ['free', 'buyer_pays', 'credit'],
  tr_res_: RESOLUTIONS,
  tr_sev_: SEVERITIES,
  tr_stage_: SAMPLE_STAGES,
  tr_tpl_: [...SAMPLE_TEMPLATES, ...CASE_TEMPLATES],
  tr_type_: CASE_TYPES,
  tr_why_: ['approve', 'update', 'qc', 'track', 'feedback', 'cold', 'step'],
}

describe('tool strings', () => {
  it('every dynamically built key exists in every language', () => {
    const missing = []
    for (const lang of ['EN', 'ZH', 'TW']) {
      for (const [prefix, values] of Object.entries(families)) {
        for (const v of values) if (!translations[lang][prefix + v]) missing.push(`${lang}.${prefix}${v}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('placeholders match across languages', () => {
    const holes = (s) => (s.match(/\{[a-z]+\}/g) || []).sort().join()
    const bad = Object.keys(translations.EN).filter((k) => ['ZH', 'TW'].some((l) => holes(translations[l][k]) !== holes(translations.EN[k])))
    expect(bad).toEqual([])
  })
})
