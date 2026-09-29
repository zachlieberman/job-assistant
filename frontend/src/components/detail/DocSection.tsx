import { useState, type ReactNode } from 'react'
import { CheckIcon, ChevronIcon, CopyIcon } from '../icons'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className="inline-flex h-11 items-center gap-1.5 rounded-control border border-field px-3 text-xs font-medium text-fg transition-colors duration-150 hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40 md:h-8"
    >
      {copied ? <CheckIcon size={14} className="text-brand-text" /> : <CopyIcon size={14} />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  defaultRows?: number
  actions?: ReactNode
  mono?: boolean
}

/** Collapsible read/edit block for long text (job description, resume, cover letter, notes). */
export default function DocSection({ label, value, onChange, defaultRows = 6, actions, mono = false }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState(false)
  const bodyClass = `p-4 text-sm leading-relaxed ${mono ? 'font-mono' : ''}`

  return (
    <section className="overflow-hidden rounded-panel border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-1.5">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-h-[44px] items-center gap-2 text-left text-sm font-semibold text-fg md:min-h-[36px]"
        >
          <ChevronIcon size={16} className={`text-muted transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`} />
          {label}
        </button>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="inline-flex h-11 items-center rounded-control border border-field px-3 text-xs font-medium text-brand-text transition-colors duration-150 hover:bg-raised md:h-8"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>
      {!collapsed &&
        (editing ? (
          <textarea
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={defaultRows}
            className={`${bodyClass} w-full resize-y bg-ink text-fg`}
          />
        ) : (
          <div className={`${bodyClass} resize-y overflow-y-auto whitespace-pre-wrap text-fg/80`} style={{ minHeight: `${defaultRows * 1.5}rem` }}>
            {value || <span className="text-muted">Nothing here yet. Choose Edit to add some.</span>}
          </div>
        ))}
    </section>
  )
}
