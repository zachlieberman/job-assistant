import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.tracker'

vi.mock('../api/client', () => ({
  getAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}))

describe('App.tracker', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { getAuthToken } = await import('../api/client')
    vi.mocked(getAuthToken).mockReturnValue(null)
  })

  it('redirects "/" to the login page when logged out', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument())
  })

  it('redirects a gated tracker route to login when logged out', async () => {
    render(
      <MemoryRouter initialEntries={['/tracker']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument())
  })

  it('renders the tracker navbar, not the public one', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Job Tracker')).toBeInTheDocument()
    expect(screen.queryByText('Zachary Lieberman')).not.toBeInTheDocument()
  })
})
