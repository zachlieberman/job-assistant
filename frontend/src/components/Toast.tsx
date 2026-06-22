import { ToastType } from '../hooks/useToast'

interface Props {
  message: string
  type: ToastType
  visible: boolean
}

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  error: 'bg-red-500/15 border-red-500/30 text-red-300',
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
}

export default function Toast({ message, type, visible }: Props) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg backdrop-blur transition-all duration-300 ${
        styles[type]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
    >
      <span className="text-base leading-none">{icons[type]}</span>
      {message}
    </div>
  )
}
