import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useInView } from '../hooks/useInView'

function Probe({ once = false }: { once?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>('0px', once)
  return <div ref={ref}>{inView ? 'visible' : 'hidden'}</div>
}

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void

function mockObserver() {
  const instances: { cb: Callback; disconnect: ReturnType<typeof vi.fn> }[] = []
  class FakeObserver {
    disconnect = vi.fn()
    observe = vi.fn()
    constructor(cb: Callback) {
      instances.push({ cb, disconnect: this.disconnect })
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  return instances
}

describe('useInView', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports visible when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Probe />)
    expect(screen.getByText('visible')).toBeInTheDocument()
  })

  it('follows intersection changes', () => {
    const observers = mockObserver()
    render(<Probe />)
    expect(screen.getByText('hidden')).toBeInTheDocument()
    act(() => observers[0].cb([{ isIntersecting: true }]))
    expect(screen.getByText('visible')).toBeInTheDocument()
    act(() => observers[0].cb([{ isIntersecting: false }]))
    expect(screen.getByText('hidden')).toBeInTheDocument()
  })

  it('latches after the first sighting when `once` is set', () => {
    const observers = mockObserver()
    render(<Probe once />)
    act(() => observers[0].cb([{ isIntersecting: true }]))
    expect(observers[0].disconnect).toHaveBeenCalled()
    act(() => observers[0].cb([{ isIntersecting: false }]))
    expect(screen.getByText('visible')).toBeInTheDocument()
  })
})
