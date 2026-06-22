import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/new', label: 'New Application' },
  { to: '/profile', label: 'Profile' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center gap-10 h-16">
        <span className="font-bold text-white text-base tracking-tight">
          Job<span className="text-indigo-400">Assist</span>
        </span>
        <div className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
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
