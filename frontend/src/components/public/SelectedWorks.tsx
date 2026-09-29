import { listPortfolioProjects } from '../../api/client'
import { useApiResource } from '../../hooks/useApiResource'
import AsyncView from './AsyncView'
import { CardsSkeleton } from './PageSkeletons'
import PillLink from './PillLink'
import ProjectCard from './ProjectCard'

const HOME_LIMIT = 3

export default function SelectedWorks() {
  const { state, retry } = useApiResource(listPortfolioProjects, 'projects')

  return (
    <section aria-labelledby="works-title" className="mt-28 sm:mt-40">
      <h2 id="works-title" className="display display-lg">
        Selected works
      </h2>
      <div className="mt-10 sm:mt-14">
        <AsyncView
          resource={state}
          onRetry={retry}
          what="the projects"
          fallback={<CardsSkeleton featured />}
        >
          {(projects) =>
            projects.length ? (
              <>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {projects.slice(0, HOME_LIMIT).map((project, i) => (
                    <ProjectCard key={project.id} project={project} featured={i === 0} />
                  ))}
                </div>
                <PillLink to="/projects" variant="outline" arrow className="mt-10">
                  All projects
                </PillLink>
              </>
            ) : (
              <p>Projects are on the way.</p>
            )
          }
        </AsyncView>
      </div>
    </section>
  )
}
