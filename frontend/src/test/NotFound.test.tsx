import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.public'
import NotFound, { NOT_FOUND_TITLE } from '../pages/NotFound'

const robotsMetas = () => document.head.querySelectorAll('meta[name="robots"]')

const withProviders = (ui: React.ReactElement, initialEntries?: string[]) => (
  <HelmetProvider>
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  </HelmetProvider>
)

describe('NotFound', () => {
  it('renders a heading and a link home', () => {
    render(withProviders(<NotFound />))
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/')
  })

  it('sets the title and a noindex meta, and removes the meta on unmount', async () => {
    const { unmount } = render(withProviders(<NotFound />))
    await waitFor(() => expect(document.title).toBe(NOT_FOUND_TITLE))
    expect(robotsMetas()).toHaveLength(1)
    expect(robotsMetas()[0]).toHaveAttribute('content', 'noindex')
    unmount()
    await waitFor(() => expect(robotsMetas()).toHaveLength(0))
  })

  it('is rendered by the public app for unknown URLs and keeps its title', async () => {
    render(withProviders(<App />, ['/does-not-exist']))
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    await waitFor(() => expect(robotsMetas()).toHaveLength(1))
    expect(document.title).toBe(NOT_FOUND_TITLE)
  })
})
