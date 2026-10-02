import { RESUME_PATH } from '../content/resume'

export type ClickTarget = 'resume' | 'email' | 'linkedin' | 'github'

const SOCIAL_HOSTS: Record<string, ClickTarget> = {
  'linkedin.com': 'linkedin',
  'github.com': 'github',
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** Maps a link href to the click target it should be recorded as, or null if it is not tracked. */
export function classifyLink(href: string): ClickTarget | null {
  if (href === RESUME_PATH || /\.pdf$/i.test(href)) return 'resume'
  if (href.startsWith('mailto:')) return 'email'
  try {
    return SOCIAL_HOSTS[new URL(href).hostname.replace(/^www\./, '')] ?? null
  } catch {
    return null
  }
}

function sendClick(target: ClickTarget): void {
  // keepalive lets the request finish even when the click opens a new tab or leaves the page.
  // Tracking is best-effort: a failure must never affect the link itself.
  fetch(`${API_URL}/events/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, page: window.location.pathname }),
    keepalive: true,
  }).catch(() => undefined)
}

/**
 * Records one click per resume / email / LinkedIn / GitHub link, using a single delegated
 * listener so every link on every page is covered. Returns a function that removes it.
 */
export function installClickTracking(): () => void {
  const onClick = (event: MouseEvent) => {
    const anchor = (event.target as Element | null)?.closest?.('a[href]')
    if (!anchor) return
    const target = classifyLink(anchor.getAttribute('href') ?? '')
    if (target) sendClick(target)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
