import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { getAuthToken } from '../api/client'
import Sidebar, { BrandMark } from './Sidebar'
import BottomBar from './BottomBar'
import TopBar from './TopBar'

function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-control bg-brand px-3 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50"
    >
      Skip to content
    </a>
  )
}

/** Signed-in layout: sidebar (desktop) or bottom bar (phone), top bar, content. */
export default function TrackerShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const signedIn = Boolean(getAuthToken())

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-ink">
        <SkipLink />
        <header className="px-4 py-4 md:px-8">
          <BrandMark />
        </header>
        <main id="main" className="px-4 pb-12 md:px-8">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink md:pl-[232px]">
      <SkipLink />
      <Sidebar pathname={pathname} />
      <TopBar pathname={pathname} />
      <main id="main" className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-7">
        {children}
      </main>
      <BottomBar pathname={pathname} />
    </div>
  )
}
