import { useEffect, useId, useState } from 'react'
import type { Continent } from '../types'
import { CONTINENTS } from '../lib/constants'
import { parseGeo, type GeoValue } from '../lib/select'
import { CONTINENT_VIEW, useWorldMap, type MapCountry } from '../lib/worldMap'
import { inputClass } from './Controls'
import Expander from './Expander'

interface Props {
  value: GeoValue
  onChange: (v: GeoValue) => void
  /** Developments per country in the current view (global developments excluded) */
  counts: Map<string, number>
}

/**
 * Optional interactive map for choosing the geographical scope, collapsed by
 * default. Clicking a country selects it; the continent buttons select and zoom
 * to a continent; the text field accepts any country, continent or "World".
 */
export default function WorldMap({ value, onChange, counts }: Props) {
  const geo = parseGeo(value)
  return (
    <Expander
      label="Show on map"
      hint={
        geo.kind === 'world'
          ? 'Choose a country or continent on an interactive world map'
          : `Currently selected: ${geo.value}. Open the map to change it.`
      }
    >
      <MapBody value={value} onChange={onChange} counts={counts} />
    </Expander>
  )
}

function MapBody({ value, onChange, counts }: Props) {
  const map = useWorldMap()
  const geo = parseGeo(value)
  const [hover, setHover] = useState<MapCountry | null>(null)
  const selectedCountry = geo.kind === 'country' ? map?.countries.find((c) => c.name === geo.value) : undefined

  // The view follows the selection: a continent, or the continent of the selected country.
  const zoom: Continent | 'World' =
    geo.kind === 'continent' ? geo.value : selectedCountry ? selectedCountry.continent : 'World'

  const max = Math.max(1, ...counts.values())
  const fill = (c: MapCountry) => {
    if (selectedCountry?.iso === c.iso) return 'var(--color-pink)'
    const n = counts.get(c.name) ?? 0
    if (n > 0) {
      // Three restrained steps of the ink colour by number of developments.
      const step = n >= max * 0.67 ? 0.55 : n >= max * 0.34 ? 0.42 : 0.3
      return `color-mix(in srgb, var(--color-accent) ${step * 100 + 20}%, var(--color-paper))`
    }
    if (geo.kind === 'continent' && c.continent === geo.value) return 'var(--color-mint-soft)'
    return '#e6e9f2'
  }

  const select = (c: MapCountry) => onChange(selectedCountry?.iso === c.iso ? 'world' : `country:${c.name}`)

  const shown = hover ?? selectedCountry
  const status = shown
    ? `${shown.name}, ${shown.continent}: ${counts.get(shown.name) ?? 0} country-specific ${(counts.get(shown.name) ?? 0) === 1 ? 'development' : 'developments'} in this view`
    : 'Select a country on the map, or a continent below.'

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Zoom to a continent" className="flex flex-wrap gap-1 text-sm">
          {(['World', ...CONTINENTS] as const).map((k) => {
            const active = k === 'World' ? geo.kind === 'world' : geo.kind === 'continent' && geo.value === k
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(k === 'World' ? 'world' : `continent:${k}`)}
                className={`rounded-full px-3 py-1 ${active ? 'bg-accent text-white' : 'text-muted hover:bg-paper-deep hover:text-ink'}`}
              >
                {k}
              </button>
            )
          })}
        </div>
        <PlaceSearch countries={map?.countries ?? []} onChange={onChange} />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-rule bg-paper relative">
        {!map ? (
          <div className="aspect-[2/1] flex items-center justify-center text-sm text-muted">Loading map…</div>
        ) : (
          <svg
            viewBox={CONTINENT_VIEW[zoom]}
            className="block w-full aspect-[2/1]"
            role="group"
            aria-label={`World map, showing ${zoom === 'World' ? 'the whole world' : zoom}. Countries can also be chosen with the search field or the geographical scope list.`}
            onMouseLeave={() => setHover(null)}
          >
            {map.countries.map((c) => (
              <path
                key={c.iso}
                d={c.d}
                fill={fill(c)}
                stroke={hover?.iso === c.iso ? 'var(--color-ink)' : 'var(--color-paper)'}
                strokeWidth={hover?.iso === c.iso ? 0.8 : 0.35}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer"
                data-country={c.name}
                onMouseEnter={() => setHover(c)}
                onClick={() => select(c)}
              >
                <title>{c.name}</title>
              </path>
            ))}
            {/* Draw the hovered outline on top so it is not hidden by neighbours */}
            {hover && <path d={hover.d} fill="none" stroke="var(--color-ink)" strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none" />}
          </svg>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:justify-between text-xs text-muted">
        <p aria-live="polite">{status}</p>
        <p className="flex items-center gap-3 shrink-0">
          <Swatch color="color-mix(in srgb, var(--color-accent) 62%, var(--color-paper))" /> Recorded developments
          <Swatch color="var(--color-pink)" /> Selected
        </p>
      </div>
      <p className="mt-1 text-xs text-faint">
        Shading counts developments recorded for specific countries. Developments with global consequences apply everywhere and are not
        shaded. Borders: Natural Earth (public domain).
      </p>
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return <span aria-hidden className="inline-block h-2.5 w-4 rounded-sm" style={{ background: color }} />
}

/** Free-text place selector with suggestions: countries, continents and "World". */
function PlaceSearch({ countries, onChange }: { countries: MapCountry[]; onChange: (v: GeoValue) => void }) {
  const id = useId()
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')

  const places: { label: string; value: GeoValue }[] = [
    { label: 'World', value: 'world' },
    ...CONTINENTS.map((c) => ({ label: c, value: `continent:${c}` })),
    ...countries.map((c) => ({ label: c.name, value: `country:${c.name}` })),
  ]

  useEffect(() => setMessage(''), [text])

  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

  const resolve = (raw: string) => {
    const q = norm(raw)
    if (!q) return undefined
    return places.find((p) => norm(p.label) === q) ?? places.find((p) => norm(p.label).startsWith(q)) ?? places.find((p) => norm(p.label).includes(q))
  }

  const commit = (raw: string) => {
    const hit = resolve(raw)
    if (hit) {
      onChange(hit.value)
      setText('')
    } else if (raw.trim()) {
      setMessage(`No country or region matches "${raw.trim()}".`)
    }
  }

  return (
    <form
      className="flex flex-col gap-1 lg:w-72"
      onSubmit={(e) => {
        e.preventDefault()
        commit(text)
      }}
    >
      <label htmlFor={id} className="sr-only">
        Type a country or region
      </label>
      <div className="flex">
        <input
          id={id}
          list={`${id}-list`}
          value={text}
          onChange={(e) => {
            const v = e.target.value
            setText(v)
            // Choosing a suggestion from the list applies it immediately.
            const exact = places.find((p) => p.label === v)
            if (exact) {
              onChange(exact.value)
              setText('')
            }
          }}
          placeholder="Type a country or region"
          autoComplete="off"
          className={inputClass}
        />
        <button type="submit" className="ml-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-white hover:bg-accent-ink">
          Go
        </button>
      </div>
      <datalist id={`${id}-list`}>
        {places.map((p) => (
          <option key={p.value} value={p.label} />
        ))}
      </datalist>
      {message && (
        <p role="status" className="text-xs text-muted">
          {message}
        </p>
      )}
    </form>
  )
}
