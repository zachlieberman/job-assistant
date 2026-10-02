// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const track = vi.fn()
vi.mock('@vercel/analytics', () => ({ track: (...args: unknown[]) => track(...args) }))

import { classifyLink, installClickTracking } from '../lib/trackClicks'

describe('classifyLink', () => {
  it.each([
    ['/Zachary-Lieberman-Resume.pdf', 'Resume Click', 'resume'],
    ['mailto:zach@example.com', 'Contact Click', 'email'],
    ['https://www.linkedin.com/in/zach', 'Contact Click', 'linkedin'],
    ['https://github.com/zach', 'Contact Click', 'github'],
  ])('%s -> %s (%s)', (href, name, target) => {
    expect(classifyLink(href)).toEqual({ name, target })
  })

  it('ignores other links', () => {
    expect(classifyLink('/projects')).toBeNull()
    expect(classifyLink('https://example.com')).toBeNull()
    expect(classifyLink('https://notgithub.com/x')).toBeNull()
  })
})

describe('installClickTracking', () => {
  let uninstall: () => void
  beforeEach(() => {
    track.mockClear()
    document.body.innerHTML =
      '<a id="r" href="/Zachary-Lieberman-Resume.pdf"><span id="in">Resume</span></a><a id="p" href="/projects">P</a>'
    uninstall = installClickTracking()
  })
  afterEach(() => uninstall())

  it('tracks a resume click, including clicks on nested elements', () => {
    document.getElementById('in')!.click()
    expect(track).toHaveBeenCalledWith('Resume Click', { target: 'resume', page: '/' })
  })

  it('does not track unrelated links', () => {
    document.getElementById('p')!.click()
    expect(track).not.toHaveBeenCalled()
  })

  it('stops tracking after uninstall', () => {
    uninstall()
    document.getElementById('r')!.click()
    expect(track).not.toHaveBeenCalled()
  })
})
