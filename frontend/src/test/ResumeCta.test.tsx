import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.public'
import ClosingCta from '../components/public/ClosingCta'
import PillLink from '../components/public/PillLink'
import { RESUME_PATH } from '../content/resume'
import { HOME_SEO, CONTACT_SEO } from '../content/seo'
import type { PortfolioBio } from '../api/client'

const bio: PortfolioBio = {
  id: 1,
  name: 'Zachary Lieberman',
  title: 'Software Engineer',
  location: 'Los Angeles, CA',
  bio: 'Bio.',
  email: 'zach@example.com',
  github_url: null,
  linkedin_url: null,
  updated_at: '',
}

vi.mock('../api/client', () => ({
  getPortfolioBio: vi.fn(async () => ({
    data: {
      id: 1, name: 'Zachary Lieberman', title: 'Software Engineer', location: 'Los Angeles, CA', bio: 'Bio.',
      email: 'zach@example.com', github_url: null, linkedin_url: null, updated_at: '',
    },
  })),
  listPortfolioProjects: vi.fn(async () => ({ data: [] })),
  listPortfolioExperience: vi.fn(async () => ({ data: [] })),
}))

const inRouter = (ui: React.ReactElement, path = '/') => (
  <HelmetProvider>
    <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
  </HelmetProvider>
)

describe('resume links', () => {
  it('PillLink opens a .pdf as a plain link in a new tab, not a client route', () => {
    render(inRouter(<PillLink to="/file.pdf">Get it</PillLink>))
    const link = screen.getByRole('link', { name: /Get it/ })
    expect(link).toHaveAttribute('href', '/file.pdf')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('the home page links the resume from the hero and the closing block', async () => {
    render(inRouter(<App />))
    await screen.findByText(/Open to software engineering roles/)
    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter((href) => href === RESUME_PATH)
    // hero + closing block + footer
    expect(hrefs).toHaveLength(3)
  })

  it('the contact page lists the resume', async () => {
    render(inRouter(<App />, '/contact'))
    const link = await screen.findByRole('link', { name: /Resume/ })
    expect(link).toHaveAttribute('href', RESUME_PATH)
    expect(link).toHaveAttribute('target', '_blank')
  })
})

describe('closing call to action', () => {
  it('offers email and the resume once the bio is loaded', () => {
    render(inRouter(<ClosingCta bio={bio} />))
    expect(screen.getByRole('heading', { name: 'Open to software engineering roles.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', 'mailto:zach@example.com')
    expect(screen.getByRole('link', { name: /Download resume/ })).toHaveAttribute('href', RESUME_PATH)
  })

  it('falls back to the contact page while the bio is unavailable', () => {
    render(inRouter(<ClosingCta bio={null} />))
    expect(screen.getByRole('link', { name: /Get in touch/ })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: /Download resume/ })).toBeInTheDocument()
  })

  it('appears after the projects on the home page', async () => {
    render(inRouter(<App />))
    await waitFor(() => expect(screen.getByText(/Open to software engineering roles/)).toBeInTheDocument())
  })
})

describe('location wording', () => {
  it('uses "Los Angeles, CA" in the SEO copy, matching the bio and resume', () => {
    expect(HOME_SEO.description).toContain('Los Angeles, CA')
    expect(CONTACT_SEO.description).toContain('Los Angeles, CA')
    expect(HOME_SEO.description + CONTACT_SEO.description).not.toContain('California')
  })
})
