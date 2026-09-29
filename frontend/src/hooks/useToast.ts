import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

const VISIBLE_MS = 3000

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ message, type, visible: true })
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), VISIBLE_MS)
  }, [])

  return { toast, show }
}
