
// CPR simulation steps
const CPR_STEPS = [
  {
    id: 0,
    title: "Scene Safety",
    instruction: "Look around the scene to check for hazards. Use your mouse to pan 360 degrees and assess safety.",
    completionMethod: "Look around for 3 seconds, then click Continue"
  },
  {
    id: 1,
    title: "Hand Placement",
    instruction: "Click on the green target to place your hands on the center of the chest (lower sternum)",
    completionMethod: "Click the green target on the chest"
  },
  {
    id: 2,
    title: "Chest Compressions",
    instruction: "Compress 5-6cm deep at 100-120 compressions per minute",
    completionMethod: "Perform 30 compressions at 100-120 BPM by clicking the green target"
  }
]

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

export default function SimulationInstructions({
  currentStep,
  sceneViewTime,
  handsPlaced,
  onStepComplete,
  compressionCount = 0,
  compressionRate = 0,
  compressionFailed = false,
  setCompressionFailed,
  setCompressionCount,
  setCompressionRate,
  setCompressionTimes,
  onReset,
  feedbackLog = []
}: SimulationInstructionsProps) {
  const step = CPR_STEPS[currentStep] || CPR_STEPS[0]

  return (
    <div className="space-y-8">
      {/* Current Step Instructions */}
      <div>
      <h3 className="font-bold text-xl mb-3 text-gray-800">{step.title}</h3>
      <p className="text-gray-700 mb-4 leading-relaxed">{step.instruction}</p>

      {/* Scene safety timer and button */}
      {currentStep === 0 && (
        <div className="space-y-3">
          {sceneViewTime < 3 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-sm text-orange-700">
                Look around for {Math.max(0, Math.ceil(3 - sceneViewTime))} more seconds...
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (sceneViewTime / 3) * 100)}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onStepComplete(currentStep)}
              className="w-full bg-green-600 bg-opacity-80 text-white px-3 py-2 rounded-lg hover:bg-opacity-95 transition-colors text-sm font-medium"
            >
              Continue to Hand Placement
            </button>
          )}
        </div>
      )}

      {/* Hand placement confirmation */}
      {currentStep === 1 && handsPlaced && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-700 font-medium">
            Hands placed correctly! Moving to compressions...
          </div>
        </div>
      )}

      {/* Compression tracking */}
      {currentStep === 2 && (
        <div className={`${compressionFailed ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'} rounded-lg p-4 mt-4`}>
          <div className={`text-sm ${compressionFailed ? 'text-red-800' : 'text-blue-800'}`}>
            <div className="font-bold text-lg mb-2">
              {compressionFailed ? 'CPR Failed!' : 'Compression Progress'}
            </div>
            <div className="space-y-2">
              <div>Count: <span className="font-bold">{compressionCount}/30</span></div>
              <div>Rate: <span className="font-bold">{Math.round(compressionRate)} BPM</span></div>
              <div className="text-xs mt-2">
                Target: 100-120 BPM
              </div>
              
              {compressionCount >= 30 && compressionFailed ? (
                <div className="space-y-3">
                  <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                  <div className="text-red-700 font-medium">
                    CPR Failed! Your average compression rate was outside the target range (100-120 BPM). Try again!
                  </div>
                  <button
                    onClick={() => {
                      if (setCompressionFailed) {
                        setCompressionFailed(false)
                      }
                      if (setCompressionCount) {
                        setCompressionCount(0)
                      }
                      if (setCompressionRate) {
                        setCompressionRate(0)
                      }
                      if (setCompressionTimes) {
                        setCompressionTimes([])
                      }
                    }}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Retry Compressions
                  </button>
                </div>
              ) : compressionCount >= 30 ? (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3">
                  <div className="font-medium">Great work! You've completed the compression practice.</div>
                  <button
                    onClick={() => onStepComplete(2)}
                    className="w-full bg-green-600 bg-opacity-80 text-white px-3 py-2 rounded-lg hover:bg-opacity-95 transition-colors text-sm font-medium mt-3"
                  >
                    Finish Practice
                  </button>
                </div>
              ) : (
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(compressionCount / 30) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {feedbackLog.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Coaching Feed</h4>
          <p className="text-sm text-slate-700">{feedbackLog[feedbackLog.length - 1]}</p>
        </div>
      )}

      {/* Steps Menu */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Training Steps</h4>
        <div className="space-y-1">
          {CPR_STEPS.map((s, index) => (
            <div
              key={index}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                index === currentStep
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{index + 1}. {s.title}</span>
                {index < currentStep && <span className="text-xs">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      {onReset && (
        <button
          onClick={onReset}
          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
        >
          Reset Simulation
        </button>
      )}
    </div>
  )
}
