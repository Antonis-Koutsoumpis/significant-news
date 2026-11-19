import type { ReactNode } from 'react'
import { useData } from '../data/DataContext'
import { CATEGORIES, SOURCE_TYPE_LABEL } from '../lib/constants'

function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-serif text-2xl mt-12 mb-3">{children}</h2>
}

export default function MethodologyPage() {
  const { config, issues, items } = useData()
  const t = config.highThreshold

  return (
    <article className="max-w-prose">
      <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">Methodology</h1>
      <p className="mt-4 text-muted leading-relaxed">
        This page explains how developments are selected, classified and ranked. The method is deliberately simple and will be revised
        as the pilot develops. All thresholds below are read from the dataset configuration and can be changed without altering the
        application.
      </p>

      <div className="leading-relaxed prose-record">
        <H2>What is published</H2>
        <p>
          The unit of the archive is a development, not an article. Reports on different stages of the same story are consolidated into
          a single account, published only once the central event, decision or outcome has reached a definitive stage: a law enters into
          force, a court delivers its ruling, a treaty is adopted or enters into force, a regulator approves a product, a scientific
          result is published after peer review, or a government falls.
        </p>
        <p>
          Announcements, debates, reactions and interim steps are not published separately. Where a definitive stage has been reached
          but later stages remain open, the entry records only what has been concluded and carries a status note saying what remains
          unresolved.
        </p>

        <H2>Minimum requirement: factual certainty</H2>
        <p>
          Factual certainty is a condition for publication, not a score. Every entry must be supported by at least one primary document
          (an official, intergovernmental or peer-reviewed source) or by several independent reputable sources. Speculation,
          allegations, unverified claims and predictions are not published. The volume of media coverage plays no part in selection or
          ranking.
        </p>
        <p>
          Each account separates established facts from interpretation. The first paragraph states what happened and the definitive
          outcome. The paragraphs marked <em>Editorial assessment</em> explain why the development matters and its likely long-term
          significance; they are judgements and are presented as such.
        </p>

        <H2>Assessment criteria</H2>
        <p>Each development is assessed against five dimensions:</p>
        <ol className="list-decimal pl-5 mt-3 space-y-2">
          <li>
            <strong className="font-medium">Population affected</strong>, directly or indirectly.
          </li>
          <li>
            <strong className="font-medium">Long-term consequences</strong>: how likely the effects are to last years or decades.
          </li>
          <li>
            <strong className="font-medium">Contribution to humanity</strong>: improvement or harm to welfare, knowledge, health,
            prosperity, sustainability or the quality of institutions.
          </li>
          <li>
            <strong className="font-medium">Geographical reach</strong>: national, continental, cross-border or global.
          </li>
          <li>
            <strong className="font-medium">Factual certainty</strong>, applied as the publication threshold described above.
          </li>
        </ol>

        <H2>Two scores and the importance matrix</H2>
        <p>
          The first four dimensions are condensed into two integer scores from 1 to 10. <em>Immediate significance</em> reflects the
          scale and directness of the effects at the time the development concluded. <em>Long-term significance</em> reflects how
          durable and far-reaching its consequences are likely to be. Each entry includes a short written rationale for its scores.
        </p>
        <p>
          A score of {t} or above counts as high. The two scores place each development in one of four quadrants of the importance
          matrix. Ranking places the high immediate / high long-term quadrant first, followed by low / high, high / low and low / low.
          Within a quadrant, entries are ordered by a weighted score ({config.weights.immediate} × immediate +{' '}
          {config.weights.longTerm} × long-term), then by long-term score, then by date. Long-term significance is weighted more heavily
          because the archive is intended as a historical record.
        </p>
        <p>
          The scores are editorial judgements made against these criteria. They are not measurements and have not been scientifically
          validated. Different editors could reasonably assign different scores, which is why the rationale is always published.
        </p>

        <H2>Good news</H2>
        <p>
          A development is classified as good news only when it shows a demonstrable positive contribution: a measured improvement in
          health or living conditions, a validated scientific or technological advance, a documented environmental recovery, or a
          comparable outcome. Commitments, agreements not yet producing effects, and developments presented optimistically do not
          qualify on that basis alone. Each good-news entry states the evidence for its classification.
        </p>

        <H2>Geographical classification</H2>
        <p>
          Developments are classified by where their consequences occur, not where they originated. <em>National</em> developments
          mainly affect one country; <em>international</em> developments affect several countries or a region;{' '}
          <em>global</em> developments affect all regions. When filtering by a continent or country, global developments are included by
          default and can be excluded.
        </p>

        <H2>Subject categories</H2>
        <p>An entry may belong to more than one of: {CATEGORIES.map((c) => c.label).join('; ')}.</p>

        <H2>Time periods</H2>
        <p>
          Entries are dated by the day the definitive stage was reached. The last 7 and 30 calendar days include today and the preceding
          6 or 29 days. The last year runs from the day after the same date one year earlier through today. Dates follow the viewer's
          local calendar. Short periods are often empty, because a development is published only after it has concluded and been verified.
        </p>

        <H2>Sources and images</H2>
        <p>
          Source types are recorded for every reference: {Object.values(SOURCE_TYPE_LABEL).join('; ')}. Accounts are original summaries
          of no more than {config.maxWords} words; articles are not reproduced. Images are included only when a relevant, openly licensed
          image is available, with author and licence shown. Entries without a suitable image are shown without one.
        </p>

        <H2>Limitations of the pilot</H2>
        <p>
          The dataset is small and manually curated, so coverage is uneven across regions and topics, and some categories currently have
          no entries. No content is generated or published automatically. Linked pages are external and may change after the review
          date shown on each entry.
        </p>

        <H2>Dataset status</H2>
        <p>
          {items.length} developments are published.{' '}
          {issues.length === 0
            ? 'The dataset passed all validation checks.'
            : `${issues.filter((i) => i.level === 'error').length} entries were withheld for errors; ${
                issues.filter((i) => i.level === 'warning').length
              } warnings were raised.`}
        </p>
        {issues.length > 0 && (
          <ul className="mt-3 text-sm text-muted list-disc pl-5">
            {issues.map((i, n) => (
              <li key={n}>
                {i.level}: {i.id} — {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
