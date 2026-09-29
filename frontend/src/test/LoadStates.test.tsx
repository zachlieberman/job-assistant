import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AsyncView from '../components/public/AsyncView'
import ErrorState from '../components/public/ErrorState'
import { CardsSkeleton, ContactSkeleton, HeroSkeleton, TimelineSkeleton } from '../components/public/PageSkeletons'
import { Skeleton } from '../components/public/Skeleton'

describe('skeletons', () => {
  it.each([
    ['hero', <HeroSkeleton key="h" />, 'Loading introduction'],
    ['cards', <CardsSkeleton key="c" />, 'Loading projects'],
    ['timeline', <TimelineSkeleton key="t" />, 'Loading experience'],
    ['contact', <ContactSkeleton key="k" />, 'Loading contact details'],
  ])('%s announces loading once and hides its blocks', (_name, node, label) => {
    const { container } = render(node)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    container.querySelectorAll('.skeleton').forEach((el) => {
      expect(el).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('renders a featured lead block taller than the rest', () => {
    const { container } = render(<CardsSkeleton featured count={2} />)
    expect(container.querySelector('.md\\:col-span-2')).not.toBeNull()
  })

  it('accepts extra classes', () => {
    const { container } = render(<Skeleton className="h-4" />)
    expect(container.firstChild).toHaveClass('skeleton', 'h-4')
  })
})

describe('ErrorState', () => {
  it('names what failed and calls onRetry from the Retry button', async () => {
    const onRetry = vi.fn()
    render(<ErrorState what="the projects" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the projects.")
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('AsyncView', () => {
  const props = { onRetry: vi.fn(), what: 'things', fallback: <p>skeleton</p> }

  it('shows the fallback while loading', () => {
    render(<AsyncView {...props} resource={{ status: 'loading' }}>{() => <p>done</p>}</AsyncView>)
    expect(screen.getByText('skeleton')).toBeInTheDocument()
  })

  it('shows the error state on failure', () => {
    render(<AsyncView {...props} resource={{ status: 'error', error: new Error('x') }}>{() => <p>done</p>}</AsyncView>)
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders children with the data on success', () => {
    render(<AsyncView {...props} resource={{ status: 'success', data: 7 }}>{(n) => <p>value {n}</p>}</AsyncView>)
    expect(screen.getByText('value 7')).toBeInTheDocument()
  })
})
