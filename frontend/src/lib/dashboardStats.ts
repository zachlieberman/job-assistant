import type { Application } from '../api/client'
import { STATUSES, type Status } from './statusMeta'

const IN_PROGRESS: readonly Status[] = ['recruiter_screen', 'interview', 'final_interview']

export interface Kpis {
  total: number
  inProgress: number
  offers: number
  /** Share of applications that have moved past "applied"; null when there are none. */
  responseRate: number | null
}

export function computeKpis(applications: readonly Application[]): Kpis {
  const total = applications.length
  const count = (pred: (a: Application) => boolean) => applications.filter(pred).length
  const responded = count((a) => a.status !== 'applied')
  return {
    total,
    inProgress: count((a) => IN_PROGRESS.includes(a.status as Status)),
    offers: count((a) => a.status === 'offer'),
    responseRate: total === 0 ? null : Math.round((responded / total) * 100),
  }
}

export interface StatusSlice {
  status: Status
  count: number
  percent: number
}

/** One entry per pipeline status (zero counts included so the legend is stable). */
export function statusBreakdown(applications: readonly Application[]): StatusSlice[] {
  const total = applications.length
  return STATUSES.map((status) => {
    const count = applications.filter((a) => a.status === status).length
    return { status, count, percent: total === 0 ? 0 : Math.round((count / total) * 100) }
  })
}

export interface WeekBucket {
  /** ISO date (YYYY-MM-DD) of the Monday that starts the week. */
  weekStart: string
  label: string
  count: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Parse YYYY-MM-DD as a local calendar date (avoids UTC off-by-one shifts). */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7 // Monday = 0
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset)
}

function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Applications submitted per week over the `weeks` weeks ending with the current one. */
export function activitySeries(
  applications: readonly Application[],
  now: Date = new Date(),
  weeks = 12,
): WeekBucket[] {
  const thisWeek = startOfWeek(now)
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(thisWeek.getFullYear(), thisWeek.getMonth(), thisWeek.getDate() - 7 * (weeks - 1 - i))
    return { weekStart: isoDate(start), label: `${MONTHS[start.getMonth()]} ${start.getDate()}`, count: 0 }
  })
  const counts = new Map(buckets.map((b) => [b.weekStart, 0]))
  for (const app of applications) {
    const applied = parseLocalDate(app.date_applied)
    if (!applied) continue
    const key = isoDate(startOfWeek(applied))
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return buckets.map((b) => ({ ...b, count: counts.get(b.weekStart) ?? 0 }))
}

/** "today", "3d ago", "2w ago", "5mo ago" from a YYYY-MM-DD date. */
export function relativeTime(value: string, now: Date = new Date()): string {
  const date = parseLocalDate(value)
  if (!date) return value
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - date.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days}d ago`
  if (days < 60) return `${Math.floor(days / 7)}w ago`
  if (days < 730) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function filterApplications(
  applications: readonly Application[],
  query: string,
  status: string,
): Application[] {
  const q = query.trim().toLowerCase()
  return applications.filter((a) => {
    if (status && a.status !== status) return false
    return !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
  })
}
