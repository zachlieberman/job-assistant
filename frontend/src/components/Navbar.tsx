import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthToken, getAuthToken } from '../api/client'

const portfolioLinks = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/experience', label: 'Experience' },
  { to: '/contact', label: 'Contact' },
]

const trackerLinks = [
  { to: '/tracker', label: 'Dashboard' },
  { to: '/tracker/new', label: 'New Application' },
  { to: '/tracker/journey', label: 'Journey' },
  { to: '/tracker/profile', label: 'Profile' },
  { to: '/admin', label: 'Edit Portfolio' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isInTracker = pathname.startsWith('/tracker') || pathname.startsWith('/admin')
  const isLoggedIn = Boolean(getAuthToken())

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    clearAuthToken()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center gap-10 h-16">
        <Link to="/" className="font-bold text-white text-base tracking-tight">
          Zachary<span className="text-indigo-400">Lieberman</span>
        </Link>
        <div className="flex items-center gap-1">
          {portfolioLinks.map(({ to, label }) => (
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((open) => !open)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isInTracker
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              🔒 Job Applications
              <span className={`text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-1 w-48 rounded-md border border-gray-800 bg-gray-900 shadow-lg py-1">
                {trackerLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setDropdownOpen(false)}
                    className={`block px-3 py-2 text-sm transition-colors ${
                      pathname === to
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <div className="border-t border-gray-800 my-1" />
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
                  >
                    Log Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
                  >
                    Log In
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
