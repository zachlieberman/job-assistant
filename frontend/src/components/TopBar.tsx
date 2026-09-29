import { Link, useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../api/client'
import { pageTitle } from '../lib/navigation'
import { buttonPrimary } from './ui/formStyles'
import { PlusIcon, SignOutIcon } from './icons'
import SearchBox from './SearchBox'

export default function TopBar({ pathname }: { pathname: string }) {
  const navigate = useNavigate()

  function handleSignOut() {
    clearAuthToken()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-ink px-4 py-2.5 md:flex-nowrap md:px-8 md:py-3">
      <h1 className="order-1 mr-auto text-base font-semibold tracking-tight md:mr-0 md:min-w-[150px] md:text-lg">
        {pageTitle(pathname)}
      </h1>
      <div className="order-3 flex w-full md:order-2 md:flex-1">
        <SearchBox />
      </div>
      <div className="order-2 flex items-center gap-2 md:order-3">
        <Link to="/tracker/new" className={`${buttonPrimary} hidden md:inline-flex`}>
          <PlusIcon size={16} />
          New application
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="inline-flex h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-muted transition-colors duration-150 hover:bg-raised hover:text-fg md:h-9"
        >
          <SignOutIcon size={17} />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
