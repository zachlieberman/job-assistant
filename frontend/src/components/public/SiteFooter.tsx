import { Link } from 'react-router-dom'
import { RESUME_PATH } from '../../content/resume'

const FOOTER_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/experience', label: 'Experience' },
  { to: '/contact', label: 'Contact' },
]

/** Plain, always-rendered links so every page is reachable without JavaScript (menu links only render when opened). */
export default function SiteFooter() {
  return (
    <footer className="mx-auto max-w-page px-5 pb-12 sm:px-8">
      <nav aria-label="Footer" className="border-t-2 border-card pt-6">
        <ul className="flex flex-wrap gap-x-8">
          {FOOTER_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className="flex min-h-11 items-center text-base font-bold text-ink hover:text-body">
                {label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-base font-bold text-ink hover:text-body"
            >
              Resume
              <span className="sr-only"> (PDF, opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  )
}
