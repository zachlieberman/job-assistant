import { useEffect, useRef, useState } from 'react'
import ApplicationJourneySankey, { SankeyHover } from '../ApplicationJourneySankey'
import { JOURNEY_COLORS, JOURNEY_LABELS, SAMPLE_JOURNEY } from '../../content/sampleJourney'

export const CHART_HEIGHT = 360
const DEFAULT_WIDTH = 700
const MIN_WIDTH = 300

/** Sankey sized to its container, with a tooltip for pointer and keyboard focus. */
export default function JourneyChart() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [hover, setHover] = useState<SankeyHover | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(MIN_WIDTH, Math.round(entry.contentRect.width / 8) * 8)),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // A redraw replaces the SVG nodes without firing blur/leave; drop the tooltip.
  useEffect(() => setHover(null), [width])

  const showTooltip = (next: SankeyHover | null) => {
    const box = wrapRef.current?.getBoundingClientRect()
    if (!next || !box) return setHover(null)
    setHover({
      text: next.text,
      x: Math.min(Math.max(next.x - box.left, 60), box.width - 60),
      y: next.y - box.top,
    })
  }

  return (
    <div ref={wrapRef} className="relative">
      <ApplicationJourneySankey
        data={SAMPLE_JOURNEY}
        width={width}
        height={CHART_HEIGHT}
        colors={JOURNEY_COLORS}
        labelColor="#0A0C10"
        labels={JOURNEY_LABELS}
        fontSize={width < 480 ? 14 : 16}
        linkOpacity={0.2}
        labelSpace={width < 480 ? 128 : 150}
        onHover={showTooltip}
      />
      {hover && (
        <div
          role="tooltip"
          style={{ left: hover.x, top: hover.y }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-full bg-ink px-4 py-2 text-base text-paper"
        >
          {hover.text}
        </div>
      )}
    </div>
  )
}
