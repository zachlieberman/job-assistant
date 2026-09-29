import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.public'
import { readPrerenderData, seedPrerenderData } from './lib/prerenderData'
import '@fontsource/familjen-grotesk/400.css'
import '@fontsource/familjen-grotesk/700.css'
import './public.css'

const container = document.getElementById('root') as HTMLElement

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)

// Production pages are prerendered (scripts/prerender.mjs): hydrate them with the
// same data they were rendered from. The dev server serves an empty #root.
const prerendered = container.hasChildNodes() ? readPrerenderData() : null
if (prerendered) {
  seedPrerenderData(prerendered)
  ReactDOM.hydrateRoot(container, app)
} else {
  ReactDOM.createRoot(container).render(app)
}
