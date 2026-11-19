import { Link } from 'react-router-dom'
import { useData } from '../data/DataContext'
import type { CategoryId } from '../types'
import { CATEGORY_IDS } from '../lib/constants'
import { GeoSelect, NewsTypeToggle, SelectField, TopicPicker } from '../components/Controls'
import WorldMap from '../components/WorldMap'
import ImportanceMatrix from '../components/ImportanceMatrix'
import DevelopmentList from '../components/DevelopmentList'
import { applyFilters, countByCountry, geoLabel, PERIODS, periodRange, QUADRANTS, quadrantOf, rank, todayIso, type PeriodId, type Quadrant } from '../lib/select'
import { formatDate } from '../lib/text'
import { useQueryState } from '../lib/useQueryState'

export function parseTopics(v: string | undefined): CategoryId[] {
  return (v ?? '').split(',').filter((t): t is CategoryId => CATEGORY_IDS.includes(t as CategoryId))
}

export default function HomePage() {
  const { items, config } = useData()
  const qs = useQueryState()

  const period = (PERIODS.some((p) => p.id === qs.get('p')) ? qs.get('p') : '1y') as PeriodId
  const geo = qs.get('g') ?? 'world'
  const includeGlobal = qs.get('gl') !== '0'
  const topics = parseTopics(qs.get('t'))
  const goodOnly = qs.get('n') === 'good'
  const quadrant = QUADRANTS.find((q) => q.id === qs.get('q'))?.id as Quadrant | undefined

  const today = todayIso(config)
  const range = periodRange(period, today)

  // Counts for the map and country list use every filter except geography.
  const counts = countByCountry(applyFilters(items, { ...range, geo: 'world', includeGlobal: true, topics, goodOnly }, config))
  const inScope = rank(applyFilters(items, { ...range, geo, includeGlobal, topics, goodOnly }, config), config)
  const listed = quadrant ? inScope.filter((d) => quadrantOf(d, config.highThreshold) === quadrant) : inScope

  const periodLabel = PERIODS.find((p) => p.id === period)!.label.toLowerCase()

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <section className="max-w-3xl">
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight tracking-tight">
          A record of the developments that will matter longest.
        </h1>
        <p className="mt-4 text-muted leading-relaxed">
          The Record documents concluded developments rather than continuous news. Each entry is selected for the number of people
          affected, the likely duration of its consequences, its contribution to or harm to human welfare, and its geographical reach.
          Only developments that have reached a definitive stage and are supported by reliable sources are published.{' '}
          <Link to="/methodology" className="text-accent underline underline-offset-2">
            How entries are selected
          </Link>
          .
        </p>
      </section>

      <section aria-label="Filters" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-rule pt-6">
        <SelectField<PeriodId>
          label="Time period"
          value={period}
          onChange={(v) => qs.set({ p: v === '1y' ? undefined : v })}
          options={PERIODS.map((p) => ({ value: p.id, label: p.label }))}
        />
        <GeoSelect
          value={geo}
          onChange={(v) => qs.set({ g: v === 'world' ? undefined : v })}
          items={items}
          includeGlobal={includeGlobal}
          onIncludeGlobal={(v) => qs.set({ gl: v ? undefined : '0' })}
          counts={counts}
        />
        <TopicPicker value={topics} onChange={(v) => qs.set({ t: v.join(',') || undefined })} />
        <NewsTypeToggle goodOnly={goodOnly} onChange={(v) => qs.set({ n: v ? 'good' : undefined })} />
        <p className="sm:col-span-2 lg:col-span-4 text-sm text-muted">
          Period covered: <span className="text-ink">{formatDate(range.start)}</span> to{' '}
          <span className="text-ink">{formatDate(range.end)}</span>, inclusive. Developments are dated by the day their definitive stage
          was reached.
          {qs.hasAny && (
            <>
              {' '}
              <button type="button" onClick={qs.reset} className="text-accent underline underline-offset-2">
                Reset filters
              </button>
            </>
          )}
        </p>
      </section>

      <WorldMap value={geo} onChange={(v) => qs.set({ g: v === 'world' ? undefined : v })} counts={counts} />

      {inScope.length === 0 ? (
        <EmptyState periodLabel={periodLabel} geo={geo} goodOnly={goodOnly} hasTopics={topics.length > 0} />
      ) : (
        <>
          <ImportanceMatrix ranked={inScope} threshold={config.highThreshold} active={quadrant} onSelectQuadrant={(q) => qs.set({ q })} />

          <section aria-labelledby="list-heading">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 id="list-heading" className="font-serif text-xl">
                Ranked developments
              </h2>
              <span className="text-sm text-muted">
                {listed.length} of {inScope.length}
                {quadrant && ` · ${QUADRANTS.find((q) => q.id === quadrant)!.short}`}
              </span>
            </div>
            <DevelopmentList items={listed} threshold={config.highThreshold} numbered={!quadrant} />
            {quadrant && (
              <p className="mt-3 text-xs text-faint">Numbering is hidden while a quadrant is selected; the matrix keeps the overall ranking.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function EmptyState({ periodLabel, geo, goodOnly, hasTopics }: { periodLabel: string; geo: string; goodOnly: boolean; hasTopics: boolean }) {
  return (
    <section className="max-w-prose border-y border-rule py-8">
      <h2 className="font-serif text-xl">No concluded developments recorded</h2>
      <p className="mt-3 text-muted">
        The archive holds no {goodOnly ? 'good-news ' : ''}developments for the {periodLabel}
        {geo !== 'world' ? ` in ${geoLabel(geo)}` : ''}
        {hasTopics ? ' in the selected topics' : ''}. This is expected for short periods: entries are published only once a
        development has reached a definitive outcome and has been verified, which usually takes longer than a few days.
      </p>
      <p className="mt-3">
        <Link to="/archive" className="text-accent underline underline-offset-2">
          Browse the full archive
        </Link>
      </p>
    </section>
  )
}
