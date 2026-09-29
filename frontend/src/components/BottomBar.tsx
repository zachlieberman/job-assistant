import { Link } from 'react-router-dom'
import { NAV_ITEMS, isNavActive } from '../lib/navigation'

/** Phone navigation: five destinations, each at least 44px tall. */
export default function BottomBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV_ITEMS.map(({ to, shortLabel, Icon }) => {
        const active = isNavActive(to, pathname)
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs transition-colors duration-150 ${
              active ? 'font-semibold text-brand-text' : 'font-medium text-muted'
            }`}
          >
            <Icon size={20} />
            {shortLabel}
          </Link>
        )
      })}
    </nav>
  )
}
