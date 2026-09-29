import { listPortfolioExperience } from '../api/client'
import Seo from '../components/Seo'
import { EXPERIENCE_SEO } from '../content/seo'
import AsyncView from '../components/public/AsyncView'
import { TimelineSkeleton } from '../components/public/PageSkeletons'
import Timeline from '../components/public/Timeline'
import { useApiResource } from '../hooks/useApiResource'

export default function Experience() {
  const { state, retry } = useApiResource(listPortfolioExperience, 'experience')

  return (
    <div>
      <Seo {...EXPERIENCE_SEO} />
      <h1 className="display display-xl">Experience</h1>
      <p className="mt-6 max-w-prose">Where I've worked.</p>
      <div className="mt-16 max-w-3xl">
        <AsyncView
          resource={state}
          onRetry={retry}
          what="the experience"
          fallback={<TimelineSkeleton />}
        >
          {(jobs) => <Timeline jobs={jobs} />}
        </AsyncView>
      </div>
    </div>
  )
}
