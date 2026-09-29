import { useCallback, useEffect, useState } from 'react'
import { getApplicationJourney, SankeyData } from '../api/client'
import ApplicationJourneySankey from '../components/ApplicationJourneySankey'
import JourneyFlowTable from '../components/JourneyFlowTable'
import ErrorPanel from '../components/ui/ErrorPanel'
import PageHeader from '../components/ui/PageHeader'
import { LoadingRegion, Skeleton } from '../components/ui/Skeleton'

export default function Journey() {
  const [journeyData, setJourneyData] = useState<SankeyData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getApplicationJourney()
      .then((res) => setJourneyData(res.data))
      .catch(() => setError('Failed to load your journey.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader description="See how your applications flow through each stage." />
      {error ? (
        <ErrorPanel title={error} detail="The API didn't respond. Check that the backend is running, then try again." onRetry={load} />
      ) : (
        <div className="rounded-panel border border-line bg-surface p-4 md:p-5">
          {loading ? (
            <LoadingRegion label="Loading your journey…">
              <Skeleton className="h-[420px] rounded-control" />
            </LoadingRegion>
          ) : (
            <>
              <ApplicationJourneySankey data={journeyData} height={420} />
              <JourneyFlowTable data={journeyData} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
