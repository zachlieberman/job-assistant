import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PublicNavbar from '../components/PublicNavbar'

describe('PublicNavbar', () => {
  it('renders the portfolio nav links', () => {
    render(
      <MemoryRouter>
        <PublicNavbar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('highlights the active route', () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <PublicNavbar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Projects')).toHaveClass('text-white')
    expect(screen.getByText('Home')).toHaveClass('text-gray-500')
  })

  it('never renders tracker-only navigation', () => {
    render(
      <MemoryRouter>
        <PublicNavbar />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/log in/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/edit portfolio/i)).not.toBeInTheDocument()
  })
})
