import { useCallback, useEffect, useRef, useState } from 'react'

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T }

// Revisited pages render instantly from here while a fresh copy loads, so a
// cold backend is only felt on the first visit.
const cache = new Map<string, unknown>()

export const clearApiCache = () => cache.clear()

function initialState<T>(cacheKey?: string): Resource<T> {
  return cacheKey && cache.has(cacheKey)
    ? { status: 'success', data: cache.get(cacheKey) as T }
    : { status: 'loading' }
}

/** Loads a resource, exposing loading/error/success and a retry trigger. */
export function useApiResource<T>(fetcher: () => Promise<{ data: T }>, cacheKey?: string) {
  // The fetcher is read through a ref on purpose: callers pass a fresh closure
  // every render, and only `attempt` or `cacheKey` should trigger a load.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Resource<T>>(() => initialState<T>(cacheKey))

  useEffect(() => {
    let cancelled = false
    // Show this key's cached data (if any) while a fresh copy loads.
    setState(initialState<T>(cacheKey))
    fetcherRef
      .current()
      .then((res) => {
        if (cancelled) return
        if (cacheKey) cache.set(cacheKey, res.data)
        setState({ status: 'success', data: res.data })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('Failed to load resource', cacheKey ?? '', error)
        // A failed background refresh keeps the cached copy on screen.
        setState((prev) => (prev.status === 'success' ? prev : { status: 'error', error }))
      })
    return () => {
      cancelled = true
    }
  }, [attempt, cacheKey])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
