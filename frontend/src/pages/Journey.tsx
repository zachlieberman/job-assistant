import { useState, useEffect } from 'react'
import { getApplicationJourney, SankeyData } from '../api/client'
import ApplicationJourneySankey from '../components/ApplicationJourneySankey'

export default function Journey() {
  const [journeyData, setJourneyData] = useState<SankeyData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApplicationJourney()
      .then((res) => setJourneyData(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Application Journey</h1>
        <p className="text-gray-500 text-sm mt-1">Visualize how your applications flow through each stage.</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <ApplicationJourneySankey data={journeyData} height={420} />
        )}
      </div>
    </div>
  )
}
