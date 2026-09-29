import { AlertIcon, RefreshIcon } from '../icons'
import { buttonSecondary } from './formStyles'

interface Props {
  title: string
  /** What happened and how to fix it. */
  detail: string
  onRetry?: () => void
}

export default function ErrorPanel({ title, detail, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-panel border border-line bg-surface p-5 sm:flex-row sm:items-center"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand/15 text-brand-text">
        <AlertIcon size={20} />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{detail}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonSecondary}>
          <RefreshIcon size={16} />
          Try again
        </button>
      )}
    </div>
  )
}
