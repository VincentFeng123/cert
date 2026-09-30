import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import TrainingMannequin from './cpr/TrainingMannequin'
import FlatMannequin from './cpr/FlatMannequin'
import StudioLighting from './three/StudioLighting'
import { CPR_SIMULATION_STEPS } from '../lib/cpr-steps'
import { assessCompressionRhythm, COMPRESSION_TARGET_COUNT, getLiveCompressionRate } from '../lib/cpr-rhythm'

interface CPRSimulationProps {
  onStepComplete: (step: number) => void
  currentStep: number
  sceneViewTime: number
  setSceneViewTime: (value: number | ((prev: number) => number)) => void
  handsPlaced: boolean
  setHandsPlaced: (value: boolean) => void
  compressionCount: number
  setCompressionCount: (value: number) => void
  compressionRate: number
  setCompressionRate: (value: number) => void
  compressionFailed: boolean
  setCompressionFailed: (value: boolean) => void
  compressionTimes: number[]
  setCompressionTimes: (value: number[]) => void
  onFeedback?: (message: string) => void
  isFullscreen?: boolean
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function CameraController({ currentStep, resetKey, overhead, onExplore, onContextLost }: {
  currentStep: number
  resetKey: number
  overhead: boolean
  onExplore: () => void
  onContextLost: () => void
}) {
  const { camera, gl, invalidate } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const destinationRef = useRef(new THREE.Vector3())
  const targetRef = useRef(new THREE.Vector3())
  const transitioningRef = useRef(false)

  useEffect(() => {
    const step = CPR_SIMULATION_STEPS[currentStep] ?? CPR_SIMULATION_STEPS[0]
    destinationRef.current.set(...(overhead ? [0, 4.5, 0.01] as [number, number, number] : step.cameraPosition))
    targetRef.current.set(...step.cameraTarget)
    transitioningRef.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      camera.position.copy(destinationRef.current)
      controlsRef.current?.target.copy(targetRef.current)
      controlsRef.current?.update()
      transitioningRef.current = false
    }
    invalidate()
  }, [camera, currentStep, overhead, resetKey, invalidate])

  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onContextLost() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onContextLost])

  useFrame((_, delta) => {
    if (!transitioningRef.current || !controlsRef.current) return
    const speed = 1 - Math.exp(-delta * 7)
    camera.position.lerp(destinationRef.current, speed)
    controlsRef.current.target.lerp(targetRef.current, speed)
    controlsRef.current.update()
    if (camera.position.distanceTo(destinationRef.current) < 0.006) transitioningRef.current = false
    else invalidate()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.09}
      enablePan={false}
      minDistance={2.4}
      maxDistance={6.5}
      minPolarAngle={0.02}
      maxPolarAngle={Math.PI * 0.45}
      onStart={() => { transitioningRef.current = false; onExplore() }}
    />
  )
}

function RhythmGuide({ enabled }: { enabled: boolean }) {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const interval = window.setInterval(() => setBeat(previous => previous + 1), 60_000 / 110)
    return () => window.clearInterval(interval)
  }, [enabled])
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      {[0, 1, 2, 3].map(index => <span key={index} className={`h-1.5 w-1.5 rounded-full ${enabled && beat % 4 === index ? 'bg-emerald-600' : 'bg-slate-300'}`} />)}
    </span>
  )
}

const controlClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'

