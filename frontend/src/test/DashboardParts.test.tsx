import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import KpiTiles from '../components/dashboard/KpiTiles'
import ActivityChart from '../components/dashboard/ActivityChart'
import StatusDonut from '../components/dashboard/StatusDonut'
import RecentApplications from '../components/dashboard/RecentApplications'
import { activitySeries, statusBreakdown } from '../lib/dashboardStats'
import { makeApp } from './fixtures'

describe('KpiTiles', () => {
  it('renders four labelled figures', () => {
    render(<KpiTiles kpis={{ total: 8, inProgress: 3, offers: 1, responseRate: 62 }} />)
    const region = screen.getByRole('region', { name: 'Key figures' })
    for (const label of ['Total applied', 'In progress', 'Offers', 'Response rate']) {
      expect(within(region).getByText(label)).toBeInTheDocument()
    }
    expect(within(region).getByText('8')).toBeInTheDocument()
    expect(within(region).getByText('62%')).toBeInTheDocument()
  })

  it('shows a dash when the response rate is unknown', () => {
    render(<KpiTiles kpis={{ total: 0, inProgress: 0, offers: 0, responseRate: null }} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('ActivityChart', () => {
  const now = new Date()
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const series = activitySeries([makeApp({ date_applied: iso(now) }), makeApp({ id: 2, date_applied: iso(now) })])

  it('exposes a text summary and a data table', () => {
    render(<ActivityChart series={series} />)
    expect(screen.getByRole('group', { name: /2 applications over the last 12 weeks/ })).toBeInTheDocument()
    const table = screen.getByRole('table', { hidden: true })
    expect(within(table).getAllByRole('row', { hidden: true })).toHaveLength(13)
  })

  it('shows a legend', () => {
    render(<ActivityChart series={series} />)
    expect(screen.getByText('Applications submitted')).toBeInTheDocument()
  })

  it('announces a tooltip when arrow keys move through weeks', () => {
    render(<ActivityChart series={series} />)
    const group = screen.getByRole('group', { name: /arrow keys/ })
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent(/Week of/)
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(screen.getByRole('status')).toHaveTextContent('2 applications')
    fireEvent.keyDown(group, { key: 'Escape' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('describes an empty chart', () => {
    render(<ActivityChart series={activitySeries([])} />)
    expect(screen.getByRole('group', { name: /No applications in the last 12 weeks/ })).toBeInTheDocument()
  })
})

describe('StatusDonut', () => {
  const apps = [makeApp({ id: 1 }), makeApp({ id: 2, status: 'offer' }), makeApp({ id: 3, status: 'rejected' }), makeApp({ id: 4, status: 'rejected' })]

  it('lists every status with icon, count, and percentage', () => {
    render(<StatusDonut slices={statusBreakdown(apps)} />)
    const item = screen.getByText('Rejected').closest('li') as HTMLElement
    expect(within(item).getByText('2')).toBeInTheDocument()
    expect(within(item).getByText('50%')).toBeInTheDocument()
    expect(item.querySelector('svg')).not.toBeNull()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })

  it('has an accessible summary', () => {
    render(<StatusDonut slices={statusBreakdown(apps)} />)
    expect(screen.getByRole('img', { name: /4 applications by status: Applied 1 \(25%\)/ })).toBeInTheDocument()
  })

  it('shows the focused status in the centre', () => {
    render(<StatusDonut slices={statusBreakdown(apps)} />)
    fireEvent.focus(screen.getByText('Offer').closest('li') as HTMLElement)
    expect(screen.getAllByText('Offer').length).toBeGreaterThan(1)
  })

  it('handles no data', () => {
    render(<StatusDonut slices={statusBreakdown([])} />)
    expect(screen.getByRole('img', { name: 'No applications yet.' })).toBeInTheDocument()
  })
})

describe('RecentApplications', () => {
  it('lists the newest five with status and relative time', () => {
    const apps = Array.from({ length: 7 }, (_, i) =>
      makeApp({ id: i + 1, company: `Co${i + 1}`, date_applied: `2024-01-0${i + 1}`, location: i === 6 ? 'Remote' : null }),
    )
    render(<MemoryRouter><RecentApplications applications={apps} /></MemoryRouter>)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(links[0]).toHaveTextContent('Co7')
    expect(links[0]).toHaveTextContent('Remote')
    expect(links[0]).toHaveAttribute('href', '/tracker/applications/7')
    expect(screen.queryByText('Co1')).not.toBeInTheDocument()
  })

  it('tells the user what happens when empty', () => {
    render(<MemoryRouter><RecentApplications applications={[]} /></MemoryRouter>)
    expect(screen.getByText(/New applications appear as you add them/)).toBeInTheDocument()
  })
})
