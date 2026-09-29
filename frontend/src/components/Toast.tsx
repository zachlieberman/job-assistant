import { ToastType } from '../hooks/useToast'
import { AlertIcon, CheckIcon } from './icons'

interface Props {
  message: string
  type: ToastType
  visible: boolean
}

/** Icon plus text carries the meaning; both variants share the blue palette. */
export default function Toast({ message, type, visible }: Props) {
  const Icon = type === 'error' ? AlertIcon : CheckIcon
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`fixed inset-x-4 bottom-24 z-50 flex items-center gap-2.5 rounded-control border border-field bg-raised px-4 py-3 text-sm font-medium text-fg shadow-lg transition-[opacity,transform] duration-200 md:inset-x-auto md:bottom-6 md:right-6 md:max-w-sm ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <Icon size={18} className="shrink-0 text-brand-text" />
      <span>{visible ? message : ''}</span>
    </div>
  )
}
