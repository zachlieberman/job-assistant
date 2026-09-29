import { useRef, type ChangeEvent } from 'react'
import { STATUSES, STATUS_META } from '../../lib/statusMeta'
import { DownloadIcon, UploadIcon } from '../icons'
import { buttonSecondary, inputClass, labelClass } from '../ui/formStyles'

interface Props {
  statusFilter: string
  onStatusFilter: (status: string) => void
  onImport: (file: File) => void
  onExport: () => void
  importing: boolean
  canExport: boolean
}

export default function DashboardToolbar({
  statusFilter,
  onStatusFilter,
  onImport,
  onExport,
  importing,
  canExport,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className={labelClass}>
          Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className={`${inputClass} !w-auto`}
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" aria-label="Import applications CSV file" onChange={handleFile} />
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing} className={buttonSecondary}>
        <UploadIcon size={16} />
        {importing ? 'Importing…' : 'Import CSV'}
      </button>
      <button type="button" onClick={onExport} disabled={!canExport} className={buttonSecondary}>
        <DownloadIcon size={16} />
        Export CSV
      </button>
    </div>
  )
}
