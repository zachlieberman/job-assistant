import { Routes, Route, Navigate } from 'react-router-dom'
import TrackerNavbar from './components/TrackerNavbar'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import NewApplication from './pages/NewApplication'
import ApplicationDetail from './pages/ApplicationDetail'
import InterviewPrep from './pages/InterviewPrep'
import Profile from './pages/Profile'
import Journey from './pages/Journey'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TrackerNavbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Navigate to="/tracker" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Admin />
              </RequireAuth>
            }
          />

          <Route
            path="/tracker"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/tracker/new"
            element={
              <RequireAuth>
                <NewApplication />
              </RequireAuth>
            }
          />
          <Route
            path="/tracker/applications/:id"
            element={
              <RequireAuth>
                <ApplicationDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/tracker/interview/:id"
            element={
              <RequireAuth>
                <InterviewPrep />
              </RequireAuth>
            }
          />
          <Route
            path="/tracker/journey"
            element={
              <RequireAuth>
                <Journey />
              </RequireAuth>
            }
          />
          <Route
            path="/tracker/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
