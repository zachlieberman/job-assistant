import type { PortfolioBio } from '../../api/client'
import { RESUME_PATH } from '../../content/resume'
import { safeHref } from '../../lib/publicUtils'
import PillLink from './PillLink'

/** Last block of the home page: a clear next step for a visitor who has read this far. */
export default function ClosingCta({ bio }: { bio: PortfolioBio | null }) {
  const email = bio?.email ? safeHref(`mailto:${bio.email}`) : null

  return (
    <section aria-labelledby="closing-title" className="mt-28 sm:mt-40">
      <h2 id="closing-title" className="display display-lg">
        Open to software engineering roles.
      </h2>
      <p className="mt-6 max-w-prose">
        If my work looks like a fit for your team, I'd like to hear about it. Email is the fastest way
        to reach me.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {email ? (
          <PillLink to={email} arrow>
            Email me
          </PillLink>
        ) : (
          <PillLink to="/contact" arrow>
            Get in touch
          </PillLink>
        )}
        <PillLink to={RESUME_PATH} variant="outline">
          Download resume
        </PillLink>
      </div>
    </section>
  )
}
