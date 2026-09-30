import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import type { Application } from '../api/client'
import { makeApp } from './fixtures'

vi.mock('../api/client', () => ({
  listApplications: vi.fn(),
  importApplicationsCsv: vi.fn(),
  updateApplication: vi.fn().mockResolvedValue({ data: {} }),
}))

async function renderDashboard(apps: Application[], path = '/tracker') {
  const { listApplications } = await import('../api/client')
  vi.mocked(listApplications).mockResolvedValue({ data: apps } as never)
  render(
    <MemoryRouter initialEntries={[path]}>
      <Dashboard />
    </MemoryRouter>,
  )
  await screen.findByRole('region', { name: 'Key figures' })
}

const kpi = (label: string) =>
  within(screen.getByRole('region', { name: 'Key figures' })).getByText(label).nextSibling

describe('Dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows a layout-holding skeleton while loading', async () => {
    const { listApplications } = await import('../api/client')
    vi.mocked(listApplications).mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading applications…')
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })

  it('explains an error and retries', async () => {
    const { listApplications } = await import('../api/client')
    vi.mocked(listApplications).mockRejectedValueOnce(new Error('Network error'))
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(await screen.findByText('Failed to load applications.')).toBeInTheDocument()
    expect(screen.getByText(/check that the backend is running/i)).toBeInTheDocument()
    vi.mocked(listApplications).mockResolvedValueOnce({ data: [makeApp()] } as never)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('region', { name: 'Key figures' })).toBeInTheDocument()
  })

  it('shows KPI figures derived from every application', async () => {
    await renderDashboard([
      makeApp({ id: 1, status: 'applied' }),
      makeApp({ id: 2, status: 'recruiter_screen' }),
      makeApp({ id: 3, status: 'interview' }),
      makeApp({ id: 4, status: 'offer' }),
    ])
    expect(kpi('Total applied')).toHaveTextContent('4')
    expect(kpi('In progress')).toHaveTextContent('2')
    expect(kpi('Offers')).toHaveTextContent('1')
    expect(kpi('Response rate')).toHaveTextContent('75%')
  })

  it('renders the activity chart, pipeline donut, and recent list', async () => {
    await renderDashboard([makeApp()])
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pipeline' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recent applications' })).toBeInTheDocument()
  })

  it('filters the table by company from the ?q= search param', async () => {
    await renderDashboard(
      [makeApp({ id: 1, company: 'Google', role: 'SWE' }), makeApp({ id: 2, company: 'Meta', role: 'PM' })],
      '/tracker?q=google',
    )
    expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument()
    const table = screen.getAllByRole('table').slice(-1)[0]
    expect(within(table).getByText('Google')).toBeInTheDocument()
    expect(within(table).queryByText('Meta')).not.toBeInTheDocument()
  })

  it('filters by role via the search param', async () => {
    await renderDashboard(
      [makeApp({ id: 1, company: 'Alpha', role: 'Designer' }), makeApp({ id: 2, company: 'Beta', role: 'Engineer' })],
      '/tracker?q=designer',
    )
    expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument()
  })

  it('shows a no-matches state with a way to clear filters', async () => {
    await renderDashboard([makeApp({ company: 'Google' })], '/tracker?q=zzz')
    expect(screen.getByText(/No applications match “zzz”/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument()
  })

  it('filters by status without changing the KPI totals', async () => {
    await renderDashboard([makeApp({ id: 1 }), makeApp({ id: 2, status: 'offer' })])
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'offer' } })
    expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument()
    expect(kpi('Total applied')).toHaveTextContent('2')
  })

  it('shows a helpful empty state when there are no applications', async () => {
    await renderDashboard([])
    expect(screen.getByText('No applications yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add your first application/i })).toBeInTheDocument()
  })

  it('disables Export CSV when nothing is visible', async () => {
    await renderDashboard([])
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled()
  })

  it('enables Export CSV when applications exist', async () => {
    await renderDashboard([makeApp()])
    expect(screen.getByRole('button', { name: /export csv/i })).not.toBeDisabled()
  })

  it('reports a CSV import result and refreshes the list', async () => {
    const { importApplicationsCsv, listApplications } = await import('../api/client')
    vi.mocked(importApplicationsCsv).mockResolvedValue({ data: { imported: 2, skipped: 1, errors: [] } } as never)
    await renderDashboard([makeApp()])
    fireEvent.change(screen.getByLabelText('Import applications CSV file'), {
      target: { files: [new File(['a'], 'a.csv', { type: 'text/csv' })] },
    })
    expect(await screen.findByText('Imported 2 applications, skipped 1.')).toBeInTheDocument()
    await waitFor(() => expect(listApplications).toHaveBeenCalledTimes(2))
  })

  it('explains a failed import', async () => {
    const { importApplicationsCsv } = await import('../api/client')
    vi.mocked(importApplicationsCsv).mockRejectedValue(new Error('bad'))
    await renderDashboard([makeApp()])
    fireEvent.change(screen.getByLabelText('Import applications CSV file'), {
      target: { files: [new File(['a'], 'a.csv')] },
    })
    expect(await screen.findByText(/Import failed\. Check that the file is a CSV/)).toBeInTheDocument()
  })

  it('sorts by a column when its header is clicked', async () => {
    await renderDashboard([makeApp({ id: 1, company: 'Zed' }), makeApp({ id: 2, company: 'Abe' })])
    const table = screen.getAllByRole('table').slice(-1)[0]
    fireEvent.click(within(table).getByRole('button', { name: 'Company' }))
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Abe')
  })
})
