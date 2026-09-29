import { getPortfolioBio } from '../api/client'
import type { PortfolioBio } from '../api/client'
import Seo from '../components/Seo'
import { RESUME_PATH } from '../content/resume'
import { CONTACT_SEO } from '../content/seo'
import AsyncView from '../components/public/AsyncView'
import bernabeu from '../assets/contact-bernabeu.jpg'
import Photo from '../components/public/Photo'
import { ArrowUpRight } from '../components/public/icons'
import { ContactSkeleton } from '../components/public/PageSkeletons'
import { useApiResource } from '../hooks/useApiResource'
import { safeHref, stripProtocol } from '../lib/publicUtils'

interface ContactLink {
  label: string
  href: string
  value: string
}

function contactLinks(bio: PortfolioBio): ContactLink[] {
  const email = bio.email ? { label: 'Email', href: `mailto:${bio.email}`, value: bio.email } : null
  const social = (label: string, url: string | null) => {
    const href = safeHref(url)
    return href ? { label, href, value: stripProtocol(href) } : null
  }
  return [email, social('GitHub', bio.github_url), social('LinkedIn', bio.linkedin_url)].filter(
    (link): link is ContactLink => link !== null,
  )
}

const RESUME_LINK: ContactLink = { label: 'Resume', href: RESUME_PATH, value: 'Download PDF' }

function ContactList({ links }: { links: ContactLink[] }) {
  return (
    <>
      {!links.length && <p className="mb-4">No contact details are listed yet.</p>}
      <ul className="space-y-4">
        {[...links, RESUME_LINK].map((link) => {
          const external = link.href.startsWith('http') || link.href.endsWith('.pdf')
          return (
            <li key={link.label}>
              <a
                href={link.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group flex min-h-20 items-center justify-between gap-4 rounded-3xl bg-card px-6 py-4 text-ink transition-colors duration-200 hover:bg-ink hover:text-paper sm:px-8"
              >
                <span>
                  <span className="block text-base opacity-75">{link.label}</span>
                  <span className="block break-all text-xl font-bold sm:text-2xl">{link.value}</span>
                  {external && <span className="sr-only">(opens in a new tab)</span>}
                </span>
                <ArrowUpRight
                  width={28}
                  height={28}
                  className="shrink-0 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export default function Contact() {
  const { state, retry } = useApiResource(getPortfolioBio, 'bio')

  return (
    <div>
      <Seo {...CONTACT_SEO} />
      <h1 className="display display-xl">
        Let's talk <span className="text-mist">about what you're building.</span>
      </h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p className="max-w-prose">
            Happy to talk about opportunities, projects, or anything else. Email is the fastest way
            to reach me.
          </p>
          <div className="mt-10 max-w-2xl">
            <AsyncView resource={state} onRetry={retry} what="the contact details" fallback={<ContactSkeleton />}>
              {(bio) => <ContactList links={contactLinks(bio)} />}
            </AsyncView>
          </div>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <Photo
            src={bernabeu}
            alt="Zachary smiling in a blue polo, leaning on barriers in front of the pitch at the Santiago Bernabéu stadium"
            className="max-w-md lg:max-w-none"
          />
        </div>
      </div>
    </div>
  )
}
