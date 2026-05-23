import { describe, it, expect } from 'vitest'
import { seededShuffle, getDailySeed } from '@/lib/random/seeded-shuffle'

describe('seededShuffle', () => {
  it('returns a new array of the same length', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = seededShuffle(arr, 'seed')
    expect(result).toHaveLength(arr.length)
    expect(result).not.toBe(arr)
  })

  it('contains exactly the same elements as the input', () => {
    const arr = ['a', 'b', 'c', 'd', 'e']
    const result = seededShuffle(arr, 'any-seed')
    expect([...result].sort()).toEqual([...arr].sort())
  })

  it('is stable: same seed always produces the same order', () => {
    const arr = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    const r1 = seededShuffle(arr, '2026-05-23')
    const r2 = seededShuffle(arr, '2026-05-23')
    expect(r1).toEqual(r2)
  })

  it('produces a different order with a different seed', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const r1 = seededShuffle(arr, '2026-05-23')
    const r2 = seededShuffle(arr, '2026-05-24')
    expect(r1).not.toEqual(r2)
  })

  it('handles an empty array', () => {
    expect(seededShuffle([], 'seed')).toEqual([])
  })

  it('handles a single-element array', () => {
    expect(seededShuffle([42], 'seed')).toEqual([42])
  })

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3]
    const copy = [...arr]
    seededShuffle(arr, 'seed')
    expect(arr).toEqual(copy)
  })
})

describe('getDailySeed', () => {
  it('returns a string matching YYYY-MM-DD', () => {
    expect(getDailySeed()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('is stable within the same UTC day', () => {
    expect(getDailySeed()).toBe(getDailySeed())
  })
})
