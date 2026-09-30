import type { ComponentType } from 'react'
import { ChatIcon, CodeIcon, UsersIcon, type IconProps } from './icons'

interface TypeMeta {
  Icon: ComponentType<IconProps>
  className: string
}

/** Each question type gets its own icon and label as well as a blue tint. */
const TYPE_META: Record<string, TypeMeta> = {
  behavioral: { Icon: ChatIcon, className: 'bg-stage-recruiter_screen-bg text-stage-recruiter_screen-fg' },
  technical: { Icon: CodeIcon, className: 'bg-stage-interview-bg text-stage-interview-fg' },
  culture: { Icon: UsersIcon, className: 'bg-stage-applied-bg text-stage-applied-fg' },
}

const FALLBACK: TypeMeta = { Icon: ChatIcon, className: 'bg-raised text-muted' }

interface Props {
  question: string
  type: string
  tip: string
}

export default function QuestionCard({ question, type, tip }: Props) {
  const { Icon, className } = TYPE_META[type] ?? FALLBACK
  return (
    <article className="flex flex-col gap-2.5 rounded-panel border border-line bg-surface p-4 md:p-5">
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-row px-2 py-0.5 text-xs font-medium ${className}`}>
        <Icon size={13} />
        {type}
      </span>
      <p className="font-medium text-fg">{question}</p>
      <p className="border-l-2 border-brand-text pl-3 text-sm text-muted">{tip}</p>
    </article>
  )
}
