import { useEffect, useRef, useState } from 'react'

/**
 * Reports whether an element is inside the viewport (IntersectionObserver).
 * With `once`, it latches true after the first sighting. Without observer
 * support (old browsers, jsdom) it reports true so content is never hidden.
 * It starts false everywhere, so prerendered markup and the first client
 * render agree, then settles in an effect.
 */
export function useInView<T extends Element>(rootMargin = '0px', once = false) {
  const ref = useRef<T>(null)
  const supported = typeof IntersectionObserver !== 'undefined'
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!supported) {
      setInView(true)
      return
    }
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, once, supported])

  return { ref, inView }
}
