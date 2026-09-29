import React from 'react'
import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import type { HelmetServerState } from 'react-helmet-async'
import { StaticRouter } from 'react-router-dom/server'
import App from './App.public'

export { seedPrerenderData, serializePrerenderData } from './lib/prerenderData'
export type { PrerenderData } from './lib/prerenderData'
export { SITE_URL } from './content/seo'

export interface RenderedRoute {
  /** Markup for #root. */
  html: string
  /** <title>, <meta> and <link> tags from Helmet, ready for <head>. */
  head: string
}

/** Server-renders the public app at `url`. Call seedPrerenderData first so pages render content, not skeletons. */
export function render(url: string): RenderedRoute {
  const helmetContext: { helmet?: HelmetServerState } = {}
  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>,
  )
  const { helmet } = helmetContext
  const head = helmet
    ? [helmet.title, helmet.priority, helmet.meta, helmet.link, helmet.script].map(String).join('')
    : ''
  return { html, head }
}
