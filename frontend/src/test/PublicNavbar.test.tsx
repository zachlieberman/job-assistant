import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PublicNavbar from '../components/PublicNavbar'

const renderNav = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PublicNavbar />
    </MemoryRouter>,
  )

describe('PublicNavbar', () => {
  it('shows the name, a "Let\'s talk" link and a closed menu button', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Zachary Lieberman' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: "Let's talk" })).toHaveAttribute('href', '/contact')
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('offers a skip link to the main content', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it('opens a full-screen menu with all pages and focuses the close button', async () => {
    renderNav('/projects')
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus()
    for (const name of ['Home', 'Projects', 'Experience', 'Contact']) {
      expect(screen.getByRole('link', { name: new RegExp(name) })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: /Projects/ })).toHaveAttribute('aria-current', 'page')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes on Escape, restores focus and unlocks scrolling', async () => {
    renderNav()
    const open = screen.getByRole('button', { name: 'Open menu' })
    await userEvent.click(open)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(open).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes with the close button and after choosing a page', async () => {
    renderNav()
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await userEvent.click(screen.getByRole('link', { name: 'Experience' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps Tab and Shift+Tab inside the open menu', async () => {
    renderNav()
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 12; i++) {
      await userEvent.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    for (let i = 0; i < 12; i++) {
      await userEvent.tab({ shift: true })
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('never renders tracker-only navigation', () => {
    renderNav()
    expect(screen.queryByText(/log in/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/edit portfolio/i)).not.toBeInTheDocument()
  })

  it('pulls focus back into the menu if it lands outside', async () => {
    renderNav()
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    ;(document.activeElement as HTMLElement).blur()
    await userEvent.tab()
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })
})
