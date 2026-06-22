import { useState, useEffect } from 'react'
import { listApplications, Application } from '../api/client'
import ApplicationTable from '../components/ApplicationTable'

const STATUSES = ['applied', 'phone_screen', 'technical', 'offer', 'rejected']

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listApplications(statusFilter ? { status: statusFilter } : undefined)
      .then((res) => setApplications(res.data))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const stats = {
    total: applications.length,
    inProgress: applications.filter((a) => ['phone_screen', 'technical'].includes(a.status)).length,
    offers: applications.filter((a) => a.status === 'offer').length,
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your job applications.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {([
          { label: 'Total Applied', value: stats.total, color: 'text-white' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-300' },
          { label: 'Offers', value: stats.offers, color: 'text-emerald-300' },
        ] as const).map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Applications</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && (
        <ApplicationTable
          applications={applications}
          onStatusChange={(id, newStatus) =>
            setApplications((prev) =>
              prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
            )
          }
        />
      )}
    </div>
  )
}
