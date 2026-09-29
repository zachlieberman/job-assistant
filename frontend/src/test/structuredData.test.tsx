import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.public'
import { homeJsonLd } from '../lib/structuredData'
import type { PortfolioBio } from '../api/client'

const bio: PortfolioBio = {
  id: 1,
  name: 'Zachary Lieberman',
  title: 'Software Engineer',
  location: 'Los Angeles, CA',
  bio: 'Bio.',
  email: 'zach@example.com',
  github_url: 'https://github.com/zachlieberman',
  linkedin_url: 'javascript:alert(1)',
  updated_at: '',
}

vi.mock('../api/client', () => ({
  getPortfolioBio: vi.fn(async () => ({
    data: {
      id: 1, name: 'Zachary Lieberman', title: 'Software Engineer', location: 'Los Angeles, CA', bio: 'Bio.',
      email: 'zach@example.com', github_url: 'https://github.com/zachlieberman',
      linkedin_url: 'https://www.linkedin.com/in/zachlieberman', updated_at: '',
    },
  })),
  listPortfolioProjects: vi.fn(async () => ({ data: [] })),
  listPortfolioExperience: vi.fn(async () => ({ data: [] })),
}))

const blocks = () =>
  Array.from(document.head.querySelectorAll('script[type="application/ld+json"]')).map((el) =>
    JSON.parse(el.textContent ?? ''),
  )

const graphOf = (data: ReturnType<typeof homeJsonLd>) => data['@graph'] as Record<string, unknown>[]
const typed = (data: ReturnType<typeof homeJsonLd>, type: string) =>
  graphOf(data).find((node) => node['@type'] === type)

describe('homeJsonLd', () => {
  it('links WebSite and Person by @id and drops unsafe profile links', () => {
    const data = homeJsonLd({ ...bio, location: 'Los Angeles, California' })
    expect(data['@context']).toBe('https://schema.org')
    expect(typed(data, 'WebSite')).toEqual({
      '@type': 'WebSite',
      '@id': 'https://www.zachlieberman.dev/#website',
      name: 'Zachary Lieberman',
      url: 'https://www.zachlieberman.dev/',
      inLanguage: 'en-US',
      publisher: { '@id': 'https://www.zachlieberman.dev/#person' },
    })
    expect(typed(data, 'Person')).toEqual({
      '@type': 'Person',
      '@id': 'https://www.zachlieberman.dev/#person',
      name: 'Zachary Lieberman',
      jobTitle: 'Software Engineer',
      url: 'https://www.zachlieberman.dev/',
      image: 'https://www.zachlieberman.dev/zachary-lieberman.jpg',
      address: { '@type': 'PostalAddress', addressLocality: 'Los Angeles', addressRegion: 'California' },
      sameAs: ['https://github.com/zachlieberman'],
    })
  })

  it('uses the canonical www LinkedIn host', () => {
    const data = homeJsonLd({ ...bio, linkedin_url: 'https://linkedin.com/in/zach' })
    expect(typed(data, 'Person')?.sameAs).toContain('https://www.linkedin.com/in/zach')
  })

  it('omits address and sameAs when the bio has none', () => {
    const person = typed(homeJsonLd({ ...bio, location: '', github_url: null, linkedin_url: null }), 'Person')
    expect(person).not.toHaveProperty('address')
    expect(person).not.toHaveProperty('sameAs')
  })

  it('describes only the WebSite while the bio is loading', () => {
    const data = homeJsonLd(null)
    expect(graphOf(data)).toHaveLength(1)
    expect(typed(data, 'WebSite')).not.toHaveProperty('publisher')
  })
})

describe('home page structured data', () => {
  const renderAt = (path: string) =>
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </HelmetProvider>,
    )

  it('emits Person and WebSite JSON-LD on the home page only', async () => {
    const { unmount } = renderAt('/')
    await waitFor(() =>
      expect(blocks().flatMap((b) => b['@graph'].map((n: { '@type': string }) => n['@type'])).sort()).toEqual([
        'Person',
        'WebSite',
      ]),
    )
    const person = blocks()[0]['@graph'].find((n: { '@type': string }) => n['@type'] === 'Person')
    expect(person.sameAs).toEqual([
      'https://github.com/zachlieberman',
      'https://www.linkedin.com/in/zachlieberman',
    ])
    unmount()
    await waitFor(() => expect(blocks()).toHaveLength(0))
    renderAt('/projects')
    await waitFor(() => expect(document.title).toContain('Projects'))
    expect(blocks()).toHaveLength(0)
  })
})
