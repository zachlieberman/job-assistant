import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Experience from './pages/Experience'
import Contact from './pages/Contact'
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
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/contact" element={<Contact />} />
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
