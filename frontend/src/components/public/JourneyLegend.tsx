import { JOURNEY_COLORS } from '../../content/sampleJourney'

const ITEMS = [
  { color: JOURNEY_COLORS.applied, label: 'Stage still in progress' },
  { color: JOURNEY_COLORS.rejected, label: 'Ended without an offer' },
]

export default function JourneyLegend() {
  return (
    <ul aria-label="Legend" className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-base">
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-md"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
      <li>Band width shows how many applications took that path.</li>
    </ul>
  )
}
