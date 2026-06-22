import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createApplication } from '../api/client'

const inputClass =
  'bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors'
const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wider'

interface FormState {
  company: string
  role: string
  jobUrl: string
  jobDescription: string
  location: string
  salaryRange: string
}

export default function NewApplication() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    company: '',
    role: '',
    jobUrl: '',
    jobDescription: '',
    location: '',
    salaryRange: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof FormState>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    if (!form.company || !form.role || !form.jobDescription) return
    setSaving(true)
    setError(null)
    try {
      const res = await createApplication({
        company: form.company,
        role: form.role,
        job_url: form.jobUrl || null,
        job_description: form.jobDescription,
        location: form.location || null,
        salary_range: form.salaryRange || null,
      })
      navigate(`/applications/${res.data.id}`, { state: { created: true } })
    } catch {
      setError('Failed to save application.')
      setSaving(false)
    }
  }

  const canSave = !saving && form.company && form.role && form.jobDescription

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">New Application</h1>
        <p className="text-gray-500 text-sm mt-1">
          Add the job details — you can tailor your resume and generate a cover letter after saving.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Job Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Company *</label>
            <input
              value={form.company}
              onChange={setField('company')}
              placeholder="Acme Corp"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Role *</label>
            <input
              value={form.role}
              onChange={setField('role')}
              placeholder="Software Engineer"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Location</label>
            <input
              value={form.location}
              onChange={setField('location')}
              placeholder="Remote, New York, NY..."
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Salary Range</label>
            <input
              value={form.salaryRange}
              onChange={setField('salaryRange')}
              placeholder="$120k – $160k"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className={labelClass}>Job URL</label>
            <input
              value={form.jobUrl}
              onChange={setField('jobUrl')}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Job Description *</label>
          <textarea
            value={form.jobDescription}
            onChange={setField('jobDescription')}
            rows={12}
            placeholder="Paste the full job description here..."
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Application →'}
        </button>
      </div>
    </div>
  )
}
