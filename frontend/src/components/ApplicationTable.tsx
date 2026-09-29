import type { ChangeEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Application, updateApplication } from '../api/client'
import { STATUSES, STATUS_META } from '../lib/statusMeta'
import Toast from './Toast'
import StatusBadge from './StatusBadge'
import { ArrowUpRightIcon, ChatIcon, ChevronIcon, PlusIcon } from './icons'
import { useToast } from '../hooks/useToast'
import { buttonPrimary } from './ui/formStyles'

export type SortKey = 'company' | 'role' | 'status' | 'date_applied'

interface Props {
  applications: Application[]
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  onStatusChange: (id: number, newStatus: string) => void
  /** Replaces the default "no applications" message (e.g. when a search matched nothing). */
  emptyState?: ReactNode
}

const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'company', label: 'Company', className: '' },
  { key: 'role', label: 'Role', className: 'hidden md:table-cell' },
  { key: 'status', label: 'Status', className: '' },
  { key: 'date_applied', label: 'Applied', className: 'hidden sm:table-cell' },
]

function SortHeader({ column, sortKey, sortDir, onSort }: {
  column: (typeof COLUMNS)[number]
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
}) {
  const active = sortKey === column.key
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-4 py-2 text-left font-medium ${column.className}`}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={`group/th -mx-1 inline-flex min-h-[44px] items-center gap-1 rounded-row md:min-h-[36px] px-1 transition-colors duration-150 hover:text-fg ${
          active ? 'text-fg' : 'text-muted'
        }`}
      >
        {column.label}
        <ChevronIcon
          size={14}
          className={`transition-[opacity,transform] duration-150 ${
            active ? 'opacity-100' : 'opacity-0 group-hover/th:opacity-60 group-focus-visible/th:opacity-60'
          } ${active && sortDir === 'asc' ? 'rotate-180' : ''}`}
        />
      </button>
    </th>
  )
}

function DefaultEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-field px-4 py-14 text-center">
      <p className="font-medium text-fg">No applications yet.</p>
      <p className="max-w-sm text-sm text-muted">
        Paste a job description to add your first one, or import a CSV from the toolbar above.
      </p>
      <Link to="/tracker/new" className={buttonPrimary}>
        <PlusIcon size={16} />
        Add your first application
      </Link>
    </div>
  )
}

export default function ApplicationTable({
  applications,
  sortKey,
  sortDir,
  onSort,
  onStatusChange,
  emptyState,
}: Props) {
  const navigate = useNavigate()
  const { toast, show: showToast } = useToast()

  const handleStatusChange = async (e: ChangeEvent<HTMLSelectElement>, app: Application) => {
    const newStatus = e.target.value
    try {
      await updateApplication(app.id, { status: newStatus })
      onStatusChange(app.id, newStatus)
      showToast('Status updated')
    } catch {
      showToast('Could not update the status. Check your connection and try again.', 'error')
    }
  }

  if (!applications.length) return <>{emptyState ?? <DefaultEmpty />}</>

  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((column) => (
                <SortHeader key={column.key} column={column} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              ))}
              <th scope="col" className="px-4 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {applications.map((app) => (
              <tr
                key={app.id}
                className="group cursor-pointer transition-colors duration-150 hover:bg-raised focus-within:bg-raised"
                onClick={() => navigate(`/tracker/applications/${app.id}`)}
              >
                <td className="min-w-0 px-4 py-3 md:py-2">
                  <Link
                    to={`/tracker/applications/${app.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block py-1 font-medium text-fg hover:text-brand-text"
                  >
                    {app.company}
                  </Link>
                  <span className="block text-muted md:hidden">{app.role}</span>
                </td>
                <td className="hidden px-4 py-2 text-fg md:table-cell">{app.role}</td>
                <td className="px-4 py-3 md:py-2">
                  <div className="relative inline-flex rounded-row focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-text">
                    <StatusBadge status={app.status} />
                    <select
                      value={app.status}
                      aria-label={`Status for ${app.company}`}
                      onChange={(e) => handleStatusChange(e, app)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -inset-y-2 inset-x-0 cursor-pointer opacity-0 focus-visible:outline-none md:-inset-y-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-surface text-fg">
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="num hidden px-4 py-2 text-muted sm:table-cell">{app.date_applied}</td>
                <td className="px-2 py-1 text-right md:px-4">
                  <button
                    type="button"
                    aria-label={`Interview prep for ${app.company}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/tracker/interview/${app.id}`)
                    }}
                    className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-control px-2 text-xs font-medium text-brand-text transition-opacity duration-150 hover:bg-line md:h-8 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:group-focus-within:opacity-100"
                  >
                    <ChatIcon size={16} />
                    <span className="hidden lg:inline">Interview prep</span>
                    <ArrowUpRightIcon size={13} className="hidden lg:inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
