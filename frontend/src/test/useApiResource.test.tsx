import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useApiResource } from '../hooks/useApiResource'

describe('useApiResource', () => {
  it('moves from loading to success', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: 'hello' })
    const { result } = renderHook(() => useApiResource(fetcher))
    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'hello' }))
  })

  it('reports the error and recovers on retry', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('cold'))
      .mockResolvedValueOnce({ data: 'ok' })
    const { result } = renderHook(() => useApiResource(fetcher))
    await waitFor(() => expect(result.current.state.status).toBe('error'))

    act(() => result.current.retry())
    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'ok' }))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('renders cached data immediately on a later visit, then refreshes', async () => {
    const first = vi.fn().mockResolvedValue({ data: 'old' })
    const a = renderHook(() => useApiResource(first, 'k'))
    await waitFor(() => expect(a.result.current.state.status).toBe('success'))
    a.unmount()

    const second = vi.fn().mockResolvedValue({ data: 'new' })
    const b = renderHook(() => useApiResource(second, 'k'))
    expect(b.result.current.state).toEqual({ status: 'success', data: 'old' })
    await waitFor(() => expect(b.result.current.state).toEqual({ status: 'success', data: 'new' }))
  })

  it('keeps cached data when a background refresh fails', async () => {
    await act(async () => {
      renderHook(() => useApiResource(vi.fn().mockResolvedValue({ data: 'kept' }), 'k2'))
    })
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failing = vi.fn().mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useApiResource(failing, 'k2'))
    await waitFor(() => expect(logged).toHaveBeenCalled()) // the catch branch has run
    expect(result.current.state).toEqual({ status: 'success', data: 'kept' })
    logged.mockRestore()
  })

  it('does not cache a response that arrives after unmount', async () => {
    let resolve!: (v: { data: string }) => void
    const late = vi.fn(() => new Promise<{ data: string }>((r) => (resolve = r)))
    renderHook(() => useApiResource(late, 'late')).unmount()
    await act(async () => resolve({ data: 'late' }))

    const next = renderHook(() => useApiResource(() => new Promise<{ data: string }>(() => {}), 'late'))
    expect(next.result.current.state.status).toBe('loading')
  })

  it('ignores a response for the previous key after the key changes', async () => {
    const resolvers: Record<string, (v: { data: string }) => void> = {}
    const fetcher = vi.fn(() => new Promise<{ data: string }>((r) => (resolvers[fetcher.mock.calls.length] = r)))
    const { result, rerender } = renderHook(({ k }) => useApiResource(fetcher, k), {
      initialProps: { k: 'one' },
    })
    rerender({ k: 'two' })
    await act(async () => resolvers[1]({ data: 'from-one' }))
    expect(result.current.state.status).toBe('loading')
    await act(async () => resolvers[2]({ data: 'from-two' }))
    expect(result.current.state).toEqual({ status: 'success', data: 'from-two' })
  })

  it('turns a hung request into an error after the timeout', async () => {
    vi.useFakeTimers()
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useApiResource(() => new Promise<{ data: string }>(() => {})))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(result.current.state.status).toBe('error')
    logged.mockRestore()
    vi.useRealTimers()
  })

  it('does not show a previous key\'s data after the key changes', async () => {
    const fetcher = vi.fn((): Promise<{ data: string }> => Promise.resolve({ data: 'a' }))
    const { result, rerender } = renderHook(({ k }) => useApiResource(fetcher, k), {
      initialProps: { k: 'one' },
    })
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    fetcher.mockReturnValue(new Promise(() => {}))
    rerender({ k: 'two' })
    await waitFor(() => expect(result.current.state.status).toBe('loading'))
  })
})
