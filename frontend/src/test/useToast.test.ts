import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '../hooks/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with toast hidden', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toast.visible).toBe(false)
  })

  it('shows toast with message on show()', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.show('Hello!')
    })
    expect(result.current.toast.visible).toBe(true)
    expect(result.current.toast.message).toBe('Hello!')
  })

  it('defaults to success type', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.show('Done')
    })
    expect(result.current.toast.type).toBe('success')
  })

  it('uses provided error type', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.show('Oops', 'error')
    })
    expect(result.current.toast.type).toBe('error')
  })

  it('hides toast after 3 seconds', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.show('Temp')
    })
    expect(result.current.toast.visible).toBe(true)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.toast.visible).toBe(false)
  })

  it('preserves message after hiding', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.show('Keep me')
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.toast.message).toBe('Keep me')
  })
})
