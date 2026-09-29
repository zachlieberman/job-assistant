import type { SankeyData } from '../api/client'
import { journeyLabel } from './ApplicationJourneySankey'

/** Text alternative to the Sankey: every flow as a row. */
export default function JourneyFlowTable({ data }: { data: SankeyData }) {
  if (!data.links.length) return null
  return (
    <details className="mt-4 text-sm">
      <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-brand-text hover:underline md:min-h-0">
        View as table
      </summary>
      <table className="mt-2 w-full max-w-md text-left">
        <caption className="sr-only">Applications moving between stages</caption>
        <thead>
          <tr className="border-b border-line text-muted">
            <th scope="col" className="py-1.5 pr-4 font-medium">From</th>
            <th scope="col" className="py-1.5 pr-4 font-medium">To</th>
            <th scope="col" className="py-1.5 text-right font-medium">Applications</th>
          </tr>
        </thead>
        <tbody>
          {data.links.map((l) => (
            <tr key={`${l.source}-${l.target}`} className="border-b border-line/60">
              <td className="py-1.5 pr-4 text-fg">{journeyLabel(data.nodes[l.source]?.name ?? '')}</td>
              <td className="py-1.5 pr-4 text-fg">{journeyLabel(data.nodes[l.target]?.name ?? '')}</td>
              <td className="num py-1.5 text-right text-fg">{l.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
