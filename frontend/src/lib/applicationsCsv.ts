import type { Application } from '../api/client'

const HEADERS = ['Date', 'Company', 'Role', 'Job Posting Link', 'Stage', 'Notes', 'Location', 'Salary Range']

export function applicationsToCsv(applications: readonly Application[]): string {
  const rows = applications.map((a) => [
    a.date_applied,
    a.company,
    a.role,
    a.job_url ?? '',
    a.status,
    a.notes ?? '',
    a.location ?? '',
    a.salary_range ?? '',
  ])
  return [HEADERS, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export function downloadApplicationsCsv(applications: readonly Application[]): void {
  const blob = new Blob([applicationsToCsv(applications)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
