import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from './icons'

type Variant = 'solid' | 'outline'

interface Props {
  children: ReactNode
  variant?: Variant
  /** Internal route (`/projects`), absolute URL, or a `.pdf` path (both open in a new tab). */
  to: string
  arrow?: boolean
  className?: string
}

const VARIANTS: Record<Variant, string> = {
  solid: 'bg-ink text-paper hover:bg-body',
  outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-paper',
}

const BASE =
  'group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-base font-bold transition-colors duration-200'

/** Pill-shaped link: black (solid) or outlined, with an optional arrow. */
export default function PillLink({ children, variant = 'solid', to, arrow = false, className = '' }: Props) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`
  const isFile = /\.pdf$/i.test(to)
  const external = isFile || /^(https?:|mailto:)/.test(to)

  if (external) {
    const newTab = isFile || to.startsWith('http')
    return (
      <a
        href={to}
        className={classes}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
        {newTab && <span className="sr-only">(opens in a new tab)</span>}
        {arrow && <ArrowUpRight className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
      </a>
    )
  }

  return (
    <Link to={to} className={classes}>
      {children}
      {arrow && <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />}
    </Link>
  )
}
