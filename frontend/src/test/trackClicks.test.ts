// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { classifyLink, installClickTracking } from '../lib/trackClicks'

describe('classifyLink', () => {
  it.each([
    ['/Zachary-Lieberman-Resume.pdf', 'resume'],
    ['mailto:zach@example.com', 'email'],
    ['https://www.linkedin.com/in/zach', 'linkedin'],
    ['https://github.com/zach', 'github'],
  ])('%s -> %s', (href, target) => {
    expect(classifyLink(href)).toBe(target)
  })

  it('ignores other links', () => {
    expect(classifyLink('/projects')).toBeNull()
    expect(classifyLink('https://example.com')).toBeNull()
    expect(classifyLink('https://notgithub.com/x')).toBeNull()
  })
})

describe('installClickTracking', () => {
  const fetchMock = vi.fn()
  let uninstall: () => void

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    document.body.innerHTML =
      '<a id="r" href="/Zachary-Lieberman-Resume.pdf"><span id="in">Resume</span></a><a id="p" href="/projects">P</a>'
    uninstall = installClickTracking()
  })
  afterEach(() => {
    uninstall()
    vi.unstubAllGlobals()
  })

  it('posts a resume click, including clicks on nested elements', () => {
    document.getElementById('in')!.click()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/events\/click$/)
    expect(init.method).toBe('POST')
    expect(init.keepalive).toBe(true)
    expect(JSON.parse(init.body)).toEqual({ target: 'resume', page: '/' })
  })

  it('does not record unrelated links', () => {
    document.getElementById('p')!.click()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('swallows network failures', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    document.getElementById('r')!.click()
    await Promise.resolve()
    expect(fetchMock).toHaveBeenCalled()
  })

  it('stops recording after uninstall', () => {
    uninstall()
    document.getElementById('r')!.click()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
