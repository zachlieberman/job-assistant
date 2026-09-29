import { useId, useState, type KeyboardEvent } from 'react'
import { area, curveMonotoneX, line } from 'd3-shape'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import type { WeekBucket } from '../../lib/dashboardStats'

const FALLBACK_W = 640
const H = 220
const M = { top: 16, right: 14, bottom: 28, left: 30 }

interface Props {
  series: WeekBucket[]
}

function niceMax(max: number): number {
  return Math.max(4, Math.ceil(max / 4) * 4)
}

function summarize(series: WeekBucket[]): string {
  const total = series.reduce((sum, b) => sum + b.count, 0)
  const peak = series.reduce((best, b) => (b.count > best.count ? b : best), series[0])
  if (total === 0) return `No applications in the last ${series.length} weeks.`
  return `${total} applications over the last ${series.length} weeks. Busiest week started ${peak.label} with ${peak.count}.`
}

/** Applications per week as an area chart with tooltip, legend, and a data-table alternative. */
export default function ActivityChart({ series }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const tableId = useId()
  const { ref: plotRef, width: W } = useContainerWidth<HTMLDivElement>(FALLBACK_W)
  const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(W / 64))))
  const max = niceMax(Math.max(0, ...series.map((b) => b.count)))
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom
  const x = (i: number) => M.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW)
  const y = (v: number) => M.top + innerH - (v / max) * innerH

  const areaPath = area<WeekBucket>()
    .x((_, i) => x(i))
    .y0(y(0))
    .y1((b) => y(b.count))
    .curve(curveMonotoneX)(series)
  const linePath = line<WeekBucket>()
    .x((_, i) => x(i))
    .y((b) => y(b.count))
    .curve(curveMonotoneX)(series)

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') setActive((i) => Math.min(series.length - 1, (i ?? -1) + 1))
    else if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? series.length) - 1))
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  const activeBucket = active === null ? null : series[active]
  const ticks = [0, max / 2, max]

  return (
    <section aria-labelledby={`${tableId}-title`} className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id={`${tableId}-title`} className="text-base font-semibold text-fg">
            Activity
          </h2>
          <p className="text-sm text-muted">Applications per week, last {series.length} weeks</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-muted">
          <svg width="22" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="22" y2="5" stroke="#5B8DFF" strokeWidth="2" />
            <circle cx="11" cy="5" r="3" fill="#12141A" stroke="#5B8DFF" strokeWidth="2" />
          </svg>
          Applications submitted
        </span>
      </div>

      <div
        tabIndex={0}
        role="group"
        aria-label={`${summarize(series)} Use the left and right arrow keys to read each week.`}
        onKeyDown={handleKey}
        onBlur={() => setActive(null)}
        onMouseLeave={() => setActive(null)}
        className="relative rounded-control"
      >
        <div ref={plotRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
          <defs>
            <linearGradient id={`${tableId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2F6BFF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2F6BFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="#22252E" strokeWidth="1" />
              <text x={M.left - 8} y={y(t)} dy="0.35em" textAnchor="end" fontSize="12" fill="#7B8190" className="num">
                {t}
              </text>
            </g>
          ))}
          <g className="draw-in">
            <path d={areaPath ?? ''} fill={`url(#${tableId}-fill)`} />
            <path d={linePath ?? ''} fill="none" stroke="#5B8DFF" strokeWidth="2" strokeLinejoin="round" />
            {series.map((b, i) => (
              <circle
                key={b.weekStart}
                cx={x(i)}
                cy={y(b.count)}
                r={active === i ? 5 : 3}
                fill="#12141A"
                stroke="#5B8DFF"
                strokeWidth="2"
              />
            ))}
          </g>
          {series.map((b, i) =>
            (series.length - 1 - i) % labelEvery === 0 ? (
              <text key={b.weekStart} x={x(i)} y={H - 8} textAnchor={i === series.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'} fontSize="12" fill="#7B8190">
                {b.label}
              </text>
            ) : null,
          )}
          {series.map((b, i) => (
            <rect
              key={`hit-${b.weekStart}`}
              x={x(i) - innerW / series.length / 2}
              y={M.top}
              width={innerW / series.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
            />
          ))}
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={M.top} y2={y(0)} stroke="#5B8DFF" strokeWidth="1" strokeDasharray="3 3" />
          )}
        </svg>
        </div>
        {activeBucket && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-row border border-line bg-raised px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `${Math.min(88, Math.max(12, (x(active) / W) * 100))}%` }}
          >
            <p className="text-muted">Week of {activeBucket.label}</p>
            <p className="num font-semibold text-fg">
              {activeBucket.count} {activeBucket.count === 1 ? 'application' : 'applications'}
            </p>
          </div>
        )}
      </div>

      <details className="text-sm">
        <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-brand-text hover:underline md:min-h-0">
          View as table
        </summary>
        <table className="mt-2 w-full max-w-sm text-left">
          <caption className="sr-only">Applications submitted per week</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-1.5 pr-4 font-medium">Week of</th>
              <th scope="col" className="py-1.5 text-right font-medium">Applications</th>
            </tr>
          </thead>
          <tbody>
            {series.map((b) => (
              <tr key={b.weekStart} className="border-b border-line/60">
                <td className="py-1.5 pr-4 text-fg">{b.label}</td>
                <td className="num py-1.5 text-right text-fg">{b.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}
