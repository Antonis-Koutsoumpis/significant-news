import { Link } from 'react-router-dom'
import { useData } from '../data/DataContext'
import type { CategoryId } from '../types'
import { CATEGORY_IDS } from '../lib/constants'
import { Field, GeoSelect, inputClass, NewsTypeToggle, SelectField, TopicPicker } from '../components/Controls'
import { useId } from 'react'
import WorldMap from '../components/WorldMap'
import ImportanceMatrix from '../components/ImportanceMatrix'
import DevelopmentList from '../components/DevelopmentList'
import { applyFilters, countByCountry, geoLabel, isIsoDate, PERIODS, periodRange, QUADRANTS, quadrantOf, rank, todayIso, type PeriodId, type Quadrant } from '../lib/select'
import { formatDate } from '../lib/text'
import { useQueryState } from '../lib/useQueryState'

export function parseTopics(v: string | undefined): CategoryId[] {
  return (v ?? '').split(',').filter((t): t is CategoryId => CATEGORY_IDS.includes(t as CategoryId))
}

export default function HomePage() {
  const { items, config } = useData()
  const qs = useQueryState()

  const dateId = useId()
  const period = (PERIODS.some((p) => p.id === qs.get('p')) ? qs.get('p') : '7d') as PeriodId
  const geo = qs.get('g') ?? 'world'
  const includeGlobal = qs.get('gl') !== '0'
  const topics = parseTopics(qs.get('t'))
  const goodOnly = qs.get('n') === 'good'
  const quadrant = QUADRANTS.find((q) => q.id === qs.get('q'))?.id as Quadrant | undefined

  const today = todayIso(config)
  // The period ends on the chosen date (default: today) and looks back from there.
  const dParam = qs.get('d')
  const end = isIsoDate(dParam) && dParam < today ? dParam : today
  const range = periodRange(period, end)

  // Counts for the map and country list use every filter except geography.
  const counts = countByCountry(applyFilters(items, { ...range, geo: 'world', includeGlobal: true, topics, goodOnly }, config))
  const inScope = rank(applyFilters(items, { ...range, geo, includeGlobal, topics, goodOnly }, config), config)
  const listed = quadrant ? inScope.filter((d) => quadrantOf(d, config.highThreshold) === quadrant) : inScope

  const phrase = PERIODS.find((p) => p.id === period)!.phrase
  const setEnd = (v: string) => qs.set({ d: isIsoDate(v) && v < today ? v : undefined, q: undefined })

  // For empty views: the most recent development on or before the end date that matches the other filters.
  const latest = applyFilters(items, { end, geo, includeGlobal, topics, goodOnly }, config)
    .map((d) => d.date)
    .sort()
    .at(-1)

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <section className="max-w-3xl">
        <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight tracking-tight">
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

      <section aria-label="Filters" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] border-t border-rule pt-6">
        <Field label="Ending on" htmlFor={dateId}>
          <input id={dateId} type="date" value={end} max={today} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          {end !== today && (
            <button type="button" onClick={() => setEnd(today)} className="self-start text-xs text-accent underline underline-offset-2">
              Back to today
            </button>
          )}
        </Field>
        <SelectField<PeriodId>
          label="Looking back"
          value={period}
          onChange={(v) => qs.set({ p: v === '7d' ? undefined : v, q: undefined })}
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
        <p className="sm:col-span-2 lg:col-span-5 text-sm text-muted">
          Showing the {phrase} ending {end === today ? 'today' : `on ${formatDate(end)}`}:{' '}
          <span className="text-ink font-medium">{formatDate(range.start)}</span> to{' '}
          <span className="text-ink font-medium">{formatDate(range.end)}</span>, inclusive. Developments are dated by the day their
          definitive stage was reached.
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
        <EmptyState
          phrase={phrase}
          end={end === today ? 'today' : `on ${formatDate(end)}`}
          geo={geo}
          goodOnly={goodOnly}
          hasTopics={topics.length > 0}
          latest={latest}
          onJump={latest ? () => setEnd(latest) : undefined}
        />
      ) : (
        <>
          <ImportanceMatrix ranked={inScope} threshold={config.highThreshold} active={quadrant} onSelectQuadrant={(q) => qs.set({ q })} />

          <section aria-labelledby="list-heading">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 id="list-heading" className="font-display font-semibold text-xl">
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

function EmptyState({
  phrase,
  end,
  geo,
  goodOnly,
  hasTopics,
  latest,
  onJump,
}: {
  phrase: string
  end: string
  geo: string
  goodOnly: boolean
  hasTopics: boolean
  latest?: string
  onJump?: () => void
}) {
  return (
    <section className="max-w-prose rounded-xl bg-paper-deep px-6 py-7">
      <h2 className="font-display font-semibold text-xl">No concluded developments in this period</h2>
      <p className="mt-3 text-muted">
        The archive holds no {goodOnly ? 'good-news ' : ''}developments for the {phrase} ending {end}
        {geo !== 'world' ? ` in ${geoLabel(geo)}` : ''}
        {hasTopics ? ' in the selected topics' : ''}. Entries are published only once a development has reached a definitive outcome
        and has been verified, so short periods are often empty.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {onJump && latest && (
          <button type="button" onClick={onJump} className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">
            Show the period ending {formatDate(latest)}, the latest recorded development
          </button>
        )}
        <Link to="/archive" className="text-accent underline underline-offset-2 text-sm">
          Browse the full archive
        </Link>
      </div>
    </section>
  )
}
