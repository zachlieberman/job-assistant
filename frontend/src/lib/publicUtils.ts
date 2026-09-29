import { CSSProperties } from 'react'

/** Position in the hero load sequence; consumed by the `.rise` CSS class. */
export const stagger = (index: number): CSSProperties =>
  ({ '--i': index }) as CSSProperties

/** Only http(s) and mailto links are rendered as anchors (blocks javascript: URLs). */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

export const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
