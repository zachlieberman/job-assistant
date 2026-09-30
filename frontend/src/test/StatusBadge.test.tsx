import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatusBadge from '../components/StatusBadge'
import { STATUSES, STATUS_META, isStatus, statusLabel } from '../lib/statusMeta'

describe('StatusBadge', () => {
  it.each([
    ['applied', 'Applied'],
    ['recruiter_screen', 'Recruiter screen'],
    ['interview', 'Interview'],
    ['final_interview', 'Final interview'],
    ['offer', 'Offer'],
    ['rejected', 'Rejected'],
  ])('renders %s as "%s" with an icon', (status, label) => {
    const { container } = render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders the raw string, without an icon, for an unknown status', () => {
    const { container } = render(<StatusBadge status="unknown_stage" />)
    expect(screen.getByText('unknown_stage')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
    expect(container.firstChild).toHaveClass('bg-raised')
  })

  it('makes offer the most saturated step and rejected neutral', () => {
    expect(render(<StatusBadge status="offer" />).container.firstChild).toHaveClass('bg-stage-offer-bg')
    expect(render(<StatusBadge status="rejected" />).container.firstChild).toHaveClass('text-stage-rejected-fg')
  })
})

describe('statusMeta', () => {
  it('gives every status a distinct icon, label, and mark colour', () => {
    const icons = new Set(STATUSES.map((s) => STATUS_META[s].Icon))
    const labels = new Set(STATUSES.map((s) => STATUS_META[s].label))
    const marks = new Set(STATUSES.map((s) => STATUS_META[s].mark))
    expect(icons.size).toBe(STATUSES.length)
    expect(labels.size).toBe(STATUSES.length)
    expect(marks.size).toBe(STATUSES.length)
  })

  it('narrows and labels statuses', () => {
    expect(isStatus('offer')).toBe(true)
    expect(isStatus('nope')).toBe(false)
    expect(statusLabel('recruiter_screen')).toBe('Recruiter screen')
    expect(statusLabel('nope')).toBe('nope')
  })
})
