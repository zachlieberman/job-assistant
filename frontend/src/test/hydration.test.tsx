import { act } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.public'
import { render as serverRender, seedPrerenderData } from '../entry-server'
import { clearApiCache } from '../hooks/useApiResource'
import { PRERENDER_DATA_ID, readPrerenderData, serializePrerenderData } from '../lib/prerenderData'
import type { PrerenderData } from '../lib/prerenderData'
import { data } from './prerenderFixture'

vi.mock('../api/client', async () => {
  const { data: fixture } = await import('./prerenderFixture')
  return {
    getPortfolioBio: vi.fn(async () => ({ data: fixture.bio })),
    listPortfolioProjects: vi.fn(async () => ({ data: fixture.projects })),
    listPortfolioExperience: vi.fn(async () => ({ data: fixture.experience })),
  }
})

describe('hydrating prerendered pages', () => {
  let errors: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errors.mockRestore()
    document.body.innerHTML = ''
  })

  it.each(['/', '/projects', '/experience', '/contact', '/nope'])(
    'matches the server markup at %s with no hydration warnings',
    async (path) => {
      // The server renders with seeded data; the browser seeds the same data before hydrating.
      seedPrerenderData(data)
      const { html } = serverRender(path === '/nope' ? '/404' : path)
      clearApiCache()
      seedPrerenderData(data)

      const container = document.createElement('div')
      container.innerHTML = html
      document.body.appendChild(container)
      window.history.pushState({}, '', path)

      await act(async () => {
        hydrateRoot(
          container,
          <HelmetProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </HelmetProvider>,
        )
      })

      expect(errors.mock.calls.map((call: unknown[]) => String(call[0]))).toEqual([])
      expect(container.querySelector('h1')).not.toBeNull()
    },
  )
})

describe('embedded data', () => {
  it('round-trips through the script tag and cannot close it early', () => {
    const risky: PrerenderData = {
      ...data,
      bio: { ...data.bio, bio: '</script><script>alert(1)</script>' },
    }
    const json = serializePrerenderData(risky)
    expect(json).not.toContain('</script>')
    document.body.innerHTML = `<script id="${PRERENDER_DATA_ID}" type="application/json">${json}</script>`
    expect(readPrerenderData()).toEqual(risky)
  })

  it('reads null when the page was not prerendered', () => {
    document.body.innerHTML = ''
    expect(readPrerenderData()).toBeNull()
  })
})
