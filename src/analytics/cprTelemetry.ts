export type StepTransitionEvent = {
  type: 'step-transition'
  stepId: string
  status: 'entered' | 'completed'
  sourceStep?: string
  timestamp: number
}

export type CompressionSampleEvent = {
  type: 'compression-sample'
  count: number
  bpm: number
  inTargetRange: boolean
  depthEstimate?: number
  timestamp: number
}

export type CompressionSummaryEvent = {
  type: 'compression-summary'
  totalCount: number
  averageBpm: number
  inTargetRange: boolean
  failed: boolean
  timestamp: number
}

export type CompressionErrorEvent = {
  type: 'compression-error'
  reason: 'pace_low' | 'pace_high' | 'depth_insufficient' | 'general'
  bpm: number
  count: number
  timestamp: number
}

export type TelemetryEvent =
  | StepTransitionEvent
  | CompressionSampleEvent
  | CompressionSummaryEvent
  | CompressionErrorEvent

type TelemetryListener = (event: TelemetryEvent) => void

const subscribers = new Set<TelemetryListener>()
const history: TelemetryEvent[] = []
const HISTORY_LIMIT = 200
const SESSION_STORAGE_KEY = 'cpr-telemetry-history'

const persistHistory = () => {
  if (typeof window === 'undefined') return
  try {
    const snapshot = history.slice(-50)
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

const emitBrowserEvent = (event: TelemetryEvent) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return
  window.dispatchEvent(new CustomEvent('cpr-telemetry', { detail: event }))
}

const pushHistory = (event: TelemetryEvent) => {
  history.push(event)
  if (history.length > HISTORY_LIMIT) {
    history.splice(0, history.length - HISTORY_LIMIT)
  }
  persistHistory()
}

const withTimestamp = <T extends Omit<TelemetryEvent, 'timestamp'>>(event: T): T & { timestamp: number } => ({
  ...event,
  timestamp: Date.now()
})

const track = (event: TelemetryEvent) => {
  if (import.meta.env.DEV) {
    // Useful during development to verify telemetry emits
    // eslint-disable-next-line no-console
    console.debug('[CPR Telemetry]', event)
  }
  subscribers.forEach((listener) => {
    try {
      listener(event)
    } catch {
      // Swallow listener errors to avoid cascading failures
    }
  })
  emitBrowserEvent(event)
  pushHistory(event)
}

export const trackStepTransition = (payload: Omit<StepTransitionEvent, 'type' | 'timestamp'>) => {
  track(withTimestamp({ type: 'step-transition', ...payload }))
}

export const trackCompressionSample = (payload: Omit<CompressionSampleEvent, 'type' | 'timestamp'>) => {
  track(withTimestamp({ type: 'compression-sample', ...payload }))
}

export const trackCompressionSummary = (payload: Omit<CompressionSummaryEvent, 'type' | 'timestamp'>) => {
  track(withTimestamp({ type: 'compression-summary', ...payload }))
}

export const trackCompressionError = (payload: Omit<CompressionErrorEvent, 'type' | 'timestamp'>) => {
  track(withTimestamp({ type: 'compression-error', ...payload }))
}

export const subscribeTelemetry = (listener: TelemetryListener) => {
  subscribers.add(listener)
  return () => {
    subscribers.delete(listener)
  }
}

export const getTelemetryHistory = () => [...history]

export const loadPersistedTelemetry = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as TelemetryEvent[]
    history.splice(0, history.length, ...parsed)
  } catch {
    // If parsing fails we start with an empty history
    history.length = 0
  }
}

loadPersistedTelemetry()
