import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.public'

vi.mock('../api/client', () => ({
  getPortfolioBio: vi.fn().mockResolvedValue({
    data: { name: 'Zachary Lieberman', title: 'Engineer', location: null, bio: 'Hi' },
  }),
  listPortfolioProjects: vi.fn().mockResolvedValue({ data: [] }),
  listPortfolioExperience: vi.fn().mockResolvedValue({ data: [] }),
}))

describe('App.public', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the public navbar and the home page at "/"', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Projects')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Zachary Lieberman')).toBeInTheDocument())
  })

  it('renders the projects page at "/projects"', async () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument())
  })

  it('has no route for tracker or login paths', () => {
    render(
      <MemoryRouter initialEntries={['/tracker']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })
})
