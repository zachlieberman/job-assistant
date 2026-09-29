import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import PublicNavbar from './components/PublicNavbar'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Experience from './pages/Experience'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import PageErrorBoundary from './components/public/PageErrorBoundary'
import SiteFooter from './components/public/SiteFooter'
import { CONTACT_SEO, EXPERIENCE_SEO, HOME_SEO, PROJECTS_SEO } from './content/seo'

const TITLES: Record<string, string> = Object.fromEntries(
  [HOME_SEO, PROJECTS_SEO, EXPERIENCE_SEO, CONTACT_SEO].map((page) => [page.path, page.title]),
)

export default function App() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef(pathname)

  // Announce client-side navigation: update the title and move focus to <main>.
  useEffect(() => {
    // Unknown paths keep the title set by NotFound (child effects run first).
    if (pathname in TITLES) document.title = TITLES[pathname]
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-screen overflow-x-clip bg-paper text-body">
      <PublicNavbar />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-page px-5 pb-32 pt-8 sm:px-8 sm:pt-16"
      >
        <div key={pathname} className="route-in">
          <PageErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/experience" element={<Experience />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageErrorBoundary>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
