import { describe, expect, it } from 'vitest'
import { addTag, MAX_TAGS, normalizeTag, removeTag, sameTags } from './tags'

describe('normalizeTag', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeTag('  Late   night\tcall ')).toBe('Late night call')
  })
})

describe('addTag', () => {
  const list = ['Work', 'Gym']

  it('appends a normalised tag', () => {
    expect(addTag(list, ' Reading ')).toEqual({ tags: ['Work', 'Gym', 'Reading'], error: null })
  })

  it('rejects empty, too long and duplicate tags (case-insensitively)', () => {
    expect(addTag(list, '   ').error).toBe('Type a tag first.')
    expect(addTag(list, 'x'.repeat(33)).error).toBe('Keep tags to 32 characters.')
    expect(addTag(list, 'gym')).toEqual({ tags: list, error: '“Gym” is already in your list.' })
  })

  it('stops at the limit', () => {
    const full = Array.from({ length: MAX_TAGS }, (_, i) => `Tag ${i}`)
    expect(addTag(full, 'One more').error).toBe('You can keep up to 40 tags.')
  })
})

describe('removeTag / sameTags', () => {
  it('removes by value', () => {
    expect(removeTag(['A', 'B', 'C'], 'B')).toEqual(['A', 'C'])
  })

  it('compares order too', () => {
    expect(sameTags(['A', 'B'], ['A', 'B'])).toBe(true)
    expect(sameTags(['A', 'B'], ['B', 'A'])).toBe(false)
    expect(sameTags(['A'], ['A', 'B'])).toBe(false)
  })
})
