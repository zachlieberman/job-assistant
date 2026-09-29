import type { ComponentType } from 'react'
import { AwardIcon, CodeIcon, PhoneIcon, SendIcon, XCircleIcon, type IconProps } from '../components/icons'

export const STATUSES = ['applied', 'phone_screen', 'technical', 'offer', 'rejected'] as const
export type Status = (typeof STATUSES)[number]

interface StatusMeta {
  label: string
  Icon: ComponentType<IconProps>
  /** Tailwind classes for the badge: saturation rises as the pipeline advances. */
  badge: string
  /** Hex used for chart marks (donut, sankey); all sit at >=3:1 on the surface. */
  mark: string
}

export const STATUS_META: Record<Status, StatusMeta> = {
  applied: {
    label: 'Applied',
    Icon: SendIcon,
    badge: 'bg-stage-applied-bg text-stage-applied-fg border-stage-applied-edge',
    mark: '#6B7FA8',
  },
  phone_screen: {
    label: 'Phone screen',
    Icon: PhoneIcon,
    badge: 'bg-stage-phone_screen-bg text-stage-phone_screen-fg border-stage-phone_screen-edge',
    mark: '#5A83E6',
  },
  technical: {
    label: 'Technical',
    Icon: CodeIcon,
    badge: 'bg-stage-technical-bg text-stage-technical-fg border-stage-technical-edge',
    mark: '#4F7DFF',
  },
  offer: {
    label: 'Offer',
    Icon: AwardIcon,
    badge: 'bg-stage-offer-bg text-stage-offer-fg border-stage-offer-edge',
    mark: '#2F6BFF',
  },
  rejected: {
    label: 'Rejected',
    Icon: XCircleIcon,
    badge: 'bg-stage-rejected-bg text-stage-rejected-fg border-stage-rejected-edge',
    mark: '#6E7688',
  },
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value)
}

export function statusLabel(value: string): string {
  return isStatus(value) ? STATUS_META[value].label : value
}
