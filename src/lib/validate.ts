// Dataset validation. Used by the app at load time (problems are shown on the
// Methodology page and in the console) and by `npm run validate` before builds.
// Imports use explicit .ts extensions so Node can run this file directly.

import type { AppConfig, Development } from '../types.ts'
import { CATEGORY_IDS, CONTINENTS, SOURCE_TYPES } from './constants.ts'
import { accountWords } from './text.ts'

export interface Issue {
  id: string
  level: 'error' | 'warning'
  message: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function validateDataset(items: Development[], config: AppConfig): Issue[] {
  const issues: Issue[] = []
  const seen = new Set<string>()

  items.forEach((d, i) => {
    const id = d?.id ?? `#${i}`
    const err = (message: string) => issues.push({ id, level: 'error', message })
    const warn = (message: string) => issues.push({ id, level: 'warning', message })

    if (!d.id || !SLUG.test(d.id)) err('id must be a lowercase slug (letters, digits, hyphens)')
    if (seen.has(d.id)) err('duplicate id')
    seen.add(d.id)

    if (!d.title?.trim()) err('title is required')
    if (!ISO_DATE.test(d.date ?? '')) err('date must be YYYY-MM-DD')
    if (!ISO_DATE.test(d.reviewed ?? '')) err('reviewed must be YYYY-MM-DD')

    const g = d.geography
    if (!g) err('geography is required')
    else {
      if (!['global', 'international', 'national'].includes(g.scope)) err('geography.scope is invalid')
      if (!Array.isArray(g.continents) || g.continents.length === 0) err('at least one continent is required')
      g.continents?.forEach((c) => {
        if (!CONTINENTS.includes(c)) err(`unknown continent "${c}"`)
      })
      if (!Array.isArray(g.countries)) err('geography.countries must be an array (may be empty)')
      if (g.scope === 'national' && g.countries?.length !== 1) warn('national scope normally lists exactly one country')
    }

    if (!Array.isArray(d.categories) || d.categories.length === 0) err('at least one category is required')
    d.categories?.forEach((c) => {
      if (!CATEGORY_IDS.includes(c)) err(`unknown category "${c}"`)
    })

    const s = d.scores
    for (const k of ['immediate', 'longTerm'] as const) {
      const v = s?.[k]
      if (!Number.isInteger(v) || v < 1 || v > 10) err(`scores.${k} must be an integer 1–10`)
    }
    if (!s?.rationale?.trim()) err('scores.rationale is required')

    if (typeof d.goodNews !== 'boolean') err('goodNews must be true or false')
    if (d.goodNews && !d.goodNewsRationale?.trim()) err('goodNewsRationale is required when goodNews is true')

    const a = d.account
    if (!a?.outcome?.trim() || !a?.significance?.trim() || !a?.longTerm?.trim()) {
      err('account.outcome, account.significance and account.longTerm are all required')
    } else {
      const words = accountWords(d)
      if (words > config.maxWords) err(`account is ${words} words; the limit is ${config.maxWords}`)
    }

    if (!Array.isArray(d.sources) || d.sources.length === 0) {
      err('at least one source is required')
    } else {
      d.sources.forEach((src, j) => {
        if (!/^https:\/\//.test(src.url ?? '')) err(`source ${j + 1}: url must start with https://`)
        if (!src.title?.trim() || !src.publisher?.trim()) err(`source ${j + 1}: title and publisher are required`)
        if (!SOURCE_TYPES.includes(src.type)) err(`source ${j + 1}: unknown type "${src.type}"`)
      })
      const primary = d.sources.some((x) => x.type === 'official' || x.type === 'intergovernmental' || x.type === 'peer-reviewed')
      if (d.sources.length < 2 && !primary) warn('only one source and it is not a primary document; add corroboration')
    }

    if (d.image) {
      const im = d.image
      if (!im.src || !im.alt || !im.author || !im.license || !im.sourceUrl) {
        err('image needs src, alt, author, license and sourceUrl')
      }
    }
  })

  return issues
}
