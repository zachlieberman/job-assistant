import { describe, expect, it } from 'vitest'
import { buildSitemap, hashContent, parseSitemap } from '../../scripts/sitemap.mjs'

const A = 'https://www.zachlieberman.dev/'
const B = 'https://www.zachlieberman.dev/projects'

describe('sitemap lastmod', () => {
  it('stamps today when there is no previous sitemap', () => {
    const xml = buildSitemap({
      pages: [{ loc: A, hash: hashContent('a') }],
      previous: new Map(),
      today: '2026-10-01',
    })
    expect(xml).toContain(`<loc>${A}</loc><lastmod>2026-10-01</lastmod>`)
  })

  it('keeps the old date for unchanged pages and moves it for changed ones', () => {
    const first = buildSitemap({
      pages: [
        { loc: A, hash: hashContent('a') },
        { loc: B, hash: hashContent('b') },
      ],
      previous: new Map(),
      today: '2026-10-01',
    })
    const second = buildSitemap({
      pages: [
        { loc: A, hash: hashContent('a') },
        { loc: B, hash: hashContent('b changed') },
      ],
      previous: parseSitemap(first),
      today: '2026-10-09',
    })
    const dates = parseSitemap(second)
    expect(dates.get(A)?.lastmod).toBe('2026-10-01')
    expect(dates.get(B)?.lastmod).toBe('2026-10-09')
  })

  it('ignores a previous sitemap it did not generate', () => {
    const legacy = '<urlset><url><loc>' + A + '</loc></url></urlset>'
    expect(parseSitemap(legacy).size).toBe(0)
  })

  it('hashes deterministically', () => {
    expect(hashContent('x', 'y')).toBe(hashContent('x', 'y'))
    expect(hashContent('x', 'y')).not.toBe(hashContent('x', 'z'))
  })
})