function supportsWebGL() {
  if (typeof document === 'undefined') return false
  // Three.js requires WebGL 2. Detect support before Fiber's async setup,
  // whose context creation errors can escape a React error boundary.
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export default function CPRSimulation({
  onStepComplete,
  currentStep,
  sceneViewTime,
  setSceneViewTime,
  handsPlaced,
  setHandsPlaced,
  compressionCount,
  setCompressionCount,
  compressionRate,
  setCompressionRate,
  compressionFailed,
  setCompressionFailed,
  compressionTimes,
  setCompressionTimes,
  onFeedback,
  isFullscreen = false,
}: CPRSimulationProps) {
  const [resetKey, setResetKey] = useState(0)
  const [overhead, setOverhead] = useState(false)
  const [reviewStarted, setReviewStarted] = useState(false)
  const [guideEnabled, setGuideEnabled] = useState(true)
  const [webglFailed, setWebglFailed] = useState(() => !supportsWebGL())
  const [lastTap, setLastTap] = useState<number | null>(null)
  const [localFeedback, setLocalFeedback] = useState('')
  const timestampsRef = useRef(compressionTimes)
  const completedRef = useRef(false)
  const previousStepRef = useRef(currentStep)
  const previousReviewTimeRef = useRef(sceneViewTime)
  const containerRef = useRef<HTMLDivElement>(null)
  const step = CPR_SIMULATION_STEPS[currentStep] ?? CPR_SIMULATION_STEPS[0]
  const roundEnded = compressionCount >= COMPRESSION_TARGET_COUNT
  const result = assessCompressionRhythm(compressionTimes)
  const roundPassed = result.passed || (roundEnded && !compressionFailed && compressionTimes.length === 0)
  const controlsDisabled = currentStep !== 1 && (currentStep !== 2 || compressionFailed || roundEnded)

  const feedback = useCallback((message: string) => {
    setLocalFeedback(message)
    onFeedback?.(message)
  }, [onFeedback])

  useEffect(() => {
    timestampsRef.current = compressionTimes
    if (compressionTimes.length === 0) {
      completedRef.current = false
      setLastTap(null)
      setLocalFeedback('')
    }
  }, [compressionTimes])

  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      setLocalFeedback('')
      if (currentStep === 0) setReviewStarted(false)
      previousStepRef.current = currentStep
    }
  }, [currentStep])

  useEffect(() => {
    if (sceneViewTime === 0 && previousReviewTimeRef.current > 0) setReviewStarted(false)
    previousReviewTimeRef.current = sceneViewTime
  }, [sceneViewTime])

  // A three-second review is a teaching pause, not automated hazard detection.
  // Only count time after interaction, while the scene is visible and focused.
  useEffect(() => {
    if (currentStep !== 0 || !reviewStarted || sceneViewTime >= 3) return
    let previousTime = performance.now()
    const interval = window.setInterval(() => {
      const now = performance.now()
      const elapsed = Math.min(0.2, (now - previousTime) / 1000)
      previousTime = now
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return
      const bounds = containerRef.current?.getBoundingClientRect()
      if (!bounds || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return
      setSceneViewTime(previous => Math.min(3, previous + elapsed))
    }, 100)
    return () => window.clearInterval(interval)
  }, [currentStep, reviewStarted, sceneViewTime, setSceneViewTime])

  useEffect(() => {
    if (currentStep !== 2 || compressionTimes.length < 2 || roundEnded) return
    const interval = window.setInterval(() => {
      setCompressionRate(getLiveCompressionRate(timestampsRef.current, performance.now()))
    }, 150)
    return () => window.clearInterval(interval)
  }, [currentStep, compressionTimes.length, roundEnded, setCompressionRate])

  // Notify after the final counters and result have reached the parent. There is
  // no deferred timeout that could complete an abandoned or reset practice round.
  useEffect(() => {
    if (currentStep === 2 && result.passed && !compressionFailed && !completedRef.current) {
      completedRef.current = true
      onStepComplete(2)
    }
  }, [currentStep, result.passed, compressionFailed, onStepComplete])

  const activate = useCallback(() => {
    if (currentStep === 1) {
      setHandsPlaced(true)
      feedback('Hand position rehearsed. Keep one hand over the other on the center of the chest.')
      onStepComplete(1)
      return
    }
    if (currentStep !== 2 || compressionFailed || roundEnded || timestampsRef.current.length >= COMPRESSION_TARGET_COUNT) return
    const now = performance.now()
    const times = [...timestampsRef.current, now]
    timestampsRef.current = times
    setLastTap(now)
    setCompressionTimes(times)
    setCompressionCount(times.length)
    const assessment = assessCompressionRhythm(times)
    const rate = getLiveCompressionRate(times, now)
    setCompressionRate(rate)

    if (assessment.complete) {
      setCompressionFailed(!assessment.passed)
      feedback(assessment.passed
        ? `Rhythm round complete: ${Math.round(assessment.averageBpm)} BPM average, ${Math.round(assessment.steadyRatio * 100)}% of intervals on tempo.`
        : `Round recorded: ${Math.round(assessment.averageBpm)} BPM average, ${Math.round(assessment.steadyRatio * 100)}% of intervals on tempo. Follow the 110 BPM guide and try again.`)
    } else if (times.length === 1) {
      feedback('Keep tapping steadily. The rhythm guide moves at 110 beats per minute.')
    } else if (times.length % 4 === 0) {
      feedback(rate < 100 ? 'A little faster. Aim for one tap with each beat of the guide.'
        : rate > 120 ? 'Ease the pace. Aim for one tap with each beat of the guide.'
        : 'Your recent rhythm is in the target range. Keep it steady.')
    }
  }, [currentStep, compressionFailed, roundEnded, setHandsPlaced, feedback, onStepComplete, setCompressionTimes, setCompressionCount, setCompressionRate, setCompressionFailed])

  const beginReview = useCallback(() => setReviewStarted(true), [])
  const handleContextLost = useCallback(() => setWebglFailed(true), [])
  const fallback = <FlatMannequin handsPlaced={handsPlaced} onActivate={activate} disabled={controlsDisabled} />
  const rateLabel = compressionCount < 2 ? 'Find your rhythm' : compressionRate < 100 ? 'Speed up a little' : compressionRate > 120 ? 'Ease the pace' : 'On tempo'

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className={`relative bg-[#e9eeeb] ${isFullscreen ? 'h-[58vh] min-h-[340px]' : 'h-[350px] sm:h-[440px]'}`}>
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-3">
          <div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Adult CPR · Practice studio</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{step.title}</p>
          </div>
          {!webglFailed && <div className="pointer-events-auto flex gap-1.5">
            <button type="button" className={controlClass} onClick={() => { setOverhead(previous => !previous); beginReview() }} aria-pressed={overhead} title="Switch between overhead and angled view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></svg>
              <span className="hidden sm:inline">{overhead ? 'Angled' : 'Top view'}</span>
            </button>
            <button type="button" className={controlClass} onClick={() => { setOverhead(false); setResetKey(previous => previous + 1) }} aria-label="Reset camera view" title="Reset camera view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></svg>
            </button>
          </div>}
        </div>
        {webglFailed ? fallback : (
          <SceneBoundary fallback={fallback}>
            <Canvas
              frameloop="demand"
              shadows
              dpr={[1, 1.75]}
              camera={{ position: CPR_SIMULATION_STEPS[0].cameraPosition, fov: 39, near: 0.1, far: 100 }}
              gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.05 }}
              fallback={fallback}
              aria-label="Interactive adult CPR training mannequin. Drag to rotate and scroll or pinch to zoom. Use the practice button below to place hands or tap."
              style={{ touchAction: 'none' }}
            >
              <color attach="background" args={['#e9eeeb']} />
              <fog attach="fog" args={['#e9eeeb', 6.5, 13]} />
              <StudioLighting keyPosition={[-3, 6, 4]} extent={3} keyIntensity={2.3} />
              <TrainingMannequin currentStep={currentStep} handsPlaced={handsPlaced} lastTap={lastTap} onActivate={activate} disabled={controlsDisabled} />
              <CameraController currentStep={currentStep} resetKey={resetKey} overhead={overhead} onExplore={beginReview} onContextLost={handleContextLost} />
            </Canvas>
          </SceneBoundary>
        )}
        {!webglFailed && <div className="pointer-events-none absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between gap-3 text-[11px] text-slate-600">
          <span className="rounded-md bg-white/80 px-2 py-1">Drag to orbit · Scroll or pinch to zoom</span>
          <span className="hidden rounded-md bg-white/80 px-2 py-1 sm:inline">Training mannequin</span>
        </div>}
      </div>

      <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
        {currentStep === 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Pause. Check the scene. Prepare to help.</p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">Review for hazards before approaching. This practice scene does not detect real-world hazards.</p>
            </div>
            <button type="button" onClick={() => sceneViewTime >= 3 ? onStepComplete(0) : beginReview()} disabled={reviewStarted && sceneViewTime < 3} className="shrink-0 rounded-lg bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:bg-slate-100 disabled:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              {sceneViewTime >= 3 ? 'Ready to place hands' : reviewStarted ? `Reviewing · ${Math.max(1, Math.ceil(3 - sceneViewTime))}s` : 'Review the scene'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {currentStep === 2 ? (
                <>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-800">{compressionCount}<span className="ml-1 text-sm font-normal text-slate-400">/ 30</span></span>
                    <span className="h-5 border-l border-slate-200" />
                    <span className="text-lg font-semibold tabular-nums text-slate-800">{compressionCount >= 2 && compressionRate > 0 ? Math.round(compressionRate) : '—'} <span className="text-xs font-normal text-slate-500">BPM</span></span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${compressionFailed ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{roundEnded ? roundPassed ? 'Round complete' : 'Try again' : rateLabel}</span>
                  </div>
                  <button type="button" onClick={() => setGuideEnabled(previous => !previous)} aria-pressed={guideEnabled} className="mt-2 flex items-center gap-2 rounded text-xs text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500">
                    <RhythmGuide enabled={guideEnabled && !roundEnded} />
                    110 BPM guide {guideEnabled ? 'on' : 'off'}
                  </button>
                </>
              ) : (
                <><p className="text-sm font-semibold text-slate-800">Find the center of the chest</p><p className="mt-1 text-xs text-slate-500">Use the green target or the button to rehearse hand position.</p></>
              )}
            </div>
            <button
              type="button"
              onClick={activate}
              onKeyDown={event => { if (event.repeat && (event.key === ' ' || event.key === 'Enter')) event.preventDefault() }}
              disabled={controlsDisabled}
              className="min-w-[165px] select-none rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              style={{ touchAction: 'manipulation' }}
            >
              {currentStep === 1 ? 'Place hands' : roundEnded ? 'Round recorded' : 'Tap to compress'}
              {!controlsDisabled && <span className="mt-0.5 block text-[10px] font-normal opacity-80">{currentStep === 1 ? 'Center of the chest' : 'Click, tap or focus + Space'}</span>}
            </button>
          </div>
        )}
        {currentStep === 2 && <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Rhythm practice only. Taps do not measure compression depth, recoil, or physical technique.</p>}
        <p role="status" aria-live="polite" className="sr-only">{localFeedback}</p>
      </div>
    </div>
  )
}
