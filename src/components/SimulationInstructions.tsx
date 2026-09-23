import { CPR_SIMULATION_STEPS } from '../lib/cpr-steps'
interface SimulationInstructionsProps {
  currentStep: number
  sceneViewTime: number
  handsPlaced: boolean
  onStepComplete: (step: number) => void
  compressionCount?: number
  compressionRate?: number
  compressionFailed?: boolean
  setCompressionFailed?: (value: boolean) => void
  setCompressionCount?: (value: number) => void
  setCompressionRate?: (value: number) => void
  setCompressionTimes?: (value: number[]) => void
  onReset?: () => void
  feedbackLog?: string[]
}
export default function SimulationInstructions({currentStep, sceneViewTime, handsPlaced, onStepComplete, compressionCount = 0, compressionRate = 0, compressionFailed = false, setCompressionFailed, setCompressionCount, setCompressionRate, setCompressionTimes, onReset, feedbackLog = []}: SimulationInstructionsProps) {
  const step = CPR_SIMULATION_STEPS[currentStep] ?? CPR_SIMULATION_STEPS[0]
  return <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5">
    <div><p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Your practice guide</p><h3 className="text-xl font-semibold text-slate-800">{step.title}</h3><p className="text-sm text-slate-500 mt-3">{step.instruction}</p></div>
    {currentStep === 0 && <div className="space-y-3"><p className="text-sm text-slate-600">Check for danger, check responsiveness and normal breathing, then call 911 and send for an AED.</p><button className="btn-primary w-full !px-3" disabled={sceneViewTime < 3} onClick={() => onStepComplete(0)}>{sceneViewTime < 3 ? 'Review the scene to continue' : 'Continue to hand placement →'}</button></div>}
    {currentStep === 1 && <p className="text-sm text-slate-600">{handsPlaced ? 'Hands placed. Ready to practice your rhythm.' : 'Place the heel of one hand on the lower half of the breastbone and your other hand on top.'}</p>}
    {currentStep === 2 && <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
      <div className="flex justify-between text-sm"><span className="text-slate-500">Practice taps</span><strong className="text-slate-800">{compressionCount} / 30</strong></div>
      <div className="flex justify-between text-sm"><span className="text-slate-500">Rhythm</span><strong className="text-slate-800">{compressionRate ? `${Math.round(compressionRate)} BPM` : '—'}</strong></div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-slate-700 transition-all" style={{width: `${Math.min(100,compressionCount / 30 * 100)}%`}} /></div>
      <p className="text-xs text-slate-500">Practice goal: 100–120 BPM overall, with at least 80% of intervals on tempo.</p>
      {compressionCount >= 30 && <div role="status" className={`text-sm ${compressionFailed ? 'text-amber-800' : 'text-emerald-700'}`}>{compressionFailed ? 'Try another rhythm round. Aim for steady, evenly spaced taps.' : 'Rhythm round complete. Keep building consistency.'}</div>}
      {compressionFailed && <button className="btn-secondary !px-3 !py-2 w-full" onClick={() => { setCompressionFailed?.(false); setCompressionCount?.(0); setCompressionRate?.(0); setCompressionTimes?.([]) }}>Retry rhythm round</button>}
    </div>}
    {feedbackLog.length > 0 && <p role="status" className="text-sm text-slate-600 border-l-2 border-slate-300 pl-3">{feedbackLog[0]}</p>}
    <ol className="space-y-2">{CPR_SIMULATION_STEPS.map((item, index) => <li key={item.id} aria-current={index === currentStep ? 'step' : undefined} className={`rounded-lg px-3 py-2 text-xs ${index === currentStep ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500'}`}>{index < currentStep ? '✓' : `0${index + 1}`} &nbsp; {item.title}</li>)}</ol>
    {onReset && <button className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-800" onClick={onReset}>Restart practice</button>}
  </div>
}
