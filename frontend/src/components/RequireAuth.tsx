import { Navigate, useLocation } from 'react-router-dom'
import { getAuthToken } from '../api/client'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = getAuthToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
