import { track } from '@vercel/analytics'
import { RESUME_PATH } from '../content/resume'

export interface ClickClassification {
  name: 'Resume Click' | 'Contact Click'
  target: 'resume' | 'email' | 'linkedin' | 'github'
}

const SOCIAL_HOSTS: Record<string, ClickClassification['target']> = {
  'linkedin.com': 'linkedin',
  'github.com': 'github',
}

/** Maps a link href to the analytics event it should fire, or null if it is not tracked. */
export function classifyLink(href: string): ClickClassification | null {
  if (href === RESUME_PATH || /\.pdf$/i.test(href)) return { name: 'Resume Click', target: 'resume' }
  if (href.startsWith('mailto:')) return { name: 'Contact Click', target: 'email' }
  try {
    const host = new URL(href).hostname.replace(/^www\./, '')
    const target = SOCIAL_HOSTS[host]
    return target ? { name: 'Contact Click', target } : null
  } catch {
    return null
  }
}

/**
 * Sends one Vercel Analytics custom event per resume / email / LinkedIn / GitHub link click,
 * using a single delegated listener so every link on every page is covered.
 * Returns a function that removes the listener.
 */
export function installClickTracking(): () => void {
  const onClick = (event: MouseEvent) => {
    const anchor = (event.target as Element | null)?.closest?.('a[href]')
    if (!anchor) return
    const classification = classifyLink(anchor.getAttribute('href') ?? '')
    if (classification) {
      track(classification.name, { target: classification.target, page: window.location.pathname })
    }
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
