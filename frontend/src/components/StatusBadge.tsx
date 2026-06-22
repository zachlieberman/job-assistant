const colors: Record<string, string> = {
  applied: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  phone_screen: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  technical: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  offer: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
}

const labels: Record<string, string> = {
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  offer: 'Offer',
  rejected: 'Rejected',
}

interface Props {
  status: string
}

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status] ?? 'bg-gray-800 text-gray-400'
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}
