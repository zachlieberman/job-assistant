import { useId } from 'react'
import { labelClass } from './ui/formStyles'

interface Props {
  label?: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

export default function ResumeEditor({ label, value, onChange, readOnly = false }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        rows={20}
        className={`w-full resize-y rounded-panel border bg-surface p-4 font-mono text-sm leading-relaxed transition-colors duration-150 ${
          readOnly ? 'cursor-default border-line text-muted' : 'border-field text-fg hover:border-muted focus-visible:border-brand-text'
        }`}
      />
    </div>
  )
}
