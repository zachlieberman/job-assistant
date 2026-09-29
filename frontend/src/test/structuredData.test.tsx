import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.public'
import { personJsonLd } from '../lib/structuredData'
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

describe('personJsonLd', () => {
  it('uses the bio and drops unsafe or missing profile links', () => {
    expect(personJsonLd(bio)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Zachary Lieberman',
      jobTitle: 'Software Engineer',
      url: 'https://www.zachlieberman.dev/',
      sameAs: ['https://github.com/zachlieberman'],
    })
  })

  it('omits sameAs when there are no profile links', () => {
    expect(personJsonLd({ ...bio, github_url: null, linkedin_url: null })).not.toHaveProperty('sameAs')
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
    await waitFor(() => expect(blocks().map((b) => b['@type']).sort()).toEqual(['Person', 'WebSite']))
    const person = blocks().find((b) => b['@type'] === 'Person')
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
