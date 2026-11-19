import { useId } from 'react'
import { useData } from '../data/DataContext'
import { Field, GeoSelect, inputClass, NewsTypeToggle, SelectField, TopicPicker } from '../components/Controls'
import WorldMap from '../components/WorldMap'
import DevelopmentList from '../components/DevelopmentList'
import { applyFilters, countByCountry, rank } from '../lib/select'
import { useQueryState } from '../lib/useQueryState'
import { parseTopics } from './HomePage'
import type { Development } from '../types'

const SCORE_OPTIONS = [
  { value: '', label: 'Any' },
  ...[9, 8, 7, 6, 5, 4, 3, 2].map((n) => ({ value: String(n), label: `${n} or higher` })),
]

type Sort = 'date' | 'rank'

export default function ArchivePage() {
  const { items, config } = useData()
  const qs = useQueryState()
  const searchId = useId()

  const years = [...new Set(items.map((d) => Number(d.date.slice(0, 4))))].sort((a, b) => b - a)
  const yearParam = Number(qs.get('y'))
  const year = years.includes(yearParam) ? yearParam : undefined
  const geo = qs.get('g') ?? 'world'
  const includeGlobal = qs.get('gl') !== '0'
  const topics = parseTopics(qs.get('t'))
  const goodOnly = qs.get('n') === 'good'
  const minImmediate = Number(qs.get('mi')) || undefined
  const minLongTerm = Number(qs.get('ml')) || undefined
  const text = qs.get('s') ?? ''
  const sort: Sort = qs.get('o') === 'rank' ? 'rank' : 'date'

  const counts = countByCountry(applyFilters(items, { year, geo: 'world', includeGlobal: true, topics, goodOnly, minImmediate, minLongTerm, text }, config))
  const filtered = applyFilters(items, { year, geo, includeGlobal, topics, goodOnly, minImmediate, minLongTerm, text }, config)
  const results = sort === 'rank' ? rank(filtered, config) : [...filtered].sort((a, b) => b.date.localeCompare(a.date))

  const groups: [number, Development[]][] =
    sort === 'date'
      ? [...new Set(results.map((d) => Number(d.date.slice(0, 4))))].map((y) => [y, results.filter((d) => d.date.startsWith(String(y)))])
      : []

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-3xl">
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">Archive</h1>
        <p className="mt-3 text-muted">
          All {items.length} published developments, searchable and filterable. Each entry has a permanent address that will not change.
        </p>
      </header>

      <section aria-label="Archive filters" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-rule pt-6">
        <div className="sm:col-span-2">
          <Field label="Search" htmlFor={searchId}>
            <input
              id={searchId}
              type="search"
              value={text}
              onChange={(e) => qs.set({ s: e.target.value || undefined })}
              placeholder="Words in the title or account"
              className={inputClass}
            />
          </Field>
        </div>
        <SelectField
          label="Year"
          value={year ? String(year) : ''}
          onChange={(v) => qs.set({ y: v || undefined })}
          options={[{ value: '', label: 'All years' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
        />
        <SelectField<Sort>
          label="Order"
          value={sort}
          onChange={(v) => qs.set({ o: v === 'date' ? undefined : v })}
          options={[
            { value: 'date', label: 'By date, newest first' },
            { value: 'rank', label: 'By significance' },
          ]}
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
        <SelectField
          label="Immediate significance"
          value={minImmediate ? String(minImmediate) : ''}
          onChange={(v) => qs.set({ mi: v || undefined })}
          options={SCORE_OPTIONS}
        />
        <SelectField
          label="Long-term significance"
          value={minLongTerm ? String(minLongTerm) : ''}
          onChange={(v) => qs.set({ ml: v || undefined })}
          options={SCORE_OPTIONS}
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <NewsTypeToggle goodOnly={goodOnly} onChange={(v) => qs.set({ n: v ? 'good' : undefined })} />
        </div>
        <p className="sm:col-span-2 lg:col-span-3 self-end text-sm text-muted">
          {results.length} {results.length === 1 ? 'development' : 'developments'} found.
          {qs.hasAny && (
            <>
              {' '}
              <button type="button" onClick={qs.reset} className="text-accent underline underline-offset-2">
                Clear all filters
              </button>
            </>
          )}
        </p>
      </section>

      <WorldMap value={geo} onChange={(v) => qs.set({ g: v === 'world' ? undefined : v })} counts={counts} />

      {results.length === 0 ? (
        <p className="border-y border-rule py-8 text-muted">No developments match these filters.</p>
      ) : sort === 'rank' ? (
        <DevelopmentList items={results} threshold={config.highThreshold} />
      ) : (
        groups.map(([y, list]) => (
          <section key={y} aria-labelledby={`y-${y}`}>
            <h2 id={`y-${y}`} className="font-display font-semibold text-2xl mb-3 tabular-nums">
              {y}
            </h2>
            <DevelopmentList items={list} threshold={config.highThreshold} numbered={false} />
          </section>
        ))
      )}
    </div>
  )
}
