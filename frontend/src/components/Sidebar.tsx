import { Link } from 'react-router-dom'
import { NAV_ITEMS, isNavActive } from '../lib/navigation'
import { JourneyIcon } from './icons'

export function BrandMark() {
  return (
    <Link
      to="/tracker"
      className="flex items-center gap-2.5 rounded-control px-2 py-1.5 text-fg"
      aria-label="Job tracker home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-control bg-brand text-white">
        <JourneyIcon size={17} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Job tracker</span>
    </Link>
  )
}

/** Desktop navigation rail: icons plus labels, active item in blue. */
export default function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col gap-6 border-r border-line bg-surface px-3 py-4 md:flex">
      <BrandMark />
      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = isNavActive(to, pathname)
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-10 items-center gap-3 rounded-control px-3 text-sm transition-colors duration-150 ${
                active
                  ? 'bg-brand/15 font-semibold text-brand-text'
                  : 'font-medium text-muted hover:bg-raised hover:text-fg'
              }`}
            >
              {active && (
                <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-text" />
              )}
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
