import { useEffect, useRef, useState } from 'react'

/** Tracks an element's width so SVG charts can lay out in real pixels (readable text on phones). */
export function useContainerWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width) || fallback))
    observer.observe(el)
    return () => observer.disconnect()
  }, [fallback])
  return { ref, width }
}
