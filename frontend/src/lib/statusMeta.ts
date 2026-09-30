import type { ComponentType } from 'react'
import {
  AwardIcon,
  BriefcaseIcon,
  PhoneIcon,
  SendIcon,
  UsersIcon,
  XCircleIcon,
  type IconProps,
} from '../components/icons'

export const STATUSES = ['applied', 'recruiter_screen', 'interview', 'final_interview', 'offer', 'rejected'] as const
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
  recruiter_screen: {
    label: 'Recruiter screen',
    Icon: PhoneIcon,
    badge: 'bg-stage-recruiter_screen-bg text-stage-recruiter_screen-fg border-stage-recruiter_screen-edge',
    mark: '#5A83E6',
  },
  interview: {
    label: 'Interview',
    Icon: UsersIcon,
    badge: 'bg-stage-interview-bg text-stage-interview-fg border-stage-interview-edge',
    mark: '#4F7DFF',
  },
  final_interview: {
    label: 'Final interview',
    Icon: BriefcaseIcon,
    badge: 'bg-stage-final_interview-bg text-stage-final_interview-fg border-stage-final_interview-edge',
    mark: '#3F73FF',
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

/** Label for a Sankey node: pipeline statuses plus the in-flight "active" bucket. */
export function journeyLabel(name: string): string {
  return name === 'active' ? 'Active' : statusLabel(name)
}
