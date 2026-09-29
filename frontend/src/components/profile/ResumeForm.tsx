import Field from '../ui/Field'
import { buttonGhost, buttonPrimary, inputClass } from '../ui/formStyles'

export interface ResumeFormState {
  name: string
  content: string
}

interface Props {
  title?: string
  value: ResumeFormState
  onChange: (value: ResumeFormState) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  saveLabel: string
  canSave?: boolean
  namePlaceholder?: string
}

export default function ResumeForm({ title, value, onChange, onSave, onCancel, saving, saveLabel, canSave = true, namePlaceholder }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {title && <h3 className="text-sm font-semibold text-fg">{title}</h3>}
      <Field label="Name">
        <input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder={namePlaceholder} className={inputClass} />
      </Field>
      <Field label="Content">
        <textarea value={value.content} onChange={(e) => onChange({ ...value, content: e.target.value })} rows={12} placeholder="Paste your resume text here…" className={`${inputClass} resize-y font-mono`} />
      </Field>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onSave} disabled={saving || !canSave} className={buttonPrimary}>
          {saving ? 'Saving…' : saveLabel}
        </button>
        <button type="button" onClick={onCancel} className={buttonGhost}>Cancel</button>
      </div>
    </div>
  )
}
