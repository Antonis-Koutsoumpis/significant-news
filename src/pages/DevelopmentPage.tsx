import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { CATEGORY_LABEL, SCOPE_LABEL, SOURCE_TYPE_LABEL } from '../lib/constants'
import { accountWords, formatDate, readingMinutes } from '../lib/text'
import { QUADRANTS, quadrantOf } from '../lib/select'
import NotFound from './NotFound'

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2.5 grid grid-cols-[7.5rem_1fr] gap-3 border-b border-rule last:border-b-0 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums">{value} / 10</span>
      </div>
      <div className="mt-1 h-1.5 bg-paper-deep" aria-hidden>
        <div className="h-full bg-accent" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}

export default function DevelopmentPage() {
  const { id } = useParams()
  const { items, config } = useData()
  const d = items.find((x) => x.id === id)
  if (!d) return <NotFound what="development" />

  const words = accountWords(d)
  const minutes = readingMinutes(words, config.wordsPerMinute)
  const quadrant = QUADRANTS.find((q) => q.id === quadrantOf(d, config.highThreshold))!
  const g = d.geography
  const permalink = `${window.location.origin}${window.location.pathname}#/development/${d.id}`

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
      <div className="min-w-0">
        <p className="text-sm text-muted">
          <Link to="/archive" className="hover:text-ink underline underline-offset-2">
            Archive
          </Link>{' '}
          / {d.date.slice(0, 4)}
        </p>
        {d.demonstration && (
          <p className="mt-4 border border-rule bg-paper-deep px-4 py-2 text-sm">
            Demonstration entry. This is not a real development and is included only to show the format.
          </p>
        )}
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight tracking-tight">{d.title}</h1>
        <p className="mt-3 text-sm text-muted">
          <time dateTime={d.date}>{formatDate(d.date)}</time> · {minutes} min read ({words} words)
        </p>
        {d.statusNote && <p className="mt-4 text-sm italic text-muted max-w-prose border-l-2 border-rule pl-3">{d.statusNote}</p>}

        {d.image && (
          <figure className="mt-8">
            <img src={d.image.src} alt={d.image.alt} loading="lazy" className="w-full max-h-[28rem] object-cover bg-paper-deep" />
            <figcaption className="mt-2 text-xs text-muted">
              {d.image.caption && <span>{d.image.caption} </span>}
              Image: {d.image.author},{' '}
              {d.image.licenseUrl ? (
                <a href={d.image.licenseUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                  {d.image.license}
                </a>
              ) : (
                d.image.license
              )}
              , via{' '}
              <a href={d.image.sourceUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                {/wikimedia\.org/.test(d.image.sourceUrl) ? 'Wikimedia Commons' : new URL(d.image.sourceUrl).hostname}
              </a>
              .
            </figcaption>
          </figure>
        )}

        <div className="mt-8 font-serif text-lg leading-relaxed max-w-prose prose-record">
          <p>{d.account.outcome}</p>
          <p className="mt-6 text-xs font-sans uppercase tracking-wider text-faint">Editorial assessment</p>
          <p className="!mt-2">{d.account.significance}</p>
          <p>{d.account.longTerm}</p>
        </div>

        <section className="mt-12 max-w-prose" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="font-serif text-xl">
            Sources
          </h2>
          <ol className="mt-3 list-decimal pl-5 space-y-3 text-sm">
            {d.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2 break-words">
                  {s.title}
                </a>
                <span className="block text-muted">
                  {s.publisher} · {SOURCE_TYPE_LABEL[s.type]}
                  {s.date && ` · ${formatDate(s.date)}`}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-faint">
            The account above is an original summary. External pages may change or move after the review date.
          </p>
        </section>
      </div>

      <aside className="lg:pt-10">
        <h2 className="sr-only">Classification</h2>
        <div className="space-y-3 border-y border-rule py-4">
          <ScoreBar label="Immediate significance" value={d.scores.immediate} />
          <ScoreBar label="Long-term significance" value={d.scores.longTerm} />
          <p className="text-xs text-muted pt-1">{quadrant.label}</p>
          <p className="text-sm leading-relaxed">{d.scores.rationale}</p>
          <p className="text-xs text-faint">
            Scores are editorial judgements against the{' '}
            <Link to="/methodology" className="underline underline-offset-2">
              published criteria
            </Link>
            , not scientific measurements.
          </p>
        </div>
        <dl className="mt-2">
          <Meta label="Scope">{SCOPE_LABEL[g.scope]}</Meta>
          <Meta label="Continents">{g.scope === 'global' ? 'All' : g.continents.join(', ')}</Meta>
          {g.countries.length > 0 && <Meta label={g.countries.length === 1 ? 'Country' : 'Countries'}>{g.countries.join(', ')}</Meta>}
          <Meta label="Subject">{d.categories.map((c) => CATEGORY_LABEL[c]).join('; ')}</Meta>
          <Meta label="Good news">{d.goodNews ? 'Yes' : 'No'}</Meta>
          {d.goodNews && d.goodNewsRationale && <Meta label="Basis">{d.goodNewsRationale}</Meta>}
          <Meta label="Reviewed">{formatDate(d.reviewed)}</Meta>
          <Meta label="Permanent link">
            <span className="break-all text-xs text-muted select-all">{permalink}</span>
          </Meta>
        </dl>
      </aside>
    </article>
  )
}
