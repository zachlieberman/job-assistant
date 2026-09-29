import { listPortfolioProjects } from '../api/client'
import AsyncView from '../components/public/AsyncView'
import JourneyDemoCard from '../components/public/JourneyDemoCard'
import { CardsSkeleton } from '../components/public/PageSkeletons'
import ProjectCard from '../components/public/ProjectCard'
import { useApiResource } from '../hooks/useApiResource'

export default function Projects() {
  const { state, retry } = useApiResource(listPortfolioProjects, 'projects')

  return (
    <div>
      <h1 className="display display-xl">Projects</h1>
      <p className="mt-6 max-w-prose">
        Things I've built. The first one runs live, right on this page.
      </p>
      <div className="mt-12">
        <JourneyDemoCard />
      </div>
      <div className="mt-4 sm:mt-6">
        <AsyncView resource={state} onRetry={retry} what="the projects" fallback={<CardsSkeleton count={4} />}>
          {(projects) => (
            <div className="md:columns-2 md:gap-x-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </AsyncView>
      </div>
    </div>
  )
}
