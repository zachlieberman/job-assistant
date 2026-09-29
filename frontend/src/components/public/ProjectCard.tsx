import { useId, useState } from 'react'
import type { PortfolioProject } from '../../api/client'
import { safeHref } from '../../lib/publicUtils'
import { Plus } from './icons'
import PillLink from './PillLink'

interface Props {
  project: PortfolioProject
  /** Larger treatment for the lead card. */
  featured?: boolean
}

/** Rounded card that expands on click or Enter/Space to show the details. */
export default function ProjectCard({ project, featured = false }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const href = safeHref(project.link)

  return (
    <article
      className={`mb-4 sm:mb-6 flex break-inside-avoid flex-col justify-between gap-8 rounded-[2rem] bg-card p-6 sm:p-8 ${
        featured ? 'min-h-72 md:min-h-96 md:p-12 md:[column-span:all]' : 'min-h-64'
      }`}
    >
      <div>
        <h3>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="group flex w-full items-start justify-between gap-6 rounded-2xl text-left"
          >
            <span className={`display ${featured ? 'display-lg' : 'display-md'}`}>{project.name}</span>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-300 group-hover:scale-105">
              <Plus className={`transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
              <span className="sr-only">{open ? 'Hide details' : 'Show details'}</span>
            </span>
          </button>
        </h3>
        <div id={panelId} className="expand" data-open={open}>
          <div>
            <p className="max-w-prose pt-6">{project.description}</p>
            {href && (
              <PillLink to={href} arrow className="mt-6">
                Visit project
              </PillLink>
            )}
          </div>
        </div>
      </div>
      <ul aria-label="Technologies" className="flex flex-wrap gap-2 text-base">
        {(project.tags ?? []).map((tag) => (
          <li key={tag} className="rounded-full bg-paper px-4 py-1.5">
            {tag}
          </li>
        ))}
      </ul>
    </article>
  )
}
