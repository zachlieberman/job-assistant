import { Helmet } from 'react-helmet-async'
import PillLink from '../components/public/PillLink'

export const NOT_FOUND_TITLE = 'Page not found | Zachary Lieberman'

/** Catch-all page for unknown public URLs. Marked noindex; also prerendered as 404.html. */
export default function NotFound() {
  return (
    <section>
      <Helmet>
        <title>{NOT_FOUND_TITLE}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
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
