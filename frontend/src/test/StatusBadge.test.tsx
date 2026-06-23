import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatusBadge from '../components/StatusBadge'

describe('StatusBadge', () => {
  it('renders known status labels', () => {
    render(<StatusBadge status="applied" />)
    expect(screen.getByText('Applied')).toBeInTheDocument()
  })

  it('renders Phone Screen for phone_screen', () => {
    render(<StatusBadge status="phone_screen" />)
    expect(screen.getByText('Phone Screen')).toBeInTheDocument()
  })

  it('renders Offer for offer', () => {
    render(<StatusBadge status="offer" />)
    expect(screen.getByText('Offer')).toBeInTheDocument()
  })

  it('renders Rejected for rejected', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('renders Technical for technical', () => {
    render(<StatusBadge status="technical" />)
    expect(screen.getByText('Technical')).toBeInTheDocument()
  })

  it('renders raw status string for unknown status', () => {
    render(<StatusBadge status="unknown_stage" />)
    expect(screen.getByText('unknown_stage')).toBeInTheDocument()
  })

  it('applies correct color class for offer', () => {
    const { container } = render(<StatusBadge status="offer" />)
    expect(container.firstChild).toHaveClass('text-emerald-300')
  })

  it('applies fallback class for unknown status', () => {
    const { container } = render(<StatusBadge status="xyz" />)
    expect(container.firstChild).toHaveClass('bg-gray-800')
  })
})
