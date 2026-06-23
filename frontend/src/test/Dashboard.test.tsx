import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import type { Application } from '../api/client'

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: 1,
  company: 'Acme',
  role: 'Engineer',
  status: 'applied',
  date_applied: '2024-01-15',
  job_url: null,
  job_description: '',
  resume_id: null,
  tailored_resume: null,
  cover_letter: null,
  notes: null,
  location: null,
  salary_range: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
})

vi.mock('../api/client', () => ({
  listApplications: vi.fn(),
  importApplicationsCsv: vi.fn(),
  updateApplication: vi.fn().mockResolvedValue({ data: {} }),
}))

async function setupDashboard(apps: Application[]) {
  const { listApplications } = await import('../api/client')
  vi.mocked(listApplications).mockResolvedValue({ data: apps } as never)

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )

  await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', async () => {
    const { listApplications } = await import('../api/client')
    vi.mocked(listApplications).mockReturnValue(new Promise(() => {}))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    const { listApplications } = await import('../api/client')
    vi.mocked(listApplications).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Failed to load applications.')).toBeInTheDocument(),
    )
  })

  it('displays stat cards with correct counts', async () => {
    const apps = [
      makeApp({ id: 1, status: 'applied' }),
      makeApp({ id: 2, status: 'phone_screen' }),
      makeApp({ id: 3, status: 'technical' }),
      makeApp({ id: 4, status: 'offer' }),
    ]
    await setupDashboard(apps)

    expect(screen.getByText('4')).toBeInTheDocument() // total
    expect(screen.getByText('2')).toBeInTheDocument() // in progress (phone_screen + technical)
    expect(screen.getByText('1')).toBeInTheDocument() // offers
  })

  it('filters applications by search query', async () => {
    const apps = [
      makeApp({ id: 1, company: 'Google', role: 'SWE' }),
      makeApp({ id: 2, company: 'Meta', role: 'PM' }),
    ]
    await setupDashboard(apps)

    const searchInput = screen.getByPlaceholderText('Search company or role…')
    fireEvent.change(searchInput, { target: { value: 'google' } })

    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.queryByText('Meta')).not.toBeInTheDocument()
  })

  it('filters by role via search', async () => {
    const apps = [
      makeApp({ id: 1, company: 'Alpha', role: 'Designer' }),
      makeApp({ id: 2, company: 'Beta', role: 'Engineer' }),
    ]
    await setupDashboard(apps)

    fireEvent.change(screen.getByPlaceholderText('Search company or role…'), {
      target: { value: 'designer' },
    })

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  })

  it('shows empty state when no applications', async () => {
    await setupDashboard([])
    expect(screen.getByText('No applications yet.')).toBeInTheDocument()
  })

  it('Export CSV button is disabled when no applications', async () => {
    await setupDashboard([])
    expect(screen.getByText('Export CSV')).toBeDisabled()
  })

  it('Export CSV button is enabled when applications exist', async () => {
    await setupDashboard([makeApp()])
    expect(screen.getByText('Export CSV')).not.toBeDisabled()
  })
})
