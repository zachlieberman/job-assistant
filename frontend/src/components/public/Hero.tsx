import type { PortfolioBio } from '../../api/client'
import { HEADLINE_LEAD, HEADLINE_TAIL } from '../../content/hero'
import { RESUME_PATH } from '../../content/resume'
import { stagger } from '../../lib/publicUtils'
import sunset from '../../assets/home-sunset.jpg'
import Photo from './Photo'
import PillLink from './PillLink'

/** Home hero. The children animate in as one staggered sequence (`.rise`). */
export default function Hero({ bio }: { bio: PortfolioBio }) {
  const role = `${bio.title}${bio.location ? `, based in ${bio.location}` : ''}.`

  return (
    <section aria-labelledby="hero-title">
      <p className="rise flex items-center gap-3 text-base" style={stagger(0)}>
        <span aria-hidden="true" className="h-3 w-3 rounded-full bg-pine" />
        Available for work
      </p>
      <p className="rise mt-8 text-2xl font-bold text-ink" style={stagger(1)}>
        Hello! I'm {bio.name}.
      </p>
      <h1 id="hero-title" className="display display-xl rise mt-4" style={stagger(2)}>
        {HEADLINE_LEAD} <span className="text-mist">{HEADLINE_TAIL}</span>
      </h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
        <div className="rise lg:col-span-6 lg:col-start-6 lg:row-start-1" style={stagger(3)}>
          <p className="font-bold text-ink">{role}</p>
          <p className="mt-3 max-w-prose whitespace-pre-line">{bio.bio}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink to="/projects" arrow>
              See my work
            </PillLink>
            <PillLink to="/experience" variant="outline">
              My experience
            </PillLink>
          </div>
          <p className="mt-5">
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-ink underline underline-offset-4 hover:text-body"
            >
              Download resume (PDF)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
        <div className="rise lg:col-span-4 lg:col-start-1 lg:row-start-1" style={stagger(4)}>
          <Photo
            src={sunset}
            alt="Zachary smiling and holding his small brown dog outdoors at a bright orange sunset by the ocean"
            eager
            className="max-w-md lg:max-w-none"
          />
        </div>
      </div>
    </section>
  )
}
