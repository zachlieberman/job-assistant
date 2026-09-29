import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Experience from './pages/Experience'
import Contact from './pages/Contact'
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

          <Route path="/tracker" element={<Dashboard />} />
          <Route path="/tracker/new" element={<NewApplication />} />
          <Route path="/tracker/applications/:id" element={<ApplicationDetail />} />
          <Route path="/tracker/interview/:id" element={<InterviewPrep />} />
          <Route path="/tracker/journey" element={<Journey />} />
          <Route path="/tracker/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}
