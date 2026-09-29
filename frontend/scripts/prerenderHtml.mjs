// Pure HTML assembly for the prerender step (no I/O), so it can be unit tested.

const ROOT = '<div id="root"></div>'
// Fallback tags in apps/public/index.html that Helmet manages (see the comment there).
const FALLBACK_HEAD_TAG = /^[ \t]*<(?:meta|link)\b[^>]*\sdata-rh="true"[^>]*>[ \t]*\r?\n/gm
const TITLE_TAG = /<title>[^<]*<\/title>[ \t]*\r?\n?/

/** Preload link for the page's above-the-fold image (`fetchpriority="high"`), or ''. */
export function eagerImagePreload(appHtml) {
  const img = appHtml.match(/<img\b[^>]*\sfetchpriority="high"[^>]*>/)?.[0]
  const src = img?.match(/\ssrc="([^"]+)"/)?.[1]
  // Data URIs are already in the document; only real URLs benefit from a preload.
  return src && !src.startsWith('data:')
    ? `<link rel="preload" as="image" href="${src}" fetchpriority="high">`
    : ''
}

/**
 * Turns the client build's index.html into one prerendered page: app markup in
 * #root, per-route Helmet tags in <head>, and the embedded data for hydration.
 */
export function assemblePage({ template, html, head, dataJson, dataId }) {
  if (!template.includes(ROOT)) {
    throw new Error(`Template has no ${ROOT} to fill; did the app's index.html change?`)
  }
  const preload = eagerImagePreload(html)
  return template
    .replace(FALLBACK_HEAD_TAG, '')
    .replace(TITLE_TAG, '')
    .replace('</head>', () => `${head}${preload}</head>`)
    .replace(
      ROOT,
      () => `<div id="root">${html}</div><script id="${dataId}" type="application/json">${dataJson}</script>`,
    )
}
