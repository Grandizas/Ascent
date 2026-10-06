import { describe, expect, it } from 'vitest'
import { isEmail, passwordScore } from './password'

describe('passwordScore', () => {
  it.each([
    ['', 0],
    ['abc', 0],
    ['abc1', 1],
    ['abcdefgh', 1],
    ['abcdefgh1', 2],
    ['Abcdefgh1', 3],
    ['Abcdefghijk1', 4],
    ['Abcdefghijk1!', 4],
  ])('%s → %i', (pw, score) => {
    expect(passwordScore(pw)).toBe(score)
  })
})

describe('isEmail', () => {
  it('matches the design rule', () => {
    expect(isEmail('you@example.com')).toBe(true)
    expect(isEmail(' you@example.com ')).toBe(true)
    expect(isEmail('you@example.c')).toBe(false)
    expect(isEmail('you example.com')).toBe(false)
  })
})
