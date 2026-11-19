// Filtering, period boundaries and ranking. Pure functions, no React.

import type { AppConfig, CategoryId, Continent, Development } from '../types'

// ---------- dates ----------

/** Today's calendar date as YYYY-MM-DD in the viewer's local time zone. */
export function todayIso(config: AppConfig): string {
  if (config.referenceDate) return config.referenceDate
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

function toUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
function fromUtc(dt: Date): string {
  return dt.toISOString().slice(0, 10)
}
function addDays(iso: string, n: number): string {
  const dt = toUtc(iso)
  dt.setUTCDate(dt.getUTCDate() + n)
  return fromUtc(dt)
}

export type PeriodId = '7d' | '30d' | '1y'

export const PERIODS: { id: PeriodId; label: string }[] = [
  { id: '7d', label: 'Last 7 calendar days' },
  { id: '30d', label: 'Last 30 calendar days' },
  { id: '1y', label: 'Last 1 year' },
]

/**
 * Inclusive date range ending today.
 * 7d / 30d: today and the preceding 6 / 29 calendar days.
 * 1y: the day after the same date one year earlier, through today (365 or 366 days).
 */
export function periodRange(period: PeriodId, today: string): { start: string; end: string } {
  if (period === '7d') return { start: addDays(today, -6), end: today }
  if (period === '30d') return { start: addDays(today, -29), end: today }
  const [y, m, d] = today.split('-').map(Number)
  // Clamp 29 February to 28 February in non-leap years.
  const prev = new Date(Date.UTC(y - 1, m - 1, d))
  if (prev.getUTCMonth() !== m - 1) prev.setUTCDate(0)
  return { start: addDays(fromUtc(prev), 1), end: today }
}

// ---------- geography ----------

/** "world", "continent:Europe" or "country:Bulgaria" */
export type GeoValue = string

export function parseGeo(v: GeoValue): { kind: 'world' } | { kind: 'continent'; value: Continent } | { kind: 'country'; value: string } {
  if (v.startsWith('continent:')) return { kind: 'continent', value: v.slice(10) as Continent }
  if (v.startsWith('country:')) return { kind: 'country', value: v.slice(8) }
  return { kind: 'world' }
}

export function geoLabel(v: GeoValue): string {
  const g = parseGeo(v)
  return g.kind === 'world' ? 'World' : g.value
}

/**
 * A development matches a region when its consequences are recorded there.
 * Global developments are included in every region unless `includeGlobal` is false.
 */
export function matchesGeo(d: Development, v: GeoValue, includeGlobal: boolean): boolean {
  const g = parseGeo(v)
  if (g.kind === 'world') return true
  if (d.geography.scope === 'global') return includeGlobal
  if (g.kind === 'continent') return d.geography.continents.includes(g.value)
  return d.geography.countries.includes(g.value)
}

export function countriesIn(items: Development[]): string[] {
  return [...new Set(items.flatMap((d) => d.geography.countries))].sort((a, b) => a.localeCompare(b))
}

// ---------- importance ----------

export type Quadrant = 'hh' | 'lh' | 'hl' | 'll'

export const QUADRANTS: { id: Quadrant; label: string; short: string }[] = [
  { id: 'hh', label: 'High immediate, high long-term significance', short: 'High / High' },
  { id: 'lh', label: 'Low immediate, high long-term significance', short: 'Low / High' },
  { id: 'hl', label: 'High immediate, low long-term significance', short: 'High / Low' },
  { id: 'll', label: 'Low immediate, low long-term significance', short: 'Low / Low' },
]

export function quadrantOf(d: Development, threshold: number): Quadrant {
  const hi = d.scores.immediate >= threshold
  const hl = d.scores.longTerm >= threshold
  return hi && hl ? 'hh' : !hi && hl ? 'lh' : hi && !hl ? 'hl' : 'll'
}

const QUADRANT_ORDER: Record<Quadrant, number> = { hh: 0, lh: 1, hl: 2, ll: 3 }

export function priorityScore(d: Development, config: AppConfig): number {
  const { immediate, longTerm } = config.weights
  return immediate * d.scores.immediate + longTerm * d.scores.longTerm
}

/**
 * Ranking: quadrant first (high/high, then low/high, high/low, low/low),
 * then weighted priority score, then long-term score, then most recent date.
 */
export function rank(items: Development[], config: AppConfig): Development[] {
  return [...items].sort((a, b) => {
    const q = QUADRANT_ORDER[quadrantOf(a, config.highThreshold)] - QUADRANT_ORDER[quadrantOf(b, config.highThreshold)]
    if (q) return q
    const p = priorityScore(b, config) - priorityScore(a, config)
    if (Math.abs(p) > 1e-9) return p
    if (b.scores.longTerm !== a.scores.longTerm) return b.scores.longTerm - a.scores.longTerm
    return b.date.localeCompare(a.date)
  })
}

// ---------- combined filter ----------

export interface Filters {
  start?: string
  end?: string
  year?: number
  geo: GeoValue
  includeGlobal: boolean
  topics: CategoryId[] // empty = all topics
  goodOnly: boolean
  minImmediate?: number
  minLongTerm?: number
  quadrant?: Quadrant
  text?: string
}

export function applyFilters(items: Development[], f: Filters, config: AppConfig): Development[] {
  const q = f.text?.trim().toLowerCase()
  return items.filter((d) => {
    if (f.start && d.date < f.start) return false
    if (f.end && d.date > f.end) return false
    if (f.year && Number(d.date.slice(0, 4)) !== f.year) return false
    if (!matchesGeo(d, f.geo, f.includeGlobal)) return false
    if (f.topics.length && !d.categories.some((c) => f.topics.includes(c))) return false
    if (f.goodOnly && !d.goodNews) return false
    if (f.minImmediate && d.scores.immediate < f.minImmediate) return false
    if (f.minLongTerm && d.scores.longTerm < f.minLongTerm) return false
    if (f.quadrant && quadrantOf(d, config.highThreshold) !== f.quadrant) return false
    if (q) {
      const hay = [
        d.title,
        d.account.outcome,
        d.account.significance,
        d.account.longTerm,
        ...d.geography.countries,
        ...d.geography.continents,
      ]
        .join(' ')
        .toLowerCase()
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
    }
    return true
  })
}

/** Developments per country, counting only country-specific (non-global) entries. */
export function countByCountry(items: Development[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const d of items) {
    if (d.geography.scope === 'global') continue
    for (const c of d.geography.countries) m.set(c, (m.get(c) ?? 0) + 1)
  }
  return m
}
