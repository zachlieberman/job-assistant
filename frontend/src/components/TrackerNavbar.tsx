import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthToken, getAuthToken } from '../api/client'

const links = [
  { to: '/tracker', label: 'Dashboard' },
  { to: '/tracker/new', label: 'New Application' },
  { to: '/tracker/journey', label: 'Journey' },
  { to: '/tracker/profile', label: 'Profile' },
  { to: '/admin', label: 'Edit Portfolio' },
]

export default function TrackerNavbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isLoggedIn = Boolean(getAuthToken())

  function handleLogout() {
    clearAuthToken()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4">
      <div className="max-w-6xl mx-auto flex items-center gap-1 h-12 text-sm">
        <span className="font-medium text-gray-500 mr-3">Job Tracker</span>
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              pathname === to ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            {label}
          </Link>
        ))}
        <div className="flex-1" />
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="px-2.5 py-1 rounded font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            Log Out
          </button>
        ) : (
          <Link
            to="/login"
            className="px-2.5 py-1 rounded font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  )
}
