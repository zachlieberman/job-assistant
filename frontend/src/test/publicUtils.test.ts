import { describe, it, expect } from 'vitest'
import { safeHref, stagger, stripProtocol } from '../lib/publicUtils'

describe('publicUtils', () => {
  it('accepts http, https and mailto links', () => {
    expect(safeHref('https://example.com/a')).toBe('https://example.com/a')
    expect(safeHref('mailto:a@b.co')).toBe('mailto:a@b.co')
  })

  it('rejects script, data and malformed URLs and empty values', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,hi')).toBeNull()
    expect(safeHref('not a url')).toBeNull()
    expect(safeHref(null)).toBeNull()
    expect(safeHref('')).toBeNull()
  })

  it('strips protocol and trailing slash for display', () => {
    expect(stripProtocol('https://github.com/zach/')).toBe('github.com/zach')
  })

  it('exposes the stagger index as a CSS variable', () => {
    expect(stagger(3)).toEqual({ '--i': 3 })
  })
})
