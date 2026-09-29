// Per-route search and social metadata for the public portfolio. Copy is drawn
// from the portfolio's own bio, project and experience content.
export const SITE_URL = 'https://www.zachlieberman.dev'
export const SITE_NAME = 'Zachary Lieberman'
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`
export const OG_IMAGE_ALT =
  'Zachary Lieberman, Software Engineer in Los Angeles: I build careful software for real problems.'

export interface PageSeo {
  /** Also the document.title that App.public announces on navigation. */
  title: string
  description: string
  path: string
}

export const HOME_SEO: PageSeo = {
  title: `${SITE_NAME}, Software Engineer in Los Angeles`,
  description:
    'Zachary Lieberman is a software engineer in Los Angeles, CA. He builds backend services, data layers, APIs and product features in Python, Go and TypeScript.',
  path: '/',
}

export const PROJECTS_SEO: PageSeo = {
  title: `Projects | ${SITE_NAME}`,
  description:
    'Projects by Zachary Lieberman: an AI job application assistant, a serverless Go API on AWS, an S3 command line tool, a Slack bot and workflow automation on AWS.',
  path: '/projects',
}

export const EXPERIENCE_SEO: PageSeo = {
  title: `Experience | ${SITE_NAME}`,
  description:
    'Work history of Zachary Lieberman, a software engineer at Capital One who built policy platform tooling and data layers, then GraphQL analytics dashboards.',
  path: '/experience',
}

export const CONTACT_SEO: PageSeo = {
  title: `Contact | ${SITE_NAME}`,
  description:
    'Contact Zachary Lieberman, a software engineer in Los Angeles, CA. Email is the fastest way to reach him about jobs, projects or what you are building.',
  path: '/contact',
}
