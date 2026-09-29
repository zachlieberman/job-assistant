import { STATUSES, STATUS_META, isStatus } from '../../lib/statusMeta'
import StatusBadge from '../StatusBadge'
import Field from '../ui/Field'
import { inputClass } from '../ui/formStyles'
import type { Edits } from '../../hooks/useApplicationDetail'

interface Props {
  edits: Edits
  onChange: (patch: Partial<Edits>) => void
}

export default function StatusBar({ edits, onChange }: Props) {
  return (
    <section aria-label="Status and details" className="grid gap-4 rounded-panel border border-line bg-surface p-4 md:grid-cols-3 md:p-5">
      <div className="flex items-end gap-3">
        <Field label="Status">
          <select
            className={`${inputClass} !w-auto min-w-[10rem]`}
            value={edits.status}
            onChange={(e) => onChange({ status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </Field>
        <div className="flex min-h-[44px] items-center md:min-h-[38px]">
          {isStatus(edits.status) && <StatusBadge status={edits.status} />}
        </div>
      </div>
      <Field label="Location">
        <input className={inputClass} value={edits.location} placeholder="Remote, New York…" onChange={(e) => onChange({ location: e.target.value })} />
      </Field>
      <Field label="Salary range">
        <input className={inputClass} value={edits.salary_range} placeholder="$120k – $160k" onChange={(e) => onChange({ salary_range: e.target.value })} />
      </Field>
    </section>
  )
}
