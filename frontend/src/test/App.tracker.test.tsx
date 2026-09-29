import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.tracker'

vi.mock('../api/client', () => ({
  getAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  listApplications: vi.fn().mockResolvedValue({ data: [] }),
  importApplicationsCsv: vi.fn(),
  updateApplication: vi.fn(),
}))

async function signedIn(value: string | null) {
  const { getAuthToken } = await import('../api/client')
  vi.mocked(getAuthToken).mockReturnValue(value)
}

describe('App.tracker', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await signedIn(null)
  })

  it('redirects "/" to the login page when logged out', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument())
  })

  it('redirects a gated tracker route to login when logged out', async () => {
    render(<MemoryRouter initialEntries={['/tracker']}><App /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument())
  })

  it('shows the tracker brand, not the public site, when logged out', () => {
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>)
    expect(screen.getByText('Job tracker')).toBeInTheDocument()
    expect(screen.queryByText('Zachary Lieberman')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument()
  })

  it('renders the sidebar, bottom bar, and top bar when signed in', async () => {
    await signedIn('token')
    render(<MemoryRouter initialEntries={['/tracker']}><App /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary mobile' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('search')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('No applications yet.')).toBeInTheDocument())
  })
})
