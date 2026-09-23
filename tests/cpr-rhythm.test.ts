import assert from 'node:assert/strict'
import test from 'node:test'
import { assessCompressionRhythm, getLiveCompressionRate } from '../src/lib/cpr-rhythm.ts'

const steadyRound = (bpm: number, count = 30) => Array.from({ length: count }, (_, index) => 1000 + index * 60_000 / bpm)

test('a complete steady rhythm passes, including both clinical rate boundaries', () => {
  for (const bpm of [100, 110, 120]) {
    const result = assessCompressionRhythm(steadyRound(bpm))
    assert.equal(result.passed, true)
    assert.ok(Math.abs(result.averageBpm - bpm) < 0.001)
  }
})

test('an incomplete, too slow, too fast or invalid round cannot complete', () => {
  for (const times of [[], [0], steadyRound(110, 29), steadyRound(110, 31), steadyRound(90), steadyRound(130), steadyRound(110).map(() => 0), [...steadyRound(110, 29), NaN]]) {
    assert.equal(assessCompressionRhythm(times).passed, false)
  }
})

test('a correct final few taps cannot conceal rapid clicking earlier in the round', () => {
  const times = [0]
  for (let i = 1; i < 30; i++) times.push(times[i - 1] + (i < 24 ? 100 : 550))
  assert.equal(assessCompressionRhythm(times).passed, false)
})

test('alternating fast and slow taps fail even when the average is in range', () => {
  const times = [0]
  for (let i = 1; i < 30; i++) times.push(times[i - 1] + (i % 2 ? 300 : 800))
  const result = assessCompressionRhythm(times)
  assert.ok(result.averageBpm >= 100 && result.averageBpm <= 120)
  assert.equal(result.passed, false)
})

test('a few imperfect intervals are tolerated but enough inconsistency fails', () => {
  const round = (offTempoCount: number) => {
    const times = [0]
    for (let i = 1; i < 30; i++) times.push(times[i - 1] + (i <= offTempoCount ? 650 : 540))
    return times
  }
  assert.equal(assessCompressionRhythm(round(5)).passed, true)
  assert.equal(assessCompressionRhythm(round(6)).passed, false)
})

test('live rate reflects pauses, while the completed round result remains stable', () => {
  const times = steadyRound(110, 10)
  const last = times[times.length - 1]
  assert.ok(Math.abs(getLiveCompressionRate(times, last) - 110) < 0.001)
  assert.equal(getLiveCompressionRate(times, last + 1500), 40)
  assert.equal(getLiveCompressionRate(times, last + 3100), 0)
  assert.ok(Math.abs(getLiveCompressionRate(steadyRound(110), 99_999) - 110) < 0.001)
})
