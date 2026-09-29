import { JOURNEY_LABELS, SAMPLE_JOURNEY, journeyRows } from '../../content/sampleJourney'

const ROWS = journeyRows(SAMPLE_JOURNEY, JOURNEY_LABELS)

/** Plain-text equivalent of the chart, so nothing depends on color or sight. */
export default function JourneyTable() {
  return (
    <details className="mt-6 rounded-2xl">
      <summary className="inline-flex min-h-12 cursor-pointer items-center font-bold text-ink">
        View as a table
      </summary>
      <table className="mt-4 w-full max-w-xl text-left text-base">
        <caption className="sr-only">Sample application journey: applications moving between stages</caption>
        <thead>
          <tr className="text-ink">
            <th scope="col" className="py-2 pr-4 font-bold">From</th>
            <th scope="col" className="py-2 pr-4 font-bold">To</th>
            <th scope="col" className="py-2 text-right font-bold">Applications</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={`${row.from}-${row.to}`} className="border-t-2 border-paper">
              <td className="py-2 pr-4">{row.from}</td>
              <td className="py-2 pr-4">{row.to}</td>
              <td className="py-2 text-right">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
