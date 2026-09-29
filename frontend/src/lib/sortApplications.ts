import type { Application } from '../api/client'
import type { SortKey } from '../components/ApplicationTable'

export type SortDir = 'asc' | 'desc'

/** Returns a sorted copy; the input array is never mutated. */
export function sortApplications(
  applications: readonly Application[],
  key: SortKey,
  dir: SortDir,
): Application[] {
  return [...applications].sort((a, b) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === 'asc' ? cmp : -cmp
  })
}
