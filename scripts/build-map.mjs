// Generates src/data/world-map.json: one pre-projected SVG path per country,
// with its English name and continent. Run once with `npm run build:map`
// (only needed if you change the projection or the name overrides below).
// The output is committed, so the app draws the map with no network access and
// no mapping library at runtime.
//
// Sources: Natural Earth 1:50m admin-0 boundaries (public domain) via the
// world-atlas package; ISO codes via i18n-iso-countries; continents and names
// via countries-list.

import { writeFileSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { presimplify, quantile, simplify } from 'topojson-simplify'
import isoCountries from 'i18n-iso-countries'
import { countries as countryInfo } from 'countries-list'

const require = createRequire(import.meta.url)
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'))

const WIDTH = 1000
const HEIGHT = 500

// Common English names used in the dataset. Anything not listed here uses countries-list.
const NAME_OVERRIDES = {
  CZ: 'Czechia',
  US: 'United States',
  GB: 'United Kingdom',
  KR: 'South Korea',
  KP: 'North Korea',
  CD: 'Democratic Republic of the Congo',
  CG: 'Republic of the Congo',
  CI: "Côte d'Ivoire",
  MK: 'North Macedonia',
  SZ: 'Eswatini',
  TL: 'Timor-Leste',
  MM: 'Myanmar',
  VA: 'Vatican City',
  PS: 'Palestine',
  TR: 'Türkiye',
}

// Continent assignments that differ from countries-list (UN geoscheme).
const CONTINENT_OVERRIDES = { RU: 'Europe' }

// Territories without an ISO numeric code in Natural Earth.
const UNCODED = {
  Kosovo: { iso: 'XK', continent: 'Europe' },
  'N. Cyprus': { iso: 'XN', continent: 'Asia', name: 'Northern Cyprus' },
  Somaliland: { iso: 'XS', continent: 'Africa' },
}

const CONTINENT = { AF: 'Africa', AS: 'Asia', EU: 'Europe', NA: 'North America', SA: 'South America', OC: 'Oceania' }

const simplified = simplify(presimplify(topo), quantile(presimplify(topo), 0.1))
const fc = feature(simplified, simplified.objects.countries)

const projection = geoEqualEarth().fitExtent(
  [[4, 4], [WIDTH - 4, HEIGHT - 4]],
  { type: 'FeatureCollection', features: fc.features.filter((f) => f.properties.name !== 'Antarctica') },
)
const path = geoPath(projection).digits(1)

const out = []
const skipped = []
for (const f of fc.features) {
  const atlasName = f.properties.name
  let iso, continent, name
  if (f.id) {
    iso = isoCountries.numericToAlpha2(f.id)
    const info = iso && countryInfo[iso]
    continent = CONTINENT_OVERRIDES[iso] ?? (info && CONTINENT[info.continent])
    name = NAME_OVERRIDES[iso] ?? info?.name
  } else if (UNCODED[atlasName]) {
    ;({ iso, continent } = UNCODED[atlasName])
    name = UNCODED[atlasName].name ?? atlasName
  }
  if (!iso || !continent || !name) {
    skipped.push(atlasName)
    continue
  }
  const d = path(f)
  if (!d) continue
  const [[x0, y0], [x1, y1]] = path.bounds(f)
  const bbox = [x0, y0, x1, y1].map((v) => Math.round(v * 10) / 10)
  const existing = out.find((c) => c.iso === iso)
  if (existing) {
    // Several Natural Earth features can share one ISO code (e.g. Australian islands).
    existing.d += d
    existing.bbox = [Math.min(existing.bbox[0], bbox[0]), Math.min(existing.bbox[1], bbox[1]), Math.max(existing.bbox[2], bbox[2]), Math.max(existing.bbox[3], bbox[3])]
  } else {
    out.push({ iso, name, continent, d, bbox })
  }
}

out.sort((a, b) => a.name.localeCompare(b.name))
const json = JSON.stringify({ width: WIDTH, height: HEIGHT, countries: out })
writeFileSync(new URL('../src/data/world-map.json', import.meta.url), json + '\n')
console.log(`${out.length} countries written, ${(json.length / 1024).toFixed(0)} KB. Skipped: ${skipped.join(', ') || 'none'}`)
