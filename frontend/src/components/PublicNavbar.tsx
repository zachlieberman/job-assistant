import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from './public/icons'
import PillLink from './public/PillLink'
import SiteMenu from './public/SiteMenu'

const MENU_ID = 'site-menu'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto flex h-24 max-w-page items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex min-h-11 items-center text-base font-bold text-ink sm:text-lg">
          Zachary Lieberman
        </Link>
        <nav aria-label="Quick links" className="flex items-center gap-3">
          <PillLink to="/contact" variant="outline">
            Let's talk
          </PillLink>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls={open ? MENU_ID : undefined}
            onClick={() => setOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-body"
          >
            <Menu />
          </button>
        </nav>
      </div>
      {open && <SiteMenu id={MENU_ID} onClose={close} returnFocusRef={menuButtonRef} />}
    </header>
  )
}
