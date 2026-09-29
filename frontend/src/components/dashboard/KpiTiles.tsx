import type { ComponentType } from 'react'
import { ActivityIcon, AwardIcon, BriefcaseIcon, ReplyIcon, type IconProps } from '../icons'
import type { Kpis } from '../../lib/dashboardStats'

interface Tile {
  label: string
  value: string
  note: string
  Icon: ComponentType<IconProps>
}

function buildTiles(kpis: Kpis): Tile[] {
  return [
    { label: 'Total applied', value: String(kpis.total), note: 'All time', Icon: BriefcaseIcon },
    { label: 'In progress', value: String(kpis.inProgress), note: 'Phone screen or technical', Icon: ActivityIcon },
    { label: 'Offers', value: String(kpis.offers), note: 'Received so far', Icon: AwardIcon },
    {
      label: 'Response rate',
      value: kpis.responseRate === null ? '—' : `${kpis.responseRate}%`,
      note: 'Moved past applied',
      Icon: ReplyIcon,
    },
  ]
}

/** Four key figures in one joined strip; each has an icon chip. */
export default function KpiTiles({ kpis }: { kpis: Kpis }) {
  return (
    <section
      aria-label="Key figures"
      className="grid grid-cols-2 overflow-hidden rounded-strip border border-line bg-surface lg:grid-cols-4"
    >
      {buildTiles(kpis).map(({ label, value, note, Icon }, i) => (
        <div
          key={label}
          className={`flex items-center gap-3 p-4 md:p-5 ${i % 2 === 1 ? 'border-l border-line' : ''} ${
            i > 1 ? 'border-t border-line lg:border-t-0' : ''
          } ${i > 0 ? 'lg:border-l lg:border-line' : ''}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand/15 text-brand-text">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm leading-tight text-muted">{label}</p>
            <p className="num text-2xl font-semibold leading-tight tracking-tight text-fg">{value}</p>
            <p className="hidden truncate text-xs text-muted xs:block">{note}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
