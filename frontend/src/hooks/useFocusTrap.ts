import { RefObject, useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab inside `containerRef` while active and closes on Escape. */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  active: boolean,
  onEscape: () => void,
) {
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeRef.current()
        return
      }
      if (event.key !== 'Tab' || !containerRef.current) return
      const items = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      // Focus outside the dialog (e.g. after clicking its background): pull it back in.
      if (!containerRef.current.contains(document.activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [containerRef, active])
}
