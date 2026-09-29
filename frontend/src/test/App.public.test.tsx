import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from '../App.public'
import * as client from '../api/client'

vi.mock('../api/client', () => ({
  getPortfolioBio: vi.fn(),
  listPortfolioProjects: vi.fn(),
  listPortfolioExperience: vi.fn(),
}))

const bio = {
  id: 1,
  name: 'Zachary Lieberman',
  title: 'Software engineer',
  location: 'New York',
  bio: 'I build things.',
  email: 'zach@example.com',
  github_url: 'https://github.com/zach',
  linkedin_url: 'javascript:alert(1)',
  updated_at: '',
}
const projects = [
  { id: 1, name: 'Alpha', description: 'First', tags: ['React'], link: null, sort_order: 0 },
  { id: 2, name: 'Beta', description: 'Second', tags: [], link: null, sort_order: 1 },
  { id: 3, name: 'Gamma', description: 'Third', tags: [], link: null, sort_order: 2 },
  { id: 4, name: 'Delta', description: 'Fourth', tags: [], link: null, sort_order: 3 },
]
const jobs = [
  { id: 1, role: 'Engineer', company: 'Acme', period: '2020', bullets: ['Did work'], sort_order: 0 },
]

const renderAt = (path: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </HelmetProvider>,
  )

describe('App.public', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(client.getPortfolioBio).mockResolvedValue({ data: bio } as never)
    vi.mocked(client.listPortfolioProjects).mockResolvedValue({ data: projects } as never)
    vi.mocked(client.listPortfolioExperience).mockResolvedValue({ data: jobs } as never)
  })

  it('shows the hero skeleton, then the greeting, headline and CTA at "/"', async () => {
    renderAt('/')
    expect(screen.getByText('Loading introduction')).toBeInTheDocument()
    expect(await screen.findByText("Hello! I'm Zachary Lieberman.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'I build careful software for real problems.',
    )
    expect(screen.getByText('Available for work')).toBeInTheDocument()
    expect(screen.getByText('Software engineer, based in New York.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See my work' })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('img', { name: /holding his small brown dog/ })).toHaveAttribute('width', '768')
    expect(document.title).toBe('Zachary Lieberman')
  })

  it('lists the first three projects under "Selected works"', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Selected works' })).toBeInTheDocument()
    await screen.findByRole('button', { name: /Alpha/ })
    expect(screen.getByRole('button', { name: /Gamma/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delta/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All projects' })).toHaveAttribute('href', '/projects')
  })

  it('shows an error with Retry when the bio fails, then recovers', async () => {
    vi.mocked(client.getPortfolioBio).mockRejectedValueOnce(new Error('cold'))
    renderAt('/')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Couldn't load the introduction.")
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText("Hello! I'm Zachary Lieberman.")).toBeInTheDocument()
  })

  it('shows an empty message when there are no projects', async () => {
    vi.mocked(client.listPortfolioProjects).mockResolvedValue({ data: [] } as never)
    renderAt('/')
    expect(await screen.findByText('Projects are on the way.')).toBeInTheDocument()
  })

  it('renders the live demo first and every project at "/projects"', async () => {
    renderAt('/projects')
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Application journey' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Delta/ })).toBeInTheDocument()
    expect(document.title).toBe('Projects | Zachary Lieberman')
  })

  it('retries the projects list after a failure', async () => {
    vi.mocked(client.listPortfolioProjects).mockRejectedValueOnce(new Error('x'))
    renderAt('/projects')
    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('button', { name: /Alpha/ })).toBeInTheDocument()
  })

  it('renders experience as a timeline at "/experience"', async () => {
    renderAt('/experience')
    expect(await screen.findByRole('heading', { name: 'Engineer' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Work history' })).toBeInTheDocument()
  })

  it('shows an error with Retry on the experience page', async () => {
    vi.mocked(client.listPortfolioExperience).mockRejectedValueOnce(new Error('x'))
    renderAt('/experience')
    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Engineer' })).toBeInTheDocument()
  })

  it('lists safe contact links and drops unsafe ones at "/contact"', async () => {
    renderAt('/contact')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Let's talk")
    const email = await screen.findByRole('link', { name: /zach@example.com/ })
    expect(email).toHaveAttribute('href', 'mailto:zach@example.com')
    expect(screen.getByRole('link', { name: /github.com\/zach/ })).toHaveAttribute('target', '_blank')
    expect(screen.queryByText('LinkedIn')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Bernabéu/ })).toBeInTheDocument()
  })

  it('says so when no contact details are set', async () => {
    vi.mocked(client.getPortfolioBio).mockResolvedValue({
      data: { ...bio, email: null, github_url: null, linkedin_url: null },
    } as never)
    renderAt('/contact')
    expect(await screen.findByText('No contact details are listed yet.')).toBeInTheDocument()
  })

  it('shows an error with Retry on the contact page', async () => {
    vi.mocked(client.getPortfolioBio).mockRejectedValueOnce(new Error('x'))
    renderAt('/contact')
    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('link', { name: /zach@example.com/ })).toBeInTheDocument()
  })

  it('moves focus to the main region after client-side navigation', async () => {
    renderAt('/')
    await screen.findByText("Hello! I'm Zachary Lieberman.")
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await userEvent.click(screen.getByRole('link', { name: 'Contact' }))
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
  })

  it('has no route for tracker or login paths', () => {
    renderAt('/tracker')
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })
})
