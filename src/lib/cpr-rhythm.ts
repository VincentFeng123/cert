export const COMPRESSION_TARGET_COUNT = 30
export const MIN_COMPRESSION_BPM = 100
export const MAX_COMPRESSION_BPM = 120
export const MIN_STEADY_INTERVAL_RATIO = 0.8

/** A browser rhythm exercise, not a clinical assessment of CPR quality. */
export function assessCompressionRhythm(times: readonly number[]) {
  const intervals = times.slice(1).map((time, index) => time - times[index])
  const valid = times.every(Number.isFinite) && intervals.every(interval => interval > 0)
  const elapsed = times.length > 1 ? times[times.length - 1] - times[0] : 0
  const averageBpm = valid && elapsed > 0 ? (intervals.length * 60_000) / elapsed : 0
  const steadyIntervals = intervals.filter(interval => interval >= 500 - 0.001 && interval <= 600 + 0.001).length
  const steadyRatio = valid && intervals.length ? steadyIntervals / intervals.length : 0
  const complete = times.length === COMPRESSION_TARGET_COUNT

  return {
    averageBpm,
    steadyRatio,
    complete,
    passed: complete && valid && averageBpm >= MIN_COMPRESSION_BPM - 0.001 &&
      averageBpm <= MAX_COMPRESSION_BPM + 0.001 && steadyRatio >= MIN_STEADY_INTERVAL_RATIO,
  }
}

/** Recent input rate fades when the learner pauses; completed rounds keep their result. */
export function getLiveCompressionRate(times: readonly number[], now: number) {
  if (times.length < 2 || !Number.isFinite(now)) return 0
  if (times.length >= COMPRESSION_TARGET_COUNT) return assessCompressionRhythm(times).averageBpm
  const recentTimes = times.slice(-6)
  const intervals = recentTimes.slice(1).map((time, index) => time - recentTimes[index])
  if (intervals.some(interval => !Number.isFinite(interval) || interval <= 0)) return 0
  const sinceLastTap = Math.max(0, now - recentTimes[recentTimes.length - 1])
  if (sinceLastTap > 3000) return 0
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  return 60_000 / Math.max(averageInterval, sinceLastTap)
}
