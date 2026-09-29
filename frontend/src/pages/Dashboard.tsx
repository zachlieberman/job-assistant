import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ApplicationTable, { type SortKey } from '../components/ApplicationTable'
import ActivityChart from '../components/dashboard/ActivityChart'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import DashboardToolbar from '../components/dashboard/DashboardToolbar'
import KpiTiles from '../components/dashboard/KpiTiles'
import RecentApplications from '../components/dashboard/RecentApplications'
import StatusDonut from '../components/dashboard/StatusDonut'
import { AlertIcon, CheckIcon } from '../components/icons'
import { SEARCH_PARAM } from '../components/SearchBox'
import ErrorPanel from '../components/ui/ErrorPanel'
import { buttonSecondary } from '../components/ui/formStyles'
import { useApplications } from '../hooks/useApplications'
import { useCsvImport } from '../hooks/useCsvImport'
import { downloadApplicationsCsv } from '../lib/applicationsCsv'
import {
  activitySeries,
  computeKpis,
  filterApplications,
  statusBreakdown,
} from '../lib/dashboardStats'
import { sortApplications, type SortDir } from '../lib/sortApplications'

interface SortState {
  key: SortKey
  dir: SortDir
}

function NoMatches({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-field px-4 py-12 text-center">
      <p className="font-medium text-fg">No applications match{query ? ` “${query}”` : ' this filter'}.</p>
      <p className="text-sm text-muted">Check the spelling, or clear the search and status filter to see everything.</p>
      <button type="button" onClick={onClear} className={buttonSecondary}>
        Clear filters
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { applications, loading, error, reload, updateStatus } = useApplications()
  const [params, setParams] = useSearchParams()
  const query = params.get(SEARCH_PARAM) ?? ''
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'date_applied', dir: 'desc' })
  const csv = useCsvImport(reload)

  const kpis = useMemo(() => computeKpis(applications), [applications])
  const series = useMemo(() => activitySeries(applications), [applications])
  const slices = useMemo(() => statusBreakdown(applications), [applications])
  const visible = useMemo(
    () => sortApplications(filterApplications(applications, query, statusFilter), sort.key, sort.dir),
    [applications, query, statusFilter, sort],
  )

  const handleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const clearFilters = () => {
    setStatusFilter('')
    setParams(new URLSearchParams(), { replace: true })
  }

  if (error) {
    return (
      <ErrorPanel
        title={error}
        detail="The API didn't respond. Check that the backend is running and you're online, then try again."
        onRetry={reload}
      />
    )
  }
  if (loading && applications.length === 0) return <DashboardSkeleton />

  return (
    <div className="flex flex-col gap-5">
      <KpiTiles kpis={kpis} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ActivityChart series={series} />
        <StatusDonut slices={slices} />
      </div>

      <RecentApplications applications={applications} />

      <section aria-labelledby="all-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="all-title" className="text-base font-semibold text-fg">
              All applications
            </h2>
            <p className="num text-sm text-muted">
              Showing {visible.length} of {applications.length}
            </p>
          </div>
          <DashboardToolbar
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            onImport={csv.run}
            onExport={() => downloadApplicationsCsv(visible)}
            importing={csv.importing}
            canExport={visible.length > 0}
          />
        </div>

        {csv.message && (
          <p role="status" className="flex items-center gap-2 text-sm text-fg">
            {csv.message.ok ? (
              <CheckIcon size={16} className="text-brand-text" />
            ) : (
              <AlertIcon size={16} className="text-brand-text" />
            )}
            {csv.message.text}
          </p>
        )}

        <ApplicationTable
          applications={visible}
          sortKey={sort.key}
          sortDir={sort.dir}
          onSort={handleSort}
          onStatusChange={updateStatus}
          emptyState={
            applications.length > 0 ? <NoMatches query={query} onClear={clearFilters} /> : undefined
          }
        />
      </section>
    </div>
  )
}
