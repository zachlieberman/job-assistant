import type { SankeyData } from '../api/client'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { STATUS_META, STATUSES, journeyLabel } from '../lib/statusMeta'
import ApplicationJourneySankey from './ApplicationJourneySankey'

/** Same blue ramp as the status badges; "active" (still in flight) is a neutral slate. */
const COLORS: Record<string, string> = {
  active: '#4A5163',
  ...Object.fromEntries(STATUSES.map((s) => [s, STATUS_META[s].mark])),
}
const LABELS: Record<string, string> = Object.fromEntries(
  ['active', ...STATUSES].map((name) => [name, journeyLabel(name)]),
)

interface Props {
  data: SankeyData
  height?: number
}

/** The shared Sankey, themed for the tracker: blue ramp, readable labels, real-pixel width. */
export default function TrackerJourneySankey({ data, height = 420 }: Props) {
  const { ref, width } = useContainerWidth<HTMLDivElement>(700)
  return (
    <div
      ref={ref}
      className="w-full"
      role="img"
      aria-label="Sankey diagram of how applications move between stages. The same data is listed in the table below."
    >
      <ApplicationJourneySankey
        data={data}
        width={width}
        height={height}
        colors={COLORS}
        labels={LABELS}
        labelColor="#E6E8EE"
        fontSize={13}
        linkOpacity={0.5}
        labelSpace={width < 520 ? 118 : 150}
      />
    </div>
  )
}
