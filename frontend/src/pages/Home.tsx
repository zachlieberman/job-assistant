import { getPortfolioBio } from '../api/client'
import Seo from '../components/Seo'
import { HOME_SEO } from '../content/seo'
import AsyncView from '../components/public/AsyncView'
import Hero from '../components/public/Hero'
import { HeroSkeleton } from '../components/public/PageSkeletons'
import SelectedWorks from '../components/public/SelectedWorks'
import { useApiResource } from '../hooks/useApiResource'

export default function Home() {
  const { state, retry } = useApiResource(getPortfolioBio, 'bio')

  return (
    <>
      <Seo {...HOME_SEO} />
      <AsyncView
        resource={state}
        onRetry={retry}
        what="the introduction"
        fallback={<HeroSkeleton />}
        errorClassName="min-h-[28rem]"
      >
        {(bio) => <Hero bio={bio} />}
      </AsyncView>
      <SelectedWorks />
    </>
  )
}
