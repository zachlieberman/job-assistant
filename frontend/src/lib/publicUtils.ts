import { CSSProperties } from 'react'

/** Position in the hero load sequence; consumed by the `.rise` CSS class. */
export const stagger = (index: number): CSSProperties =>
  ({ '--i': index }) as CSSProperties

/** Only http(s) and mailto links are rendered as anchors (blocks javascript: URLs). */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return parsed.href
    console.warn('Dropping URL with unsupported protocol', url)
    return null
  } catch {
    console.warn('Dropping invalid URL', url)
    return null
  }
}

export const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
