import type { PortfolioBio } from '../api/client'
import { SITE_NAME, SITE_URL } from '../content/seo'
import { safeHref } from './publicUtils'

/** schema.org Person for the home page. `sameAs` lists only valid http(s) profile URLs from the bio. */
export function personJsonLd(bio: PortfolioBio) {
  const sameAs = [bio.github_url, bio.linkedin_url]
    .map(safeHref)
    .filter((href): href is string => href !== null && href.startsWith('http'))
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: bio.name || SITE_NAME,
    jobTitle: bio.title,
    url: `${SITE_URL}/`,
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: `${SITE_URL}/`,
}

/** Serializes for an inline <script>; `<` is escaped so content cannot close the tag. */
export const jsonLdString = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c')
