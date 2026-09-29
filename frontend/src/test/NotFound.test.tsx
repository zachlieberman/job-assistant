import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.public'
import NotFound, { NOT_FOUND_TITLE } from '../pages/NotFound'

const robotsMetas = () => document.head.querySelectorAll('meta[name="robots"]')

describe('NotFound', () => {
  it('renders a heading and a link home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/')
  })

  it('sets the title and a noindex meta, and removes the meta on unmount', () => {
    const { unmount } = render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )
    expect(document.title).toBe(NOT_FOUND_TITLE)
    expect(robotsMetas()).toHaveLength(1)
    expect(robotsMetas()[0]).toHaveAttribute('content', 'noindex')
    unmount()
    expect(robotsMetas()).toHaveLength(0)
  })

  it('is rendered by the public app for unknown URLs and keeps its title', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(document.title).toBe(NOT_FOUND_TITLE)
    expect(robotsMetas()).toHaveLength(1)
  })
})
