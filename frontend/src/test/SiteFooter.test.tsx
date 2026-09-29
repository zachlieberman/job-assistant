import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SiteFooter from '../components/public/SiteFooter'
import PublicNavbar from '../components/PublicNavbar'

describe('SiteFooter', () => {
  it('links every public page without needing the menu to open', () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: 'Footer' })
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(['/', '/projects', '/experience', '/contact'])
  })
})

describe('menu button', () => {
  it('points aria-controls at the menu only while it exists', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    render(
      <MemoryRouter>
        <PublicNavbar />
      </MemoryRouter>,
    )
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).not.toHaveAttribute('aria-controls')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-controls', 'site-menu')
    expect(document.getElementById('site-menu')).not.toBeNull()
  })
})
