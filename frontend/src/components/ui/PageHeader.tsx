import type { ReactNode } from 'react'

interface Props {
  title?: string
  description?: string
  actions?: ReactNode
}

/** Page-level intro under the top bar. The bar owns the h1, so the title here is an h2. */
export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {title && <h2 className="text-lg font-semibold tracking-tight text-fg md:text-xl">{title}</h2>}
        {description && <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
