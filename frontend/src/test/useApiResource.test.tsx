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
    const failing = vi.fn().mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useApiResource(failing, 'k2'))
    await waitFor(() => expect(failing).toHaveBeenCalled())
    expect(result.current.state).toEqual({ status: 'success', data: 'kept' })
  })

  it('ignores a response that arrives after unmount', async () => {
    let resolve!: (v: { data: string }) => void
    const fetcher = vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    const { result, unmount } = renderHook(() => useApiResource<string>(fetcher))
    unmount()
    resolve({ data: 'late' })
    expect(result.current.state.status).toBe('loading')
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
