import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TrackerNavbar from '../components/TrackerNavbar'

vi.mock('../api/client', () => ({
  getAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}))

describe('TrackerNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the tracker nav links', () => {
    render(
      <MemoryRouter>
        <TrackerNavbar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('New Application')).toBeInTheDocument()
    expect(screen.getByText('Journey')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Edit Portfolio')).toBeInTheDocument()
  })

  it('shows Log In when no token is present', async () => {
    const { getAuthToken } = await import('../api/client')
    vi.mocked(getAuthToken).mockReturnValue(null)

    render(
      <MemoryRouter>
        <TrackerNavbar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Log In')).toBeInTheDocument()
    expect(screen.queryByText('Log Out')).not.toBeInTheDocument()
  })

  it('shows Log Out and clears the token when clicked', async () => {
    const { getAuthToken, clearAuthToken } = await import('../api/client')
    vi.mocked(getAuthToken).mockReturnValue('some-token')

    render(
      <MemoryRouter>
        <TrackerNavbar />
      </MemoryRouter>,
    )

    const logoutButton = screen.getByText('Log Out')
    expect(logoutButton).toBeInTheDocument()

    fireEvent.click(logoutButton)
    expect(clearAuthToken).toHaveBeenCalled()
  })
})
