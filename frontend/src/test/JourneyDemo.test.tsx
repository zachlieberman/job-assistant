import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import * as client from '../api/client'
import JourneyDemoCard from '../components/public/JourneyDemoCard'
import ApplicationJourneySankey from '../components/ApplicationJourneySankey'
import { SAMPLE_JOURNEY, journeyRows } from '../content/sampleJourney'

vi.mock('../api/client', () => ({ getApplicationJourney: vi.fn() }))

describe('JourneyDemoCard', () => {
  it('labels itself as a live demo with a legend', () => {
    render(<JourneyDemoCard />)
    expect(screen.getByRole('heading', { name: 'Application journey' })).toBeInTheDocument()
    expect(screen.getByText('Live demo')).toBeInTheDocument()
    const legend = screen.getByRole('list', { name: 'Legend' })
    expect(within(legend).getByText('Ended without an offer')).toBeInTheDocument()
  })

  it('offers every flow in a plain-text table', () => {
    render(<JourneyDemoCard />)
    const table = screen.getByRole('table', { hidden: true })
    const rows = within(table).getAllByRole('row', { hidden: true })
    expect(rows).toHaveLength(SAMPLE_JOURNEY.links.length + 1)
    expect(within(table).getAllByText('Phone screen', { exact: true, ignore: 'never' }).length).toBeGreaterThan(0)
    expect(screen.getByText('View as a table').tagName).toBe('SUMMARY')
  })

  it('draws the chart from sample data without calling the API', async () => {
    render(<JourneyDemoCard />)
    expect(await screen.findByLabelText('Applied: 40')).toBeInTheDocument()
    expect(client.getApplicationJourney).not.toHaveBeenCalled()
  })

  it('shows a tooltip on keyboard focus and hides it on blur', async () => {
    render(<JourneyDemoCard />)
    const node = await screen.findByLabelText('Offer: 3')
    expect(node).toHaveAttribute('tabindex', '0')
    fireEvent.focus(node)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Offer: 3')
    fireEvent.blur(node)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows a tooltip for a flow on pointer hover', async () => {
    const { container } = render(<JourneyDemoCard />)
    await screen.findByLabelText('Applied: 40')
    const link = container.querySelector('svg path[stroke-width]')!
    fireEvent.pointerEnter(link)
    expect(screen.getByRole('tooltip').textContent).toMatch(/ to .*: \d+/)
    fireEvent.pointerLeave(link)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('journeyRows', () => {
  it('labels each link, falling back to the raw name', () => {
    const rows = journeyRows(SAMPLE_JOURNEY, { applied: 'Applied' })
    expect(rows[0]).toEqual({ from: 'Applied', to: 'phone_screen', value: 18 })
  })
})

describe('ApplicationJourneySankey (shared with the tracker)', () => {
  it('stays non-interactive by default', () => {
    const { container } = render(<ApplicationJourneySankey data={SAMPLE_JOURNEY} />)
    expect(container.querySelector('[tabindex]')).toBeNull()
  })

  it('shows an empty message with no data', () => {
    render(<ApplicationJourneySankey data={{ nodes: [], links: [] }} />)
    expect(screen.getByText(/No journey data yet/)).toBeInTheDocument()
  })
})
