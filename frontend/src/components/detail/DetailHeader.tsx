import { Link } from 'react-router-dom'
import type { Application } from '../../api/client'
import { ArrowUpRightIcon, ChatIcon, MapPinIcon, TrashIcon } from '../icons'
import { buttonSecondary } from '../ui/formStyles'

/** Only http(s) links are clickable; anything else (javascript:, data:) renders as plain text. */
export function safeUrl(url: string | null): string | null {
  if (!url) return null
  try {
    return /^https?:$/.test(new URL(url).protocol) ? url : null
  } catch {
    return null
  }
}

interface Props {
  app: Application
  deleting: boolean
  onDelete: () => void
}

export default function DetailHeader({ app, deleting, onDelete }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-fg md:text-2xl">{app.company}</h2>
        <p className="text-fg/80">{app.role}</p>
        <p className="text-sm text-muted">
          Applied <span className="num">{app.date_applied}</span>
          <span className="ml-3 font-mono text-xs">ID {app.id}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {app.location && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon size={14} />
              {app.location}
            </span>
          )}
          {app.salary_range && <span>{app.salary_range}</span>}
        </div>
        {app.job_url &&
          (safeUrl(app.job_url) ? (
            <a
              href={safeUrl(app.job_url) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex min-h-[44px] items-center gap-1 break-all text-sm text-brand-text hover:underline md:min-h-0"
            >
              {app.job_url}
              <ArrowUpRightIcon size={14} className="shrink-0" />
            </a>
          ) : (
            <p className="mt-0.5 break-all text-sm text-muted">{app.job_url}</p>
          ))}
      </div>
      <div className="flex items-center gap-2">
        <Link to={`/tracker/interview/${app.id}`} className={buttonSecondary}>
          <ChatIcon size={16} />
          Interview prep
        </Link>
        <button type="button" onClick={onDelete} disabled={deleting} className={buttonSecondary}>
          <TrashIcon size={16} />
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
