import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/experience', label: 'Experience' },
  { to: '/contact', label: 'Contact' },
]

export default function PublicNavbar() {
  const { pathname } = useLocation()

  return (
    <nav className="border-b border-gray-900 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-20">
        <Link to="/" className="font-semibold text-white text-lg tracking-tight">
          Zachary Lieberman
        </Link>
        <div className="flex items-center gap-8">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm transition-colors ${
                pathname === to ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
