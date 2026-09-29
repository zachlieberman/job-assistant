import { render, screen } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import Photo from '../components/public/Photo'

describe('Photo', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lazy-loads by default', () => {
    render(<Photo src="/a.jpg" alt="Portrait" />)
    const img = screen.getByAltText('Portrait')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).not.toHaveAttribute('fetchpriority')
  })

  it('loads eagerly with high fetch priority when eager', () => {
    render(<Photo src="/a.jpg" alt="Portrait" eager />)
    const img = screen.getByAltText('Portrait')
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('keeps intrinsic size and aspect ratio in both modes', () => {
    for (const eager of [false, true]) {
      const { unmount } = render(<Photo src="/a.jpg" alt="Portrait" eager={eager} />)
      const img = screen.getByAltText('Portrait')
      expect(img).toHaveAttribute('width', '768')
      expect(img).toHaveAttribute('height', '1024')
      expect(img.className).toContain('aspect-[4/5]')
      unmount()
    }
  })

  it('does not trigger React unknown-prop warnings', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Photo src="/a.jpg" alt="Portrait" eager />)
    expect(error).not.toHaveBeenCalled()
  })
})
