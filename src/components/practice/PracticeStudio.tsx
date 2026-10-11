import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheck, faCompress, faExpand, faLayerGroup, faPause, faPlay, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import HeimlichScene from './HeimlichScene'
import GunViolenceScene from './GunViolenceScene'
import DomesticViolenceScene from './DomesticViolenceScene'
import type { PracticeDefinition } from '../../lib/practice-types'
import { performPracticeAction, practiceIsComplete, restorePracticeActions, type PracticeActions } from '../../lib/practice-progress'
import './practice.css'

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}

function SceneCamera({ overhead, resetKey, onLost, closeView }: { overhead: boolean; resetKey: number; onLost: () => void; closeView: boolean }) {
  const controls = useRef<OrbitControlsType>(null)
  const { camera, gl, invalidate, size } = useThree()
  useEffect(() => {
    const fit = Math.max(1, 1.25 / (size.width / Math.max(1, size.height)))
    if (overhead) camera.position.set(0, (closeView ? 5.8 : 8.5) * fit, 1.1 * fit)
    else if (closeView) camera.position.set(3 * fit, 2.7 * fit, 4.2 * fit)
    else camera.position.set(5 * fit, 4.5 * fit, 6 * fit)
    controls.current?.target.set(0, 0.9, 0)
    controls.current?.update()
    invalidate()
  }, [camera, overhead, resetKey, invalidate, size.width, size.height, closeView])
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onLost() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onLost])
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping minDistance={closeView ? 2.8 : 4} maxDistance={18} minPolarAngle={0.05} maxPolarAngle={Math.PI * 0.47} />
}

function DiagramFallback({ definition, stepIndex }: { definition: PracticeDefinition; stepIndex: number }) {
  return <div className="practice-fallback">
    <svg viewBox="0 0 460 240" aria-hidden="true">
      <rect x="55" y="24" width="350" height="192" rx="24" fill="#e2e8e9" stroke="#cbd5e1" />
      {definition.slug === 'heimlich' ? <g>
        <circle cx="230" cy="59" r="21" fill="#b6927d" /><path d="M198 90 Q230 76 262 90 L269 153 H191Z" fill="#6c9292" />
        <path d="M212 153 V198 M247 153 V198" stroke="#475569" strokeWidth="20" strokeLinecap="round" />
        <circle cx="230" cy={stepIndex < 4 ? 110 : 134} r="16" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray="4 3" />
        <path d="M164 104 L210 115 M294 104 L251 115" stroke="#475569" strokeWidth="13" strokeLinecap="round" />
      </g> : <g>
        <path d="M80 45 H340 V90 M380 110 V193 H80Z" fill="none" stroke="#94a3b8" strokeWidth="7" />
        <rect x="112" y="73" width="78" height="44" rx="9" fill="#94a3b8" /><rect x="230" y="141" width="68" height="36" rx="9" fill="#bbc7ce" />
        <circle cx="220" cy="94" r="13" fill="#668b8b" /><circle cx="280" cy="110" r="13" fill="#b6927d" />
        <path d="M226 111 L253 126 L326 125 L367 85" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray="5 6" />
        <rect x="339" y="46" width="49" height="24" rx="4" fill="#e2f1eb" /><path d="M350 58 H376 M370 52 L376 58 L370 64" fill="none" stroke="#0f766e" strokeWidth="2" />
      </g>}
    </svg>
    <strong>Interactive diagram mode</strong><span>3D graphics are unavailable on this device. Use the same practice actions below.</span>
  </div>
}

