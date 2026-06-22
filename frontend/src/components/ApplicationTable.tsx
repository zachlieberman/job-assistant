import { useNavigate } from 'react-router-dom'
import { Application, updateApplication } from '../api/client'
import Toast from './Toast'
import { useToast } from '../hooks/useToast'

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  phone_screen: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  technical: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  offer: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
}

interface Props {
  applications: Application[]
  onStatusChange: (id: number, newStatus: string) => void
}

export default function ApplicationTable({ applications, onStatusChange }: Props) {
  const navigate = useNavigate()
  const { toast, show: showToast } = useToast()

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, app: Application) => {
    e.stopPropagation()
    const newStatus = e.target.value
    try {
      await updateApplication(app.id, { status: newStatus })
      onStatusChange(app.id, newStatus)
      showToast('Status updated')
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  if (!applications.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-800 rounded-xl">
        <p className="text-gray-500 text-sm">No applications yet.</p>
        <p className="text-gray-600 text-xs mt-1">Add your first application to get started.</p>
      </div>
    )
  }

  return (
    <>
    <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {applications.map((app) => (
            <tr
              key={app.id}
              className="hover:bg-gray-800/40 transition-colors cursor-pointer group"
              onClick={() => navigate(`/applications/${app.id}`)}
            >
              <td className="px-5 py-4 font-semibold text-white">{app.company}</td>
              <td className="px-5 py-4 text-gray-300">{app.role}</td>
              <td className="px-5 py-4">
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(e, app)}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer appearance-none focus:outline-none transition-colors ${
                    statusColors[app.status] ?? 'bg-gray-800 text-gray-400 ring-1 ring-gray-700'
                  }`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-5 py-4 text-gray-500 tabular-nums">{app.date_applied}</td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/interview/${app.id}`)
                  }}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Interview Prep →
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
