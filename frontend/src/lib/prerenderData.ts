import type { PortfolioBio, PortfolioExperience, PortfolioProject } from '../api/client'
import { seedApiCache } from '../hooks/useApiResource'

/** Portfolio content fetched at build time and embedded in each prerendered page. */
export interface PrerenderData {
  bio: PortfolioBio
  projects: PortfolioProject[]
  experience: PortfolioExperience[]
}

/** Id of the JSON <script> that carries PrerenderData to the browser. */
export const PRERENDER_DATA_ID = '__PRERENDER_DATA__'

/**
 * Seeds the useApiResource cache. The keys must match the ones the public pages
 * pass to useApiResource, so their first render equals the prerendered markup.
 */
export function seedPrerenderData(data: PrerenderData) {
  seedApiCache('bio', data.bio)
  seedApiCache('projects', data.projects)
  seedApiCache('experience', data.experience)
}

/** Reads the embedded data, or null when the page was not prerendered (dev server). */
export function readPrerenderData(doc: Document = document): PrerenderData | null {
  const raw = doc.getElementById(PRERENDER_DATA_ID)?.textContent
  if (!raw) return null
  try {
    return JSON.parse(raw) as PrerenderData
  } catch (error) {
    console.error('Ignoring unreadable prerender data', error)
    return null
  }
}

/** Serializes for a <script type="application/json"> tag; `<` is escaped so content cannot close the tag. */
export function serializePrerenderData(data: PrerenderData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
