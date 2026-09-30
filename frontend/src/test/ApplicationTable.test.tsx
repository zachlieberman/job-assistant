import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ApplicationTable from '../components/ApplicationTable'
import type { Application } from '../api/client'

vi.mock('../api/client', () => ({
  updateApplication: vi.fn().mockResolvedValue({ data: {} }),
}))

const mockApp = (overrides: Partial<Application> = {}): Application => ({
  id: 1,
  company: 'Acme Corp',
  role: 'Engineer',
  status: 'applied',
  date_applied: '2024-01-15',
  job_url: null,
  job_description: 'A job',
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

const defaultProps = {
  applications: [mockApp()],
  sortKey: 'date_applied' as const,
  sortDir: 'desc' as const,
  onSort: vi.fn(),
  onStatusChange: vi.fn(),
}

function renderTable(props = defaultProps) {
  return render(
    <MemoryRouter>
      <ApplicationTable {...props} />
    </MemoryRouter>,
  )
}

describe('ApplicationTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no applications', () => {
    renderTable({ ...defaultProps, applications: [] })
    expect(screen.getByText('No applications yet.')).toBeInTheDocument()
  })

  it('renders application company and role', () => {
    renderTable()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getAllByText('Engineer').length).toBeGreaterThan(0)
  })

  it('renders date_applied', () => {
    renderTable()
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()
  })

  it('renders status select with current value', () => {
    renderTable()
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('applied')
  })

  it('calls onSort when column header is clicked', () => {
    const onSort = vi.fn()
    renderTable({ ...defaultProps, onSort })
    fireEvent.click(screen.getByText(/company/i))
    expect(onSort).toHaveBeenCalledWith('company')
  })

  it('calls updateApplication and onStatusChange on status change', async () => {
    const { updateApplication } = await import('../api/client')
    const onStatusChange = vi.fn()
    renderTable({ ...defaultProps, onStatusChange })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'offer' } })

    await waitFor(() => {
      expect(updateApplication).toHaveBeenCalledWith(1, { status: 'offer' })
      expect(onStatusChange).toHaveBeenCalledWith(1, 'offer')
    })
  })

  it('renders multiple applications', () => {
    const apps = [
      mockApp({ id: 1, company: 'Alpha', role: 'Dev' }),
      mockApp({ id: 2, company: 'Beta', role: 'PM' }),
    ]
    renderTable({ ...defaultProps, applications: apps })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('marks the sorted column with aria-sort', () => {
    renderTable()
    expect(screen.getByRole('columnheader', { name: /applied/i })).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('columnheader', { name: /company/i })).toHaveAttribute('aria-sort', 'none')
  })

  it('shows the status with an icon and label, not just a colour', () => {
    renderTable({ ...defaultProps, applications: [mockApp({ status: 'recruiter_screen' })] })
    const badge = screen.getAllByText('Recruiter screen').find((el) => el.querySelector('svg'))
    expect(badge).toBeTruthy()
  })

  it('offers a call to action in the empty state', () => {
    renderTable({ ...defaultProps, applications: [] })
    expect(screen.getByRole('link', { name: /add your first application/i })).toHaveAttribute('href', '/tracker/new')
  })

  it('renders a custom empty state when provided', () => {
    renderTable({ ...defaultProps, applications: [], emptyState: <p>Nothing matched</p> } as Parameters<typeof renderTable>[0])
    expect(screen.getByText('Nothing matched')).toBeInTheDocument()
  })

  it('shows an error toast when the status update fails', async () => {
    const { updateApplication } = await import('../api/client')
    vi.mocked(updateApplication).mockRejectedValueOnce(new Error('boom'))
    const onStatusChange = vi.fn()
    renderTable({ ...defaultProps, onStatusChange })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'offer' } })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not update the status/i))
    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('opens interview prep from the row action', () => {
    render(
      <MemoryRouter initialEntries={['/tracker']}>
        <Routes>
          <Route path="/tracker" element={<ApplicationTable {...defaultProps} />} />
          <Route path="/tracker/interview/:id" element={<p>interview page</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /interview prep for acme corp/i }))
    expect(screen.getByText('interview page')).toBeInTheDocument()
  })
})
