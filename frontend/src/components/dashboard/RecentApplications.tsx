import { Link } from 'react-router-dom'
import type { Application } from '../../api/client'
import { relativeTime } from '../../lib/dashboardStats'
import StatusBadge from '../StatusBadge'
import { MapPinIcon } from '../icons'

interface Props {
  applications: Application[]
  limit?: number
}

function byNewest(a: Application, b: Application): number {
  return b.date_applied.localeCompare(a.date_applied) || b.id - a.id
}

export default function RecentApplications({ applications, limit = 5 }: Props) {
  const recent = [...applications].sort(byNewest).slice(0, limit)

  return (
    <section aria-labelledby="recent-title" className="rounded-panel border border-line bg-surface">
      <h2 id="recent-title" className="px-4 pb-2 pt-4 text-base font-semibold text-fg md:px-5 md:pt-5">
        Recent applications
      </h2>
      {recent.length === 0 ? (
        <p className="px-4 pb-5 text-sm text-muted md:px-5">Nothing here yet. New applications appear as you add them.</p>
      ) : (
        <ul className="pb-2">
          {recent.map((app) => (
            <li key={app.id}>
              <Link
                to={`/tracker/applications/${app.id}`}
                className="flex min-h-[56px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 transition-colors duration-150 hover:bg-raised md:px-5"
              >
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block truncate font-medium text-fg">{app.company}</span>
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <span className="truncate">{app.role}</span>
                    {app.location && (
                      <span className="hidden items-center gap-1 sm:inline-flex">
                        <MapPinIcon size={13} />
                        {app.location}
                      </span>
                    )}
                  </span>
                </span>
                <StatusBadge status={app.status} />
                <span className="num w-20 text-right text-sm text-muted">{relativeTime(app.date_applied)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
