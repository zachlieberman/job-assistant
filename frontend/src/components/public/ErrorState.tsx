interface Props {
  /** What failed to load, e.g. "the projects". */
  what: string
  onRetry: () => void
  className?: string
}

export default function ErrorState({ what, onRetry, className = '' }: Props) {
  return (
    <div role="alert" className={`rounded-[2rem] bg-card p-8 sm:p-10 ${className}`}>
      <h2 className="display display-md">Couldn't load {what}.</h2>
      <p className="mt-3 max-w-prose">
        The server may still be waking up. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-bold text-paper transition-colors hover:bg-body"
      >
        Retry
      </button>
    </div>
  )
}
