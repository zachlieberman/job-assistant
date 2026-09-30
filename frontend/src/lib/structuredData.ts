import type { PortfolioBio } from '../api/client'
import { ALUMNI_OF, KNOWS_ABOUT } from '../content/profile'
import { SITE_NAME, SITE_URL } from '../content/seo'
import { safeHref } from './publicUtils'

const HOME_URL = `${SITE_URL}/`
const WEBSITE_ID = `${SITE_URL}/#website`
const PERSON_ID = `${SITE_URL}/#person`
/** Stable copy of the hero portrait (the hero import is content-hashed, so its URL changes). */
const PERSON_IMAGE = `${SITE_URL}/zachary-lieberman.jpg`

/** LinkedIn's canonical host includes www; the bio may store the bare domain. */
const canonicalProfile = (href: string) => href.replace('://linkedin.com/', '://www.linkedin.com/')

/** "Los Angeles, California" -> a PostalAddress; null when there is no location to describe. */
function address(location: string) {
  const [locality, region] = location.split(',').map((part) => part.trim())
  if (!locality) return null
  return {
    '@type': 'PostalAddress',
    addressLocality: locality,
    ...(region ? { addressRegion: region } : {}),
  }
}

function person(bio: PortfolioBio) {
  const sameAs = [bio.github_url, bio.linkedin_url]
    .map(safeHref)
    .filter((href): href is string => href !== null && href.startsWith('http'))
    .map(canonicalProfile)
  const postal = address(bio.location ?? '')
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: bio.name || SITE_NAME,
    jobTitle: bio.title,
    url: HOME_URL,
    image: PERSON_IMAGE,
    alumniOf: { '@type': 'CollegeOrUniversity', name: ALUMNI_OF },
    knowsAbout: KNOWS_ABOUT,
    ...(postal ? { address: postal } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

/**
 * Home page structured data: WebSite and Person in one graph, linked by @id.
 * Without a bio (still loading) only the WebSite is described.
 */
export function homeJsonLd(bio: PortfolioBio | null) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: SITE_NAME,
        url: HOME_URL,
        inLanguage: 'en-US',
        ...(bio ? { publisher: { '@id': PERSON_ID } } : {}),
      },
      ...(bio ? [person(bio)] : []),
    ],
  }
}

/** Serializes for an inline <script>; `<` is escaped so content cannot close the tag. */
export const jsonLdString = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c')
