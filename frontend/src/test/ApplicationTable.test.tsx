import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
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
    expect(screen.getByText('Engineer')).toBeInTheDocument()
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
})
