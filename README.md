# The Record

A curated archive of the world's most consequential **concluded** developments, ranked by reach and long-term significance rather than recency.

Pilot built with React, TypeScript, Vite and Tailwind CSS. Data is stored as JSON. No backend, no accounts, no paid services.

## Quick start

Requires [Node.js](https://nodejs.org) 22 or later (free).

```bash
npm install        # install dependencies (once)
npm run dev        # start a local server at http://localhost:5173
```

Other commands:

| Command | What it does |
|---|---|
| `npm run validate` | Checks the dataset against the editorial rules (required fields, 200-word limit, scores 1–10, sources, etc.) |
| `npm run build` | Validates, type-checks and builds the static site into `dist/` |
| `npm run preview` | Serves the built `dist/` locally at http://localhost:4173 |
| `npm run build:map` | Regenerates the world map data (only needed if you change the projection or country names) |

Once installed, the app runs fully offline, including the map. Only the linked sources and the hosted image need an internet connection.

## Choosing a region

The geographical scope can be set in three ways, all kept in sync:

- **Map:** click a country to select it (click it again to return to World). Use the continent buttons above the map to select and zoom to a continent. Shading shows how many country-specific developments match the other filters. Global developments apply everywhere and are not shaded.
- **Typing:** enter any country, continent or "World" in the search field. Suggestions appear as you type, and partial or unaccented names work (for example `bulg` or `cote d`).
- **List:** the Geographical scope dropdown lists every country on the map. Numbers in brackets show matching developments.

The map can be hidden with *Hide map*; the browser remembers the choice.

> Opening `dist/index.html` directly by double-clicking will not work, because browsers block local data files loaded that way. Use `npm run preview`, or any static file server.

## Project structure

```
public/data/
  developments.json   ← the dataset (one object per development)
  config.json         ← thresholds, ranking weights, reading speed, word limit
scripts/validate.ts   ← command-line dataset validator
scripts/build-map.mjs ← generates src/data/world-map.json
src/
  types.ts            ← the data model (read this before adding entries)
  data/repository.ts  ← data access layer (swap JSON for an API/database here)
  data/DataContext.tsx← loads + validates data, provides it to the app
  data/world-map.json ← generated country shapes (Natural Earth, public domain)
  components/WorldMap.tsx ← interactive map and typeable place search
  lib/select.ts       ← period boundaries, filters, quadrants, ranking
  lib/validate.ts     ← validation rules shared by app and script
  lib/text.ts         ← word count, reading time, date formatting
  components/         ← filter controls, importance matrix, ranked list
  pages/              ← Home, Archive, Development detail, Methodology
.github/workflows/deploy.yml ← free deployment to GitHub Pages
```

## Adding a development

You only edit `public/data/developments.json`. No code changes are needed.

1. Copy an existing entry and change every field. The full schema, with comments, is in `src/types.ts`.
2. `id` is the permanent URL (`#/development/<id>`). Use a lowercase slug such as `2026-country-adopts-x`, and never change it after publication.
3. `date` is the day the **definitive** stage was reached (e.g. entry into force, ruling delivered), not the day of first reporting.
4. `account.outcome` holds established facts only. `significance` and `longTerm` are shown under an "Editorial assessment" label. All three together must be ≤ 200 words.
5. `scores.immediate` and `scores.longTerm` are integers 1–10, with a written `rationale`.
6. `goodNews: true` requires a `goodNewsRationale` naming the demonstrated benefit. Commitments and optimistic framing alone do not qualify.
7. `geography.scope` is `global`, `international` or `national`. List the continents and countries where the **consequences** occur. Country names must match the map's names (see `src/data/world-map.json`, e.g. `United States`, `Czechia`, `Türkiye`); `npm run validate` warns about any mismatch.
8. `sources` need at least one primary source (`official`, `intergovernmental`, `peer-reviewed`) or several independent ones.
9. `image` is optional. Include one only if it is relevant and openly licensed, with author, licence and the file page URL. Leave it out otherwise.
10. Use `statusNote` when later stages remain open, so an unresolved process is not presented as concluded.
11. Run `npm run validate`. Entries with errors are not shown by the app and fail the build.

To change the ranking method, edit `public/data/config.json`:
- `highThreshold` sets the score that counts as "high" in the matrix.
- `weights` set the order within a quadrant.
- `referenceDate` fixes "today" (e.g. `"2026-06-30"`) for reproducible demos. Leave it `null` to use the real date.

## Deploying free to GitHub Pages

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Each push to `main` runs `.github/workflows/deploy.yml`, which validates, builds and publishes the site to `https://<user>.github.io/<repo>/`.

The build uses relative paths and hash-based URLs (`#/archive`, `#/development/<id>`), so it works under any repository name and needs no server configuration.

## Ranking, in brief

Developments are placed in a 2 × 2 matrix by their two scores. The list shows the high/high quadrant first, then low/high, high/low and low/low. Within each quadrant, entries are ordered by `0.4 × immediate + 0.6 × long-term`, then by long-term score, then by date. The full method is on the in-app Methodology page.

## Limitations and external dependencies

- **Small, manually curated dataset.** There are 14 real developments (Aug 2024 – Apr 2026). Coverage is uneven: Sports, Culture, Business and Energy currently have no entries, and the "last 7 / 30 days" views are empty until new entries are added. The app shows an explanation when a view is empty.
- **Scores are editorial judgements**, not measurements, and are labelled as such throughout.
- **Images:** one entry has an image (public domain, Wikimedia Commons), loaded from Wikimedia at view time. The rest are text-only because no licence-verified image was confirmed. Add images only after checking the file's Commons page.
- **External links** point to third-party sites that may change or disappear. Each entry shows its review date.
- **No automation.** There is no scraping and no AI-generated publishing. A future pipeline should feed entries through the same validation and a human review step.
- **Future backend:** implement the `DataSource` interface in `src/data/repository.ts` (for example, against a free Supabase or SQLite-backed API) and the rest of the app stays unchanged.
- **Map:** borders are Natural Earth 1:50m (public domain), simplified and pre-projected (Equal Earth) at build time. Very small states are hard to click; use the search field or list for those. Borders follow Natural Earth's de facto conventions and imply no position on disputed territories.
- Runtime dependencies: `react`, `react-dom`, `react-router-dom` (all MIT-licensed). Build tools: Vite, TypeScript, Tailwind CSS; map generation uses world-atlas, d3-geo, topojson-client, topojson-simplify, i18n-iso-countries and countries-list (all free, open-source).
