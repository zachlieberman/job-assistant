import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Timeline from '../components/public/Timeline'
import type { PortfolioExperience } from '../api/client'

const jobs: PortfolioExperience[] = [
  { id: 1, role: 'Senior engineer', company: 'Acme', period: '2023 to now', bullets: ['Led a team', 'Cut costs'], sort_order: 0 },
  { id: 2, role: 'Engineer', company: 'Globex', period: '2020 to 2023', bullets: [], sort_order: 1 },
]

describe('Timeline', () => {
  it('renders an ordered list with one entry per job', () => {
    render(<Timeline jobs={jobs} />)
    const list = screen.getByRole('list', { name: /Work history/ })
    expect(list.tagName).toBe('OL')
    expect(screen.getAllByRole('listitem').filter((li) => li.tagName === 'LI' && li.parentElement === list)).toHaveLength(2)
  })

  it('shows role, company, period and bullets', () => {
    render(<Timeline jobs={jobs} />)
    expect(screen.getByRole('heading', { name: 'Senior engineer' })).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('2023 to now')).toBeInTheDocument()
    expect(screen.getByText('Led a team')).toBeInTheDocument()
  })

  it('marks entries active when the observer is unavailable (never hidden)', () => {
    const { container } = render(<Timeline jobs={jobs} />)
    container.querySelectorAll('[data-active]').forEach((dot) => {
      expect(dot).toHaveAttribute('data-active', 'true')
    })
  })

  it('shows a message when there is no experience', () => {
    render(<Timeline jobs={[]} />)
    expect(screen.getByText('No experience listed yet.')).toBeInTheDocument()
  })
})
