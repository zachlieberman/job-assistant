// @vitest-environment node
// Node, not jsdom: react-helmet-async only collects server-side head state without a DOM,
// which is the environment scripts/prerender.mjs runs in.
import { describe, expect, it, beforeEach } from 'vitest'
import { render, seedPrerenderData } from '../entry-server'
import { data } from './prerenderFixture'
import { assemblePage, eagerImagePreload } from '../../scripts/prerenderHtml.mjs'
import { PRERENDER_DATA_ID } from '../lib/prerenderData'
import { CONTACT_SEO, EXPERIENCE_SEO, HOME_SEO, PROJECTS_SEO } from '../content/seo'


const TEMPLATE = `<!doctype html><html><head>
    <meta data-rh="true" name="description" content="fallback" />
    <meta name="theme-color" content="#FAFAF8" />
    <title>Fallback</title>
    <script type="module" src="/assets/index.js"></script>
  </head><body><div id="root"></div></body></html>`

describe('server render', () => {
  beforeEach(() => seedPrerenderData(data))

  it.each([
    ['/', HOME_SEO, 'Alpha Project'],
    ['/projects', PROJECTS_SEO, 'Alpha Project'],
    ['/experience', EXPERIENCE_SEO, 'Acme Corp'],
    ['/contact', CONTACT_SEO, 'zach@example.com'],
  ])('renders %s with its content and head tags', (route, seo, content) => {
    const { html, head } = render(route)
    expect(html).toContain(content)
    expect(html).toContain('<h1')
    expect(head).toContain(`<title data-rh="true">${seo.title}</title>`)
    expect(head).toContain(`rel="canonical" href="https://www.zachlieberman.dev${seo.path}"`)
  })

  it('renders the home hero, not a skeleton', () => {
    const { html } = render('/')
    expect(html).toContain('Available for work')
    expect(html).toContain('Software Engineer, based in Los Angeles, CA.')
    expect(html).toContain('fetchpriority="high"')
  })

  it('renders the not-found page with noindex for unknown URLs', () => {
    const { html, head } = render('/404')
    expect(html).toContain('Page not found')
    expect(head).toContain('name="robots" content="noindex"')
    expect(head).not.toContain('rel="canonical"')
  })
})

describe('assemblePage', () => {
  const page = () =>
    assemblePage({
      template: TEMPLATE,
      html: '<h1>Hi</h1>',
      head: '<title data-rh="true">Route</title>',
      dataJson: '{}',
      dataId: PRERENDER_DATA_ID,
    })

  it('fills #root, swaps the fallback head tags and embeds the data', () => {
    const out = page()
    expect(out).toContain('<div id="root"><h1>Hi</h1></div>')
    expect(out).toContain('<title data-rh="true">Route</title>')
    expect(out).not.toContain('Fallback')
    expect(out).not.toContain('content="fallback"')
    expect(out).toContain('name="theme-color"')
    expect(out).toContain(`<script id="${PRERENDER_DATA_ID}" type="application/json">{}</script>`)
  })

  it('throws when the template has no empty #root', () => {
    expect(() =>
      assemblePage({ template: '<html></html>', html: '', head: '', dataJson: '{}', dataId: 'x' }),
    ).toThrow(/root/)
  })

  it('preloads the eager image and ignores lazy and inlined ones', () => {
    const eager = '<img src="/assets/hero-abc.jpg" alt="" fetchpriority="high" loading="eager">'
    expect(eagerImagePreload(eager)).toBe(
      '<link rel="preload" as="image" href="/assets/hero-abc.jpg" fetchpriority="high">',
    )
    expect(eagerImagePreload('<img src="/a.jpg" loading="lazy">')).toBe('')
    expect(eagerImagePreload('<img src="data:image/png;base64,AAA" fetchpriority="high">')).toBe('')
    expect(eagerImagePreload('<p>no image</p>')).toBe('')
  })
})
