import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import PageErrorBoundary from '../components/public/PageErrorBoundary'

let shouldThrow = true
function Bomb() {
  if (shouldThrow) throw new Error('bad data')
  return <p>recovered</p>
}

describe('PageErrorBoundary', () => {
  afterEach(() => {
    shouldThrow = true
    vi.restoreAllMocks()
  })

  it('shows an error with Retry instead of a blank page, and recovers', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <PageErrorBoundary>
        <Bomb />
      </PageErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load this page.")
    expect(logged).toHaveBeenCalledWith('Page failed to render', expect.any(Error), expect.any(String))

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })

  it('renders children untouched when nothing fails', () => {
    shouldThrow = false
    render(
      <PageErrorBoundary>
        <Bomb />
      </PageErrorBoundary>,
    )
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })
})
