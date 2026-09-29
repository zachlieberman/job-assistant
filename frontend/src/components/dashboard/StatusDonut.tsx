import { useId, useState } from 'react'
import { arc, pie } from 'd3-shape'
import { STATUS_META } from '../../lib/statusMeta'
import type { StatusSlice } from '../../lib/dashboardStats'

const SIZE = 164
const OUTER = 78
const INNER = 52

interface Props {
  slices: StatusSlice[]
}

function summarize(slices: StatusSlice[], total: number): string {
  if (total === 0) return 'No applications yet.'
  const parts = slices.filter((s) => s.count > 0).map((s) => `${STATUS_META[s.status].label} ${s.count} (${s.percent}%)`)
  return `${total} applications by status: ${parts.join(', ')}.`
}

/** Status split as a donut on the blue ramp; the legend carries icons, counts, and percentages. */
export default function StatusDonut({ slices }: Props) {
  const [active, setActive] = useState<StatusSlice['status'] | null>(null)
  const titleId = useId()
  const total = slices.reduce((sum, s) => sum + s.count, 0)
  const arcs = pie<StatusSlice>().value((s) => s.count).sort(null).padAngle(0.03)(slices)
  const path = arc<(typeof arcs)[number]>().innerRadius(INNER).outerRadius(OUTER).cornerRadius(2)
  const focused = slices.find((s) => s.status === active)

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 md:p-5">
      <div>
        <h2 id={titleId} className="text-base font-semibold text-fg">
          Pipeline
        </h2>
        <p className="text-sm text-muted">Where your applications stand</p>
      </div>
      <div className="flex flex-col items-center gap-4 xs:flex-row xs:items-center lg:flex-col lg:items-center xl:flex-row">
        <div className="relative shrink-0" role="img" aria-label={summarize(slices, total)}>
          <svg width={SIZE} height={SIZE} viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}>
            {total === 0 ? (
              <circle r={(OUTER + INNER) / 2} fill="none" stroke="#22252E" strokeWidth={OUTER - INNER} />
            ) : (
              arcs.map((a) =>
                a.data.count > 0 ? (
                  <path
                    key={a.data.status}
                    d={path(a) ?? ''}
                    fill={STATUS_META[a.data.status].mark}
                    opacity={active && active !== a.data.status ? 0.35 : 1}
                    className="transition-opacity duration-150"
                    onMouseEnter={() => setActive(a.data.status)}
                    onMouseLeave={() => setActive(null)}
                  />
                ) : null,
              )
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-2xl font-semibold leading-none text-fg">{focused ? focused.count : total}</span>
            <span className="mt-1 text-xs text-muted">{focused ? STATUS_META[focused.status].label : 'Total'}</span>
          </div>
        </div>
        <ul className="w-full min-w-0 flex-1 text-sm">
          {slices.map((s) => {
            const { Icon, label, mark } = STATUS_META[s.status]
            return (
              <li
                key={s.status}
                tabIndex={0}
                onMouseEnter={() => setActive(s.status)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(s.status)}
                onBlur={() => setActive(null)}
                className="flex min-h-[44px] items-center gap-2 rounded-row px-2 transition-colors duration-150 hover:bg-raised md:min-h-[32px]"
              >
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: mark }} />
                <Icon size={14} className="shrink-0 text-muted" />
                <span className="flex-1 truncate text-fg">{label}</span>
                <span className="num font-medium text-fg">{s.count}</span>
                <span className="num w-10 text-right text-muted">{s.percent}%</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
