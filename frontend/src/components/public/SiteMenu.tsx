import { RefObject, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { stagger } from '../../lib/publicUtils'
import { Close } from './icons'

const MENU_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/experience', label: 'Experience' },
  { to: '/contact', label: 'Contact' },
]

interface Props {
  id: string
  onClose: () => void
  /** Focus returns here when the menu closes. */
  returnFocusRef: RefObject<HTMLElement>
}

/** Full-screen navigation dialog: focus-trapped, Escape closes, scroll locked. */
export default function SiteMenu({ id, onClose, returnFocusRef }: Props) {
  const { pathname } = useLocation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useFocusTrap(dialogRef, true, onClose)

  useEffect(() => {
    const returnTo = returnFocusRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      returnTo?.focus()
    }
  }, [returnFocusRef])

  return (
    <div
      ref={dialogRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="route-in fixed inset-0 z-50 overflow-y-auto bg-paper"
    >
      <div className="mx-auto flex min-h-full max-w-page flex-col px-5 pb-12 sm:px-8">
        <div className="flex h-24 items-center justify-between">
          <Link to="/" onClick={onClose} className="flex min-h-11 items-center text-base font-bold text-ink sm:text-lg">
            Zachary Lieberman
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-body"
          >
            <Close />
          </button>
        </div>
        <nav aria-label="Primary" className="mt-8 sm:mt-16">
          <ul>
            {MENU_LINKS.map(({ to, label }, i) => (
              <li key={to} className="rise" style={stagger(i)}>
                <Link
                  to={to}
                  onClick={onClose}
                  aria-current={pathname === to ? 'page' : undefined}
                  className={`display display-lg block py-2 transition-colors hover:text-body ${
                    pathname === to ? '' : 'text-ink'
                  }`}
                >
                  {label}
                  {pathname === to && <span className="sr-only"> (current page)</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
