import { ReactNode } from 'react'

interface Props {
  className?: string
}

/** Decorative loading block; sizes are set by the caller so layout never shifts. */
export function Skeleton({ className = '' }: Props) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

/** Wraps skeleton content so assistive tech announces loading once. */
export function SkeletonRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
