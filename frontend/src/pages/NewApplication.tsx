import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createApplication } from '../api/client'
import Field from '../components/ui/Field'
import PageHeader from '../components/ui/PageHeader'
import { buttonPrimary, inputClass } from '../components/ui/formStyles'
import { AlertIcon } from '../components/icons'

interface FormState {
  company: string
  role: string
  jobUrl: string
  jobDescription: string
  location: string
  salaryRange: string
}

type Errors = Partial<Record<'company' | 'role' | 'jobDescription', string>>

const INITIAL: FormState = { company: '', role: '', jobUrl: '', jobDescription: '', location: '', salaryRange: '' }

export function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (!form.company.trim()) errors.company = 'Enter the company name.'
  if (!form.role.trim()) errors.role = 'Enter the role you applied for.'
  if (!form.jobDescription.trim()) errors.jobDescription = 'Paste the job description so you can tailor your resume later.'
  return errors
}

export default function NewApplication() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function setField<K extends keyof FormState>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setErrors((prev) => (field in prev ? { ...prev, [field]: undefined } : prev))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await createApplication({
        company: form.company,
        role: form.role,
        job_url: form.jobUrl || null,
        job_description: form.jobDescription,
        location: form.location || null,
        salary_range: form.salaryRange || null,
      })
      navigate(`/tracker/applications/${res.data.id}`, { state: { created: true } })
    } catch {
      setSaveError('Failed to save application. Check your connection and try again — your entries are still here.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex max-w-3xl flex-col gap-5">
      <PageHeader description="Add the job details. You can tailor your resume and write a cover letter after saving." />

      <div className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" required error={errors.company}>
            <input value={form.company} onChange={setField('company')} placeholder="Acme Corp" className={inputClass} />
          </Field>
          <Field label="Role" required error={errors.role}>
            <input value={form.role} onChange={setField('role')} placeholder="Software Engineer" className={inputClass} />
          </Field>
          <Field label="Location">
            <input value={form.location} onChange={setField('location')} placeholder="Remote, New York, NY…" className={inputClass} />
          </Field>
          <Field label="Salary range">
            <input value={form.salaryRange} onChange={setField('salaryRange')} placeholder="$120k – $160k" className={inputClass} />
          </Field>
          <Field label="Job URL" className="sm:col-span-2">
            <input value={form.jobUrl} onChange={setField('jobUrl')} placeholder="https://…" inputMode="url" className={inputClass} />
          </Field>
        </div>
        <Field label="Job description" required error={errors.jobDescription}>
          <textarea value={form.jobDescription} onChange={setField('jobDescription')} rows={12} placeholder="Paste the full job description here…" className={`${inputClass} resize-y`} />
        </Field>
      </div>

      {saveError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-brand-text">
          <AlertIcon size={16} className="shrink-0" />
          {saveError}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving ? 'Saving…' : 'Save application'}
        </button>
      </div>
    </form>
  )
}
