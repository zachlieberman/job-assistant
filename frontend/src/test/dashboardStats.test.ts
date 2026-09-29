import { describe, it, expect } from 'vitest'
import {
  activitySeries,
  computeKpis,
  filterApplications,
  parseLocalDate,
  relativeTime,
  statusBreakdown,
} from '../lib/dashboardStats'
import { sortApplications } from '../lib/sortApplications'
import { applicationsToCsv } from '../lib/applicationsCsv'
import { makeApp } from './fixtures'

const NOW = new Date(2024, 2, 20) // Wed 20 Mar 2024; week starts Mon 18 Mar

describe('computeKpis', () => {
  it('counts totals, in-progress, offers, and response rate', () => {
    const apps = [
      makeApp({ id: 1, status: 'applied' }),
      makeApp({ id: 2, status: 'phone_screen' }),
      makeApp({ id: 3, status: 'technical' }),
      makeApp({ id: 4, status: 'offer' }),
    ]
    expect(computeKpis(apps)).toEqual({ total: 4, inProgress: 2, offers: 1, responseRate: 75 })
  })

  it('returns a null response rate when there are no applications', () => {
    expect(computeKpis([])).toEqual({ total: 0, inProgress: 0, offers: 0, responseRate: null })
  })

  it('counts a rejection as a response', () => {
    expect(computeKpis([makeApp({ status: 'rejected' })]).responseRate).toBe(100)
  })
})

describe('statusBreakdown', () => {
  it('returns every status with counts and rounded percentages', () => {
    const apps = [makeApp({ id: 1 }), makeApp({ id: 2 }), makeApp({ id: 3, status: 'offer' })]
    const slices = statusBreakdown(apps)
    expect(slices.map((s) => s.status)).toEqual(['applied', 'phone_screen', 'technical', 'offer', 'rejected'])
    expect(slices[0]).toMatchObject({ count: 2, percent: 67 })
    expect(slices[3]).toMatchObject({ count: 1, percent: 33 })
    expect(slices[4]).toMatchObject({ count: 0, percent: 0 })
  })

  it('handles an empty list without dividing by zero', () => {
    expect(statusBreakdown([]).every((s) => s.count === 0 && s.percent === 0)).toBe(true)
  })
})

describe('activitySeries', () => {
  it('buckets applications by week, Monday to Sunday, oldest first', () => {
    const apps = [
      makeApp({ id: 1, date_applied: '2024-03-18' }), // this week (Mon)
      makeApp({ id: 2, date_applied: '2024-03-20' }), // this week
      makeApp({ id: 3, date_applied: '2024-03-17' }), // last week (Sun)
      makeApp({ id: 4, date_applied: '2023-01-01' }), // outside the window
    ]
    const series = activitySeries(apps, NOW, 12)
    expect(series).toHaveLength(12)
    expect(series[11]).toMatchObject({ weekStart: '2024-03-18', label: 'Mar 18', count: 2 })
    expect(series[10]).toMatchObject({ weekStart: '2024-03-11', count: 1 })
    expect(series.reduce((sum, b) => sum + b.count, 0)).toBe(3)
  })

  it('returns zero-filled buckets when there is no data and ignores bad dates', () => {
    const series = activitySeries([makeApp({ date_applied: 'not-a-date' })], NOW, 4)
    expect(series.map((b) => b.count)).toEqual([0, 0, 0, 0])
  })

  it('does not mutate its input', () => {
    const apps = [makeApp()]
    const copy = JSON.stringify(apps)
    activitySeries(apps, NOW)
    expect(JSON.stringify(apps)).toBe(copy)
  })
})

describe('relativeTime', () => {
  it.each([
    ['2024-03-20', 'today'],
    ['2024-03-19', 'yesterday'],
    ['2024-03-15', '5d ago'],
    ['2024-03-01', '2w ago'],
    ['2023-12-20', '3mo ago'],
    ['2021-03-20', '3y ago'],
    ['garbage', 'garbage'],
  ])('%s -> %s', (date, expected) => {
    expect(relativeTime(date, NOW)).toBe(expected)
  })
})

describe('parseLocalDate', () => {
  it('parses as a local calendar date', () => {
    const d = parseLocalDate('2024-03-05')
    expect([d?.getFullYear(), d?.getMonth(), d?.getDate()]).toEqual([2024, 2, 5])
    expect(parseLocalDate('nope')).toBeNull()
  })
})

describe('filterApplications', () => {
  const apps = [
    makeApp({ id: 1, company: 'Google', role: 'SWE', status: 'applied' }),
    makeApp({ id: 2, company: 'Meta', role: 'Designer', status: 'offer' }),
  ]
  it('matches company or role, case-insensitively', () => {
    expect(filterApplications(apps, 'goo', '').map((a) => a.id)).toEqual([1])
    expect(filterApplications(apps, 'DESIGN', '').map((a) => a.id)).toEqual([2])
  })
  it('combines the query with a status filter', () => {
    expect(filterApplications(apps, 'goo', 'offer')).toEqual([])
    expect(filterApplications(apps, '', 'offer').map((a) => a.id)).toEqual([2])
  })
  it('returns everything for a blank query', () => {
    expect(filterApplications(apps, '  ', '')).toHaveLength(2)
  })
})

describe('sortApplications', () => {
  it('sorts a copy in both directions', () => {
    const apps = [makeApp({ id: 1, company: 'B' }), makeApp({ id: 2, company: 'A' })]
    expect(sortApplications(apps, 'company', 'asc').map((a) => a.id)).toEqual([2, 1])
    expect(sortApplications(apps, 'company', 'desc').map((a) => a.id)).toEqual([1, 2])
    expect(apps.map((a) => a.id)).toEqual([1, 2])
  })
})

describe('applicationsToCsv', () => {
  it('quotes cells and escapes embedded quotes', () => {
    const csv = applicationsToCsv([makeApp({ company: 'Say "hi", Inc', notes: null })])
    const [header, row] = csv.split('\n')
    expect(header.startsWith('"Date","Company"')).toBe(true)
    expect(row).toContain('"Say ""hi"", Inc"')
  })
})
