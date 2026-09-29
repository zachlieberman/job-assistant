import type { PortfolioExperience } from '../../api/client'
import { useInView } from '../../hooks/useInView'

function TimelineItem({ job }: { job: PortfolioExperience }) {
  // The dot fills as the entry passes through the middle of the viewport.
  const { ref, inView } = useInView<HTMLLIElement>('-40% 0px -40% 0px')

  return (
    <li ref={ref} className="relative pb-16 pl-12 last:pb-0 sm:pl-16">
      <span
        aria-hidden="true"
        data-active={inView}
        className="absolute left-0 top-2 h-6 w-6 rounded-full border-4 border-ink bg-paper transition-colors duration-300 data-[active=true]:bg-ink"
      />
      <p className="text-base">{job.period}</p>
      <h3 className="display display-md mt-2">{job.role}</h3>
      <p className="mt-2 text-xl text-ink">{job.company}</p>
      <ul className="mt-5 max-w-prose list-disc space-y-2 pl-5 marker:text-ink">
        {job.bullets.map((bullet, i) => (
          <li key={i}>{bullet}</li>
        ))}
      </ul>
    </li>
  )
}

/** Experience as a vertical timeline: the one place order is real. */
export default function Timeline({ jobs }: { jobs: PortfolioExperience[] }) {
  if (!jobs.length) return <p>No experience listed yet.</p>

  return (
    <ol
      aria-label="Work history, most recent first"
      className="relative before:absolute before:bottom-2 before:left-[10px] before:top-2 before:w-1 before:rounded-full before:bg-card"
    >
      {jobs.map((job) => (
        <TimelineItem key={job.id} job={job} />
      ))}
    </ol>
  )
}
