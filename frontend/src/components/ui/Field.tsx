import { cloneElement, useId, type ReactElement } from 'react'
import { labelClass } from './formStyles'
import { AlertIcon } from '../icons'

interface Props {
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  className?: string
  /** A single input/textarea/select; receives id, aria-invalid and aria-describedby. */
  children: ReactElement
}

/** Visible label, optional hint, and the error message directly beneath the control. */
export default function Field({ label, hint, error, required, className = '', children }: Props) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-muted"> (required)</span>}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm text-brand-text">
          <AlertIcon size={15} />
          {error}
        </p>
      )}
    </div>
  )
}
