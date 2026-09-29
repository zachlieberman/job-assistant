import { Suspense, lazy } from 'react'
import { useInView } from '../../hooks/useInView'
import JourneyLegend from './JourneyLegend'
import JourneyTable from './JourneyTable'
import { Skeleton } from './Skeleton'

// d3 loads only when the card nears the viewport.
const JourneyChart = lazy(() => import('./JourneyChart'))

const CHART_SLOT = 'h-[360px]'

/** Live, view-only Sankey running on sample data (no API calls, no login). */
export default function JourneyDemoCard() {
  const { ref, inView } = useInView<HTMLElement>('200px', true)

  return (
    <article
      ref={ref}
      aria-labelledby="demo-title"
      className="rounded-[2rem] bg-card p-6 sm:p-8 md:p-12"
    >
      <p className="inline-flex rounded-full bg-paper px-4 py-1.5 text-base font-bold text-ink">
        Live demo
      </p>
      <h2 id="demo-title" className="display display-lg mt-6">
        Application journey
      </h2>
      <p className="mt-4 max-w-prose">
        The flow chart from my job tracker, running on sample data. Hover or tab to a stage to see
        how many applications reached it.
      </p>
      <div className={`mt-8 ${CHART_SLOT}`}>
        {inView ? (
          <Suspense fallback={<Skeleton className={`${CHART_SLOT} bg-paper`} />}>
            <JourneyChart />
          </Suspense>
        ) : (
          <Skeleton className={`${CHART_SLOT} bg-paper`} />
        )}
      </div>
      <JourneyLegend />
      <JourneyTable />
    </article>
  )
}
