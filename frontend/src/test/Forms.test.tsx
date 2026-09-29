import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Field from '../components/ui/Field'
import ErrorPanel from '../components/ui/ErrorPanel'
import NewApplication, { validate } from '../pages/NewApplication'
import Login from '../pages/Login'
import JourneyFlowTable from '../components/JourneyFlowTable'
import Toast from '../components/Toast'

vi.mock('../api/client', () => ({
  createApplication: vi.fn(),
  login: vi.fn(),
  setAuthToken: vi.fn(),
}))

describe('Field', () => {
  it('links label, hint, and error to the control', () => {
    render(<Field label="Company" hint="Legal name" error="Enter it"><input /></Field>)
    const input = screen.getByLabelText('Company')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain('error')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter it')
  })

  it('shows the hint when there is no error', () => {
    render(<Field label="Tags" hint="Comma separated" required><input /></Field>)
    expect(screen.getByText('Comma separated')).toBeInTheDocument()
    expect(screen.getByText('(required)')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tags/)).not.toHaveAttribute('aria-invalid')
  })
})

describe('ErrorPanel', () => {
  it('explains the problem and offers retry', () => {
    const onRetry = vi.fn()
    render(<ErrorPanel title="Failed" detail="Check the API" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Check the API')
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })
  it('omits retry when no handler is given', () => {
    render(<ErrorPanel title="Failed" detail="x" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('NewApplication', () => {
  beforeEach(() => vi.clearAllMocks())
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/tracker/new']}>
        <Routes>
          <Route path="/tracker/new" element={<NewApplication />} />
          <Route path="/tracker/applications/:id" element={<p>saved</p>} />
        </Routes>
      </MemoryRouter>,
    )

  it('validates required fields', () => {
    expect(validate({ company: '', role: ' ', jobUrl: '', jobDescription: '', location: '', salaryRange: '' })).toEqual({
      company: expect.any(String), role: expect.any(String), jobDescription: expect.any(String),
    })
  })

  it('shows errors next to the fields and clears them as you type', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Save application' }))
    expect(screen.getAllByRole('alert')).toHaveLength(3)
    expect(screen.getByLabelText(/Company/)).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'Acme' } })
    expect(screen.getByLabelText(/Company/)).not.toHaveAttribute('aria-invalid')
  })

  it('saves and navigates to the new application', async () => {
    const { createApplication } = await import('../api/client')
    vi.mocked(createApplication).mockResolvedValue({ data: { id: 9 } } as never)
    renderPage()
    fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText(/Role/), { target: { value: 'Eng' } })
    fireEvent.change(screen.getByLabelText(/Job description/), { target: { value: 'JD' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save application' }))
    expect(await screen.findByText('saved')).toBeInTheDocument()
  })

  it('explains a save failure and keeps the entries', async () => {
    const { createApplication } = await import('../api/client')
    vi.mocked(createApplication).mockRejectedValue(new Error('x'))
    renderPage()
    fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText(/Role/), { target: { value: 'Eng' } })
    fireEvent.change(screen.getByLabelText(/Job description/), { target: { value: 'JD' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save application' }))
    expect(await screen.findByText(/your entries are still here/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Company/)).toHaveValue('Acme')
  })
})

describe('Login', () => {
  beforeEach(() => vi.clearAllMocks())
  it('shows the error beside the password field', async () => {
    const { login } = await import('../api/client')
    vi.mocked(login).mockRejectedValue(new Error('x'))
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not reach the server/i))
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('JourneyFlowTable and Toast', () => {
  it('lists each flow as a row', () => {
    render(
      <JourneyFlowTable
        data={{ nodes: [{ name: 'applied' }, { name: 'phone_screen' }], links: [{ source: 0, target: 1, value: 3 }] }}
      />,
    )
    expect(screen.getByRole('table', { hidden: true })).toHaveTextContent('Phone screen')
  })
  it('renders nothing without links', () => {
    const { container } = render(<JourneyFlowTable data={{ nodes: [], links: [] }} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('uses alert role for errors and status for success', () => {
    const { rerender } = render(<Toast message="Saved" type="success" visible />)
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    rerender(<Toast message="Nope" type="error" visible />)
    expect(screen.getByRole('alert')).toHaveTextContent('Nope')
  })
})