export default function PracticeStudio({ definition, savedActions, onActionsChange, onScenarios }: {
  definition: PracticeDefinition
  savedActions: PracticeActions
  onActionsChange: (actions: PracticeActions) => void
  onScenarios: () => void
}) {
  const [actions, setActions] = useState(() => restorePracticeActions(definition, savedActions))
  const [stepIndex, setStepIndex] = useState(() => {
    const incomplete = definition.steps.findIndex(step => (savedActions[step.id] ?? 0) < (step.repetitions ?? 1))
    return incomplete === -1 ? definition.steps.length - 1 : incomplete
  })
  const [summary, setSummary] = useState(() => practiceIsComplete(definition, savedActions))
  const [feedback, setFeedback] = useState('')
  const [incorrect, setIncorrect] = useState(false)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [webglFailed, setWebglFailed] = useState(() => !supportsWebGL())
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const [overhead, setOverhead] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const currentActionsRef = useRef(actions)
  const step = definition.steps[stepIndex]
  const count = actions[step.id] ?? 0
  const required = step.repetitions ?? 1
  const completed = count >= required
  const completedSteps = definition.steps.filter(item => (actions[item.id] ?? 0) >= (item.repetitions ?? 1)).length
  const Scene = definition.slug === 'heimlich' ? HeimlichScene : definition.slug === 'gun-violence' ? GunViolenceScene : DomesticViolenceScene
  const fallback = <DiagramFallback definition={definition} stepIndex={stepIndex} />

  useEffect(() => () => clearTimeout(timerRef.current), [])
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(preference.matches)
    const updateVisibility = () => setVisible(document.visibilityState === 'visible')
    preference.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => { preference.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility) }
  }, [])
  useEffect(() => {
    if (!fullscreen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const root = document.getElementById('root')
    const previouslyInert = root?.inert ?? false
    if (root) root.inert = true
    shellRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setFullscreen(false) }
      if (event.key !== 'Tab') return
      const elements = Array.from(shellRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]') ?? []).filter(element => element.getClientRects().length)
      const first = elements[0], last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => {
      document.body.style.overflow = previousOverflow
      if (root) root.inert = previouslyInert
      document.removeEventListener('keydown', trap)
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[aria-label="Expand practice"]')?.focus())
    }
  }, [fullscreen])

  const activate = (targetId: string) => {
    if (busyRef.current || completed || summary) return
    const target = step.targets.find(item => item.id === targetId)
    if (!target) return
    setIncorrect(!target.correct)
    setFeedback(target.feedback)
    if (!target.correct) return
    busyRef.current = true
    setBusy(true)
    const next = performPracticeAction(definition, currentActionsRef.current, step.id, targetId)
    currentActionsRef.current = next
    setActions(next)
    onActionsChange(next)
    timerRef.current = setTimeout(() => { busyRef.current = false; setBusy(false) }, Math.max(650, step.motionMs ?? 1000))
  }

  const advance = () => {
    if (!completed || busy) return
    setFeedback('')
    setIncorrect(false)
    if (stepIndex === definition.steps.length - 1) setSummary(true)
    else setStepIndex(previous => previous + 1)
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
  }

  const replay = () => {
    currentActionsRef.current = {}
    setActions({})
    setStepIndex(0)
    setSummary(false)
    setFeedback('')
    setIncorrect(false)
  }

  const studio = <div ref={shellRef} className={`practice-studio ${fullscreen ? 'practice-fullscreen' : ''}`} role={fullscreen ? 'dialog' : 'region'} aria-modal={fullscreen ? true : undefined} aria-label={`${definition.title} interactive practice`} onKeyDownCapture={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault() }}>
    <div className="practice-toolbar"><span className="practice-studio-label"><i />{webglFailed ? 'Practice studio' : '3D practice studio'}</span><div className="practice-view-controls">
      <button disabled={webglFailed} onClick={() => setOverhead(value => !value)} aria-pressed={overhead} aria-label={overhead ? 'Use angled view' : 'Use overhead view'} title="Change camera view"><FontAwesomeIcon icon={faLayerGroup} /></button>
      <button disabled={webglFailed} onClick={() => { setResetKey(value => value + 1); setOverhead(false) }} aria-label="Reset camera" title="Reset camera"><FontAwesomeIcon icon={faRotateRight} /></button>
      <button disabled={webglFailed || reducedMotion} onClick={() => setPaused(value => !value)} aria-pressed={paused || reducedMotion} aria-label={paused ? 'Enable animation' : 'Reduce animation'} title={reducedMotion ? 'Reduced motion is enabled' : paused ? 'Enable animation' : 'Show actions without animation'}><FontAwesomeIcon icon={paused || reducedMotion ? faPlay : faPause} /></button>
      <button onClick={() => setFullscreen(value => !value)} aria-label={fullscreen ? 'Exit fullscreen practice' : 'Expand practice'} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}><FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} /></button>
    </div></div>
    {fullscreen && definition.slug === 'domestic-violence' && <a className="practice-quick-exit" href="https://www.google.com" onClick={event => { event.preventDefault(); window.location.replace('https://www.google.com') }}>Quick exit ↗ <span>Does not clear history</span></a>}
    <div className="practice-viewport" data-testid={`${definition.slug}-3d-scene`}>
      {webglFailed ? fallback : <SceneBoundary fallback={fallback}><Canvas shadows frameloop="demand" dpr={[1, 1.5]} camera={{ position: [5, 4.5, 6], fov: 45 }} gl={{ antialias: true, alpha: false }} aria-label={`${definition.title} 3D scene`}>
        <color attach="background" args={['#e9eeee']} /><ambientLight intensity={1.2} /><hemisphereLight args={['#f5faf9', '#81928e', 1.6]} />
        <directionalLight position={[3, 7, 5]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={0.04} />
        <SceneCamera overhead={overhead} resetKey={resetKey} onLost={() => setWebglFailed(true)} closeView={definition.slug === 'heimlich'} />
        <Scene stepId={step.id} actionCount={count} completed={completed} motionEnabled={!paused && !reducedMotion && visible} activeTargetIds={completed || busy || summary ? [] : step.targets.map(target => target.id)} onTarget={activate} />
      </Canvas></SceneBoundary>}
    </div>
    <div className="practice-scene-caption"><span>{webglFailed ? 'Use the action buttons to rehearse each step' : 'Drag to orbit · Scroll or pinch to zoom'}</span><span>{reducedMotion || paused ? 'Reduced motion' : 'Choose a marker or action below'}</span></div>
    <div className="practice-task-panel">
      {summary ? <div className="practice-finished"><span className="practice-complete-icon"><FontAwesomeIcon icon={faCheck} /></span><div className="training-section-label">Sequence complete</div><h3 ref={headingRef} tabIndex={-1}>3D practice completed</h3><p>You rehearsed all {definition.steps.length} steps. Put those decisions into context in the two scenarios.</p><div className="practice-finish-actions"><button className="btn-secondary" onClick={replay}>Replay 3D practice</button><button className="btn-primary" onClick={() => { setFullscreen(false); onScenarios() }}>Go to decision scenarios <FontAwesomeIcon icon={faArrowRight} /></button></div></div> : <>
        <div className="practice-step-topline"><span className="training-section-label">Step {stepIndex + 1} of {definition.steps.length}</span><span>{completedSteps} complete</span></div>
        <div className="practice-step-track" aria-label={`${completedSteps} of ${definition.steps.length} practice steps completed`}>{definition.steps.map((item, index) => <span key={item.id} className={`${index === stepIndex ? 'is-current' : ''} ${(actions[item.id] ?? 0) >= (item.repetitions ?? 1) ? 'is-complete' : ''}`} />)}</div>
        <h3 ref={headingRef} tabIndex={-1}>{step.title}</h3><p className="practice-instruction">{step.instruction}</p>
        {required > 1 && <div className="practice-repetitions" role="status"><strong>{count}<small> / {required}</small></strong><span>Separate practice actions<br /><small>Let each animation finish before the next action.</small></span></div>}
        <div className="practice-actions" role="group" aria-label="Practice actions">{step.targets.map(target => <button key={target.id} className="practice-action" onClick={() => activate(target.id)} disabled={completed || busy}><span>{target.label}</span><FontAwesomeIcon icon={faArrowRight} /></button>)}</div>
        {(feedback || completed) && <div className={`practice-feedback ${incorrect ? 'is-incorrect' : ''}`} role="status"><strong>{incorrect ? 'Pause and reconsider' : completed ? 'Step rehearsed' : 'Keep going'}</strong><p>{completed ? step.success : feedback}</p></div>}
        <div className="practice-next"><span>{busy ? 'Rehearsing action…' : completed ? 'Ready for the next step' : 'Choose the safest next action'}</span><button className="btn-primary" onClick={advance} disabled={!completed || busy}>{stepIndex === definition.steps.length - 1 ? 'Finish 3D practice' : 'Next practice step'} <FontAwesomeIcon icon={faArrowRight} /></button></div>
      </>}
    </div>
    <p className="practice-scope">{definition.scope}</p>
  </div>
  return fullscreen ? createPortal(studio, document.body) : studio
}
