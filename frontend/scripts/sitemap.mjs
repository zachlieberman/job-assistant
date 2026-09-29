// Sitemap generation with honest <lastmod> values (no I/O, so it can be unit tested).
//
// A page's lastmod only moves when its rendered content changes. Each URL block
// carries a content hash in a comment; the next build reads the previous sitemap,
// keeps the old date when the hash is unchanged, and stamps today's date when it is not.

import { createHash } from 'node:crypto'

export const hashContent = (...parts) =>
  createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 16)

/** Reads `{ hash, lastmod }` per URL from a sitemap this module generated. Unknown formats yield an empty map. */
export function parseSitemap(xml) {
  const previous = new Map()
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]
    const lastmod = block.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)?.[1]
    const hash = block.match(/<!-- hash:([a-f0-9]+) -->/)?.[1]
    if (loc && lastmod && hash) previous.set(loc, { hash, lastmod })
  }
  return previous
}

/** pages: [{ loc, hash }]; previous: Map from parseSitemap; today: YYYY-MM-DD. */
export function buildSitemap({ pages, previous, today }) {
  const urls = pages.map(({ loc, hash }) => {
    const before = previous.get(loc)
    const lastmod = before && before.hash === hash ? before.lastmod : today
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><!-- hash:${hash} --></url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}
