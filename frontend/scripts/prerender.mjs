// Prerenders the public portfolio's routes into static HTML after `vite build`
// and `vite build --ssr`. Portfolio content comes from the live API at build
// time; the build fails loudly if it is unavailable rather than shipping empty pages.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'
import { assemblePage } from './prerenderHtml.mjs'
import { buildSitemap, hashContent, parseSitemap } from './sitemap.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js')

// route -> output file. "/404" hits the catch-all route; hosts serve 404.html with a 404 status.
// Pages with `indexed: false` are left out of the sitemap.
const PAGES = [
  { route: '/', file: 'index.html', indexed: true },
  { route: '/projects', file: 'projects/index.html', indexed: true },
  { route: '/experience', file: 'experience/index.html', indexed: true },
  { route: '/contact', file: 'contact/index.html', indexed: true },
  { route: '/404', file: '404.html', indexed: false },
]

const ATTEMPTS = 3
const TIMEOUT_MS = 30_000 // covers a cold-starting backend

const fail = (message) => {
  console.error(`\nprerender failed: ${message}\n`)
  process.exit(1)
}

async function fetchJson(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`
  let lastError
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
      console.warn(`  ${url}: attempt ${attempt}/${ATTEMPTS} failed (${error.message})`)
      if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
    }
  }
  throw new Error(`could not fetch ${url}: ${lastError.message}`)
}

function validate({ bio, projects, experience }) {
  if (!bio || typeof bio.name !== 'string' || typeof bio.title !== 'string') {
    throw new Error('The bio must be an object with a name and title.')
  }
  if (!Array.isArray(projects) || !Array.isArray(experience)) {
    throw new Error('Projects and experience must be arrays.')
  }
  return { bio, projects, experience }
}

async function loadPortfolioData() {
  const env = { ...loadEnv('public', root, 'VITE_'), ...process.env }

  // CI builds from a checked-in fixture so they do not depend on a live backend.
  if (env.PRERENDER_DATA_FILE) {
    const file = path.resolve(root, env.PRERENDER_DATA_FILE)
    console.log(`Reading portfolio content from ${file}`)
    return validate(JSON.parse(await fs.readFile(file, 'utf8')))
  }

  const baseUrl = env.VITE_API_URL?.replace(/\/+$/, '')
  if (!baseUrl) {
    throw new Error('VITE_API_URL is not set. Point it at the backend the site content is read from.')
  }
  console.log(`Fetching portfolio content from ${baseUrl}`)
  const [bio, projects, experience] = await Promise.all([
    fetchJson(baseUrl, '/portfolio/bio'),
    fetchJson(baseUrl, '/portfolio/projects'),
    fetchJson(baseUrl, '/portfolio/experience'),
  ])
  return validate({ bio, projects, experience })
}

/** The live sitemap, so unchanged pages keep their lastmod. Any failure just means "no history". */
async function previousSitemap(siteUrl) {
  try {
    const response = await fetch(`${siteUrl}/sitemap.xml`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return parseSitemap(await response.text())
  } catch (error) {
    console.warn(`  No previous sitemap (${error.message}); lastmod dates start from today`)
    return new Map()
  }
}

async function main() {
  const [template, server, data] = await Promise.all([
    fs.readFile(path.join(distDir, 'index.html'), 'utf8').catch(() => {
      throw new Error('dist/index.html is missing. Run `vite build --mode public` first.')
    }),
    import(pathToFileURL(ssrEntry).href).catch((error) => {
      throw new Error(`Could not load ${ssrEntry} (${error.message}). Run the SSR build first.`)
    }),
    loadPortfolioData(),
  ])

  server.seedPrerenderData(data)
  const dataJson = server.serializePrerenderData(data)

  const sitemapPages = []
  for (const { route, file, indexed } of PAGES) {
    const { html, head } = server.render(route)
    if (!html.includes('<h1')) throw new Error(`${route} rendered without a heading; refusing to write it.`)
    const page = assemblePage({ template, html, head, dataJson, dataId: '__PRERENDER_DATA__' })
    const target = path.join(distDir, file)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, page)
    if (indexed) {
      const path = route === '/' ? '/' : route
      sitemapPages.push({ loc: `${server.SITE_URL}${path}`, hash: hashContent(html, head) })
    }
    console.log(`  ${route.padEnd(12)} -> dist/${file}`)
  }

  const sitemap = buildSitemap({
    pages: sitemapPages,
    previous: await previousSitemap(server.SITE_URL),
    today: new Date().toISOString().slice(0, 10),
  })
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap)
  console.log('  sitemap.xml written')
}

main().catch((error) => fail(error.message))
