import { Link } from 'react-router-dom'
import type { Development } from '../types'
import { QUADRANTS, quadrantOf, type Quadrant } from '../lib/select'

interface Props {
  ranked: Development[]
  threshold: number
  active?: Quadrant
  onSelectQuadrant: (q: Quadrant | undefined) => void
}

// Scores 1–10 are mapped to the centre of ten equal bands on each axis.
const pos = (score: number) => ((score - 0.5) / 10) * 100

export default function ImportanceMatrix({ ranked, threshold, active, onSelectQuadrant }: Props) {
  const split = pos(threshold) - 5 // boundary between (threshold-1) and threshold

  // Offset markers that share the same coordinates so all stay visible and clickable.
  const seen = new Map<string, number>()
  const points = ranked.map((d, i) => {
    const key = `${d.scores.immediate}-${d.scores.longTerm}`
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    return { d, rank: i + 1, n }
  })
  const counts = Object.fromEntries(QUADRANTS.map((q) => [q.id, 0])) as Record<Quadrant, number>
  ranked.forEach((d) => counts[quadrantOf(d, threshold)]++)

  const cornerLabel = 'hidden sm:block absolute text-[11px] leading-tight uppercase tracking-wider text-faint pointer-events-none max-w-[45%]'

  return (
    <section aria-labelledby="matrix-heading">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 id="matrix-heading" className="font-display font-semibold text-xl">
          Importance matrix
        </h2>
        {active && (
          <button type="button" onClick={() => onSelectQuadrant(undefined)} className="text-sm text-accent underline underline-offset-2">
            Show all quadrants
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex items-center">
          <span className="text-xs text-muted [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">Long-term significance →</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-xl border border-rule bg-paper">
            {/* high/high quadrant receives a faint tint: it is the priority quadrant */}
            <div className="absolute bg-accent-soft/70" style={{ left: `${split}%`, right: 0, top: 0, bottom: `${split}%` }} />
            <div className="absolute top-0 bottom-0 border-l border-dashed border-rule" style={{ left: `${split}%` }} />
            <div className="absolute left-0 right-0 border-t border-dashed border-rule" style={{ bottom: `${split}%` }} />

            <span className={`${cornerLabel} right-2 top-2 text-right text-accent-ink font-medium`}>High immediate / High long-term</span>
            <span className={`${cornerLabel} left-2 top-2`}>Low immediate / High long-term</span>
            <span className={`${cornerLabel} right-2 bottom-2 text-right`}>High immediate / Low long-term</span>
            <span className={`${cornerLabel} left-2 bottom-2`}>Low immediate / Low long-term</span>

            {points.map(({ d, rank, n }) => {
              const faded = active && quadrantOf(d, threshold) !== active
              return (
                <Link
                  key={d.id}
                  to={`/development/${d.id}`}
                  title={`${rank}. ${d.title} — immediate ${d.scores.immediate}, long-term ${d.scores.longTerm}`}
                  aria-label={`${rank}. ${d.title}. Immediate significance ${d.scores.immediate}, long-term significance ${d.scores.longTerm}.`}
                  className={`absolute -translate-x-1/2 translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] tabular-nums transition-opacity ${
                    faded ? 'opacity-25' : ''
                  } ${quadrantOf(d, threshold) === 'hh' ? 'bg-pink border-pink' : 'bg-accent border-accent'} text-white font-medium hover:bg-ink hover:border-ink`}
                  style={{ left: `calc(${pos(d.scores.immediate)}% + ${n * 16}px)`, bottom: `${pos(d.scores.longTerm)}%` }}
                >
                  {rank}
                </Link>
              )
            })}
          </div>
          <div className="text-xs text-muted text-right mt-1.5">Immediate significance →</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Filter the list by quadrant">
        {QUADRANTS.map((q) => {
          const on = active === q.id
          return (
            <button
              key={q.id}
              type="button"
              aria-pressed={on}
              onClick={() => onSelectQuadrant(on ? undefined : q.id)}
              className={`text-left rounded-lg border px-3 py-2 text-xs ${on ? 'border-accent bg-accent text-white' : 'border-rule hover:border-accent'}`}
            >
              <span className="block font-medium uppercase tracking-wider">{q.short}</span>
              <span className={on ? 'text-white/85' : 'text-muted'}>
                {counts[q.id]} {counts[q.id] === 1 ? 'development' : 'developments'}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-faint">
        A score of {threshold} or above counts as high. Numbers correspond to the ranked list. Select a quadrant to narrow the list.
      </p>
    </section>
  )
}
