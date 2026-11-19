import { useEffect, useId, useRef, type ReactNode } from 'react'
import type { CategoryId, Development } from '../types'
import { CATEGORIES, CONTINENTS } from '../lib/constants'
import { countriesIn } from '../lib/select'
import { useWorldMap } from '../lib/worldMap'

const fieldClass =
  'w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink hover:border-faint focus:border-accent'

export function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <select id={id} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/** World / continents / individual countries (countries derived from the dataset). */
export function GeoSelect({
  value,
  onChange,
  items,
  includeGlobal,
  onIncludeGlobal,
  counts,
}: {
  value: string
  onChange: (v: string) => void
  items: Development[]
  includeGlobal: boolean
  onIncludeGlobal: (v: boolean) => void
  counts: Map<string, number>
}) {
  const id = useId()
  const map = useWorldMap()
  // All countries on the map, so any country chosen there also appears here.
  const countries = map ? map.countries.map((c) => c.name) : countriesIn(items)
  return (
    <Field label="Geographical scope" htmlFor={id}>
      <select id={id} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="world">World</option>
        <optgroup label="Continents">
          {CONTINENTS.map((c) => (
            <option key={c} value={`continent:${c}`}>
              {c}
            </option>
          ))}
        </optgroup>
        <optgroup label="Countries">
          {countries.map((c) => (
            <option key={c} value={`country:${c}`}>
              {c}
              {counts.get(c) ? ` (${counts.get(c)})` : ''}
            </option>
          ))}
        </optgroup>
      </select>
      {value !== 'world' && (
        <label className="flex items-center gap-2 text-xs text-muted mt-1">
          <input type="checkbox" checked={includeGlobal} onChange={(e) => onIncludeGlobal(e.target.checked)} className="accent-accent" />
          Include developments with global consequences
        </label>
      )}
    </Field>
  )
}

export function TopicPicker({ value, onChange }: { value: CategoryId[]; onChange: (v: CategoryId[]) => void }) {
  const all = value.length === 0
  const toggle = (id: CategoryId) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  const ref = useRef<HTMLDetailsElement>(null)

  // Close the topic list on an outside click or Escape, like a native menu.
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current
      if (!el?.open) return
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !el.contains(e.target as Node)) el.open = false
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [])

  const summary = all ? 'All topics' : value.length === 1 ? CATEGORIES.find((c) => c.id === value[0])!.label : `${value.length} topics selected`

  return (
    <Field label="Subject matter">
      <details ref={ref} className="group relative">
        <summary className={`${fieldClass} cursor-pointer list-none select-none flex justify-between items-center`}>
          <span className="truncate">{summary}</span>
          <span aria-hidden className="text-faint ml-2 group-open:rotate-180 transition-transform text-xs">▾</span>
        </summary>
        <fieldset className="sm:absolute z-10 mt-1 w-full sm:w-80 rounded-xl border border-rule bg-paper p-3 shadow-lg shadow-ink/5">
          <legend className="sr-only">Choose one or more topics</legend>
          <label className="flex items-center gap-2 py-1 text-sm">
            <input type="checkbox" checked={all} onChange={() => onChange([])} className="accent-accent" />
            All topics
          </label>
          <hr className="border-rule my-1.5" />
          {CATEGORIES.map((c) => (
            <label key={c.id} className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={value.includes(c.id)} onChange={() => toggle(c.id)} className="accent-accent" />
              {c.label}
            </label>
          ))}
        </fieldset>
      </details>
    </Field>
  )
}

export function NewsTypeToggle({ goodOnly, onChange }: { goodOnly: boolean; onChange: (v: boolean) => void }) {
  const opt = (active: boolean, good: boolean) =>
    `flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? (good ? 'bg-mint-soft text-mint-ink' : 'bg-accent text-white') : 'text-muted hover:text-ink'
    }`
  return (
    <Field label="Type of news">
      <div role="radiogroup" aria-label="Type of news" className="flex gap-1 rounded-full border border-rule p-1">
        <button type="button" role="radio" aria-checked={!goodOnly} className={opt(!goodOnly, false)} onClick={() => onChange(false)}>
          All news
        </button>
        <button type="button" role="radio" aria-checked={goodOnly} className={opt(goodOnly, true)} onClick={() => onChange(true)}>
          Good news
        </button>
      </div>
    </Field>
  )
}

export const inputClass = fieldClass
