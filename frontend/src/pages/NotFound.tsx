import { useEffect } from 'react'
import PillLink from '../components/public/PillLink'

export const NOT_FOUND_TITLE = 'Page not found | Zachary Lieberman'

/** Catch-all page for unknown public URLs. Marked noindex while mounted. */
export default function NotFound() {
  useEffect(() => {
    document.title = NOT_FOUND_TITLE
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => {
      meta.remove()
    }
  }, [])

  return (
    <section>
      <h1 className="display display-lg">Page not found</h1>
      <p className="mt-4 max-w-prose">
        The page you're looking for doesn't exist or has moved.
      </p>
      <PillLink to="/" arrow className="mt-8">
        Back to home
      </PillLink>
    </section>
  )
}
