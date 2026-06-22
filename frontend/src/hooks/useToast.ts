import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false })

  const show = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
  }, [])

  return { toast, show }
}
