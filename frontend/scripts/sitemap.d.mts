export function hashContent(...parts: string[]): string
export function parseSitemap(xml: string): Map<string, { hash: string; lastmod: string }>
export function buildSitemap(options: {
  pages: { loc: string; hash: string }[]
  previous: Map<string, { hash: string; lastmod: string }>
  today: string
}): string
