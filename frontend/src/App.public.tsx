import { Routes, Route } from 'react-router-dom'
import PublicNavbar from './components/PublicNavbar'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Experience from './pages/Experience'
import Contact from './pages/Contact'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <PublicNavbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
    </div>
  )
}
