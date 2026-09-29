import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import App from '../App.public'
import indexHtml from '../../apps/public/index.html?raw'
import { CONTACT_SEO, EXPERIENCE_SEO, HOME_SEO, PROJECTS_SEO } from '../content/seo'

vi.mock('../api/client', () => ({
  getPortfolioBio: vi.fn().mockResolvedValue({
    data: {
      id: 1,
      name: 'Zachary Lieberman',
      title: 'Software Engineer',
      location: 'Los Angeles, CA',
      bio: 'Bio.',
      email: 'zach@example.com',
      github_url: null,
      linkedin_url: null,
      updated_at: '',
    },
  }),
  listPortfolioProjects: vi.fn().mockResolvedValue({ data: [] }),
  listPortfolioExperience: vi.fn().mockResolvedValue({ data: [] }),
}))

const ROUTES = [HOME_SEO, PROJECTS_SEO, EXPERIENCE_SEO, CONTACT_SEO]
const ORIGIN = 'https://www.zachlieberman.dev'
const OG_IMAGE = `${ORIGIN}/og-image.png`

const meta = (attr: 'name' | 'property', key: string) =>
  Array.from(document.head.querySelectorAll(`meta[${attr}="${key}"]`))
const content = (attr: 'name' | 'property', key: string) => {
  const found = meta(attr, key)
  expect(found, `${key} should appear exactly once`).toHaveLength(1)
  return found[0].getAttribute('content')
}
const canonicals = () => document.head.querySelectorAll('link[rel="canonical"]')

/** Seed <head> with the static fallback tags from apps/public/index.html. */
function loadStaticHead() {
  const head = new DOMParser().parseFromString(indexHtml, 'text/html').head
  head.querySelectorAll('meta[data-rh]').forEach((node) => document.head.appendChild(node))
}

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </HelmetProvider>,
  )
}

describe('Seo tags per route', () => {
  beforeEach(loadStaticHead)
  afterEach(() => {
    cleanup()
    document.head.innerHTML = ''
  })

  it.each(ROUTES)('emits the full tag set for $path', async (seo) => {
    renderAt(seo.path)
    const url = `${ORIGIN}${seo.path}`
    await waitFor(() => expect(canonicals()).toHaveLength(1))

    expect(canonicals()[0]).toHaveAttribute('href', url)
    expect(document.title).toBe(seo.title)
    expect(content('name', 'description')).toBe(seo.description)
    expect(content('property', 'og:title')).toBe(seo.title)
    expect(content('property', 'og:description')).toBe(seo.description)
    expect(content('property', 'og:url')).toBe(url)
    expect(content('property', 'og:type')).toBe('website')
    expect(content('property', 'og:site_name')).toBe('Zachary Lieberman')
    expect(content('property', 'og:image')).toBe(OG_IMAGE)
    expect(content('name', 'twitter:card')).toBe('summary_large_image')
    expect(content('name', 'twitter:image')).toBe(OG_IMAGE)
    expect(document.head.querySelectorAll('title')).toHaveLength(1)
  })

  it('keeps titles and descriptions within length limits and unique', () => {
    for (const seo of ROUTES) {
      expect(seo.title.length).toBeLessThanOrEqual(60)
      expect(seo.description.length).toBeGreaterThanOrEqual(150)
      expect(seo.description.length).toBeLessThanOrEqual(160)
      expect(seo.description).not.toMatch(/[\u2013\u2014]/)
    }
    expect(new Set(ROUTES.map((r) => r.title)).size).toBe(ROUTES.length)
    expect(new Set(ROUTES.map((r) => r.description)).size).toBe(ROUTES.length)
  })

  it('states role and location in the home description', () => {
    expect(HOME_SEO.description).toMatch(/software engineer/i)
    expect(HOME_SEO.description).toMatch(/Los Angeles/)
  })

  it('replaces the static fallback tags instead of duplicating them', async () => {
    expect(meta('name', 'description')).toHaveLength(1)
    renderAt('/projects')
    await waitFor(() => expect(canonicals()).toHaveLength(1))
    expect(content('name', 'description')).toBe(PROJECTS_SEO.description)
    expect(content('property', 'og:title')).toBe(PROJECTS_SEO.title)
  })

  it('keeps the static fallback description in step with the home copy', () => {
    expect(content('name', 'description')).toBe(HOME_SEO.description)
    expect(content('property', 'og:description')).toBe(HOME_SEO.description)
    expect(content('property', 'og:image')).toBe(OG_IMAGE)
  })

  it('does not set a canonical or og:url in the static fallback', () => {
    expect(canonicals()).toHaveLength(0)
    expect(meta('property', 'og:url')).toHaveLength(0)
  })

  it('updates the tags on client-side navigation without duplicating them', async () => {
    function GoToContact() {
      const navigate = useNavigate()
      return <button onClick={() => navigate('/contact')}>go</button>
    }
    const { getByRole } = render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/projects']}>
          <App />
          <GoToContact />
        </MemoryRouter>
      </HelmetProvider>,
    )
    await waitFor(() => expect(canonicals()[0]).toHaveAttribute('href', `${ORIGIN}/projects`))

    fireEvent.click(getByRole('button', { name: 'go' }))
    await waitFor(() => expect(canonicals()[0]).toHaveAttribute('href', `${ORIGIN}/contact`))
    expect(canonicals()).toHaveLength(1)
    expect(document.title).toBe(CONTACT_SEO.title)
    expect(content('name', 'description')).toBe(CONTACT_SEO.description)
  })
})
