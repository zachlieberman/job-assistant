import { useState, useEffect, useRef } from 'react'
import { listApplications, importApplicationsCsv, Application } from '../api/client'
import ApplicationTable from '../components/ApplicationTable'

const STATUSES = ['applied', 'phone_screen', 'technical', 'offer', 'rejected']

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    listApplications(statusFilter ? { status: statusFilter } : undefined)
      .then((res) => setApplications(res.data))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const [sortKey, setSortKey] = useState<'company' | 'role' | 'status' | 'date_applied'>('date_applied')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = (() => {
    const base = search.trim()
      ? applications.filter((a) => {
          const q = search.toLowerCase()
          return a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
        })
      : applications

    return [...base].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  })()

  const handleExport = () => {
    const headers = ['Date', 'Company', 'Role', 'Job Posting Link', 'Stage', 'Notes', 'Location', 'Salary Range']
    const rows = filtered.map((a) => [
      a.date_applied,
      a.company,
      a.role,
      a.job_url ?? '',
      a.status,
      a.notes ?? '',
      a.location ?? '',
      a.salary_range ?? '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    try {
      const res = await importApplicationsCsv(file)
      const { imported, skipped, errors } = res.data
      const parts = [`Imported ${imported} application${imported !== 1 ? 's' : ''}`]
      if (skipped) parts.push(`skipped ${skipped}`)
      if (errors.length) parts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`)
      setImportMsg(parts.join(', ') + '.')
      const updated = await listApplications(statusFilter ? { status: statusFilter } : undefined)
      setApplications(updated.data)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setImportMsg(detail ?? 'Import failed. Please check the file format and try again.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
          <input
            type="text"
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-52"
          />
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>
      {importMsg && (
        <p className={`text-sm ${importMsg.includes('failed') ? 'text-red-400' : 'text-emerald-400'}`}>
          {importMsg}
        </p>
      )}

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && (
        <ApplicationTable
          applications={filtered}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
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
