import { STATUS_META, isStatus } from '../lib/statusMeta'

interface Props {
  status: string
}

/** Icon + text label on a blue ramp; meaning never depends on color alone. */
export default function StatusBadge({ status }: Props) {
  if (!isStatus(status)) {
    return (
      <span className="inline-flex items-center rounded-row border border-line bg-raised px-2 py-0.5 text-xs font-medium text-muted">
        {status}
      </span>
    )
  }
  const { label, Icon, badge } = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-row border px-2 py-0.5 text-xs font-medium ${badge}`}
    >
      <Icon size={13} />
      {label}
    </span>
  )
}
