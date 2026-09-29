interface Props {
  className?: string
}

/** Placeholder block; give it the same dimensions as the content it stands in for. */
export function Skeleton({ className = '' }: Props) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
