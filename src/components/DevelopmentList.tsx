import { Link } from 'react-router-dom'
import type { Development } from '../types'
import { CATEGORY_LABEL, SCOPE_LABEL } from '../lib/constants'
import { formatDate } from '../lib/text'
import { quadrantOf } from '../lib/select'

export function geographyText(d: Development): string {
  const g = d.geography
  if (g.scope === 'global') return 'Global'
  if (g.countries.length === 1) return `${g.countries[0]}, ${g.continents.join(', ')}`
  if (g.countries.length > 1 && g.countries.length <= 4) return g.countries.join(', ')
  return `${SCOPE_LABEL[g.scope]}: ${g.continents.join(', ')}`
}

export function firstSentence(text: string): string {
  const m = text.match(/^.+?[.!?](\s|$)/)
  return (m ? m[0] : text).trim()
}

export function ScorePair({ d }: { d: Development }) {
  return (
    <span className="tabular-nums whitespace-nowrap">
      Immediate {d.scores.immediate} · Long-term {d.scores.longTerm}
    </span>
  )
}

interface Props {
  items: Development[]
  threshold: number
  numbered?: boolean
}

export default function DevelopmentList({ items, threshold, numbered = true }: Props) {
  return (
    <ol className="divide-y divide-rule border-y border-rule">
      {items.map((d, i) => {
        const prominent = quadrantOf(d, threshold) === 'hh'
        return (
          <li key={d.id} className="py-5 sm:py-6 grid grid-cols-[2rem_1fr] sm:grid-cols-[2.5rem_1fr] gap-x-3">
            <span className="font-display font-bold text-lg text-pink tabular-nums leading-tight">{numbered ? i + 1 : ''}</span>
            <article>
              <h3 className={`font-serif leading-snug ${prominent ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                <Link to={`/development/${d.id}`} className="hover:text-accent hover:underline underline-offset-4 decoration-1">
                  {d.title}
                </Link>
              </h3>
              <p className="mt-1.5 text-xs text-muted flex flex-wrap gap-x-3 gap-y-1">
                <time dateTime={d.date}>{formatDate(d.date)}</time>
                <span>{geographyText(d)}</span>
                <ScorePair d={d} />
                {d.demonstration && <span className="uppercase tracking-wider">Demonstration entry</span>}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {d.goodNews && <span className="rounded-full bg-mint-soft px-2.5 py-0.5 text-xs font-medium text-mint-ink">Good news</span>}
                {d.categories.map((c) => (
                  <span key={c} className="rounded-full bg-paper-deep px-2.5 py-0.5 text-xs text-accent-ink">
                    {CATEGORY_LABEL[c]}
                  </span>
                ))}
              </p>
              <p className="mt-2 font-serif text-[15px] text-ink/85 max-w-prose">{firstSentence(d.account.outcome)}</p>
              {d.statusNote && <p className="mt-1.5 text-xs text-muted italic max-w-prose">{d.statusNote}</p>}
            </article>
          </li>
        )
      })}
    </ol>
  )
}
