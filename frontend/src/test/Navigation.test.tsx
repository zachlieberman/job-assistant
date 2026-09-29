import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import BottomBar from '../components/BottomBar'
import TopBar from '../components/TopBar'
import { NAV_ITEMS, isNavActive, pageTitle } from '../lib/navigation'

vi.mock('../api/client', () => ({ clearAuthToken: vi.fn() }))

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

describe('navigation helpers', () => {
  it('lists the five destinations', () => {
    expect(NAV_ITEMS.map((i) => i.shortLabel)).toEqual(['Dashboard', 'New', 'Journey', 'Profile', 'Admin'])
  })

  it('treats application and interview pages as part of Dashboard', () => {
    expect(isNavActive('/tracker', '/tracker/applications/3')).toBe(true)
    expect(isNavActive('/tracker', '/tracker/interview/3')).toBe(true)
    expect(isNavActive('/tracker', '/tracker/new')).toBe(false)
    expect(isNavActive('/admin', '/admin')).toBe(true)
  })

  it('maps paths to page titles', () => {
    expect(pageTitle('/tracker')).toBe('Dashboard')
    expect(pageTitle('/tracker/new')).toBe('New application')
    expect(pageTitle('/tracker/journey')).toBe('Journey')
    expect(pageTitle('/admin')).toBe('Admin')
    expect(pageTitle('/tracker/interview/2')).toBe('Interview prep')
  })
})

describe('Sidebar', () => {
  it('renders labelled links and marks the current page', () => {
    render(<MemoryRouter><Sidebar pathname="/tracker/journey" /></MemoryRouter>)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getAllByRole('link')).toHaveLength(5)
    expect(within(nav).getByRole('link', { name: 'Journey' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })
})

describe('BottomBar', () => {
  it('renders five destinations with 44px+ targets', () => {
    render(<MemoryRouter><BottomBar pathname="/tracker/new" /></MemoryRouter>)
    const nav = screen.getByRole('navigation', { name: 'Primary mobile' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(5)
    links.forEach((l) => expect(l.className).toContain('min-h-[56px]'))
    expect(within(nav).getByRole('link', { name: 'New' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('TopBar and search', () => {
  beforeEach(() => vi.clearAllMocks())

  function renderBar(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <TopBar pathname={path.split('?')[0]} />
        <Routes><Route path="*" element={<Where />} /></Routes>
      </MemoryRouter>,
    )
  }

  it('shows the page title, New application, and Sign out', () => {
    renderBar('/tracker')
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New application' })).toHaveAttribute('href', '/tracker/new')
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('has no bell or avatar controls', () => {
    renderBar('/tracker')
    expect(screen.queryByRole('button', { name: /notif|bell|avatar|account/i })).not.toBeInTheDocument()
  })

  it('writes the query to the URL as you type on the dashboard', () => {
    renderBar('/tracker')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'acme' } })
    expect(screen.getByTestId('where')).toHaveTextContent('/tracker?q=acme')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/tracker$/)
  })

  it('jumps to the dashboard results when submitted from another page', () => {
    renderBar('/tracker/journey')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a b' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByTestId('where')).toHaveTextContent('/tracker?q=a%20b')
  })

  it('clears the token and goes to login on sign out', async () => {
    const { clearAuthToken } = await import('../api/client')
    renderBar('/tracker')
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(clearAuthToken).toHaveBeenCalled()
    expect(screen.getByTestId('where')).toHaveTextContent('/login')
  })
})
