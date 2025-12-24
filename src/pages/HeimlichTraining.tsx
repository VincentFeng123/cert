import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faExclamationTriangle, faUser, faFistRaised, faArrowUp, faHospital, faCheckCircle, faBook, faExclamation } from '@fortawesome/free-solid-svg-icons'
import BackButton from '../components/BackButton'
import SimpleChatbot from '../components/module/SimpleChatbot'
import FlashcardDeck from '../components/FlashcardDeck'
import type { Flashcard as FlashcardItem } from '../components/FlashcardDeck'

const HeimlichTraining = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [studyMode, setStudyMode] = useState<'guide' | 'flashcards'>('guide')
  const heimlichBadgeGroups = useMemo(() => {
    const badges = [
      {
        id: 'heimlich-complete',
        label: 'Heimlich Hero',
        description: 'Work through all four Heimlich training stages.',
        earned: currentStep >= 3,
        icon: '🏅',
      },
      {
        id: 'perfect-score',
        label: 'Quiz Perfect',
        description: 'Earn a perfect score on the Heimlich knowledge check.',
        earned: showQuizResults && quizScore === 100,
        icon: '🧠',
      },
      {
        id: 'video-ready',
        label: 'Prepared Responder',
        description: 'Complete the watch-and-learn tutorial.',
        earned: currentStep >= 1,
        icon: '🎬',
      },
      {
        id: 'hands-on',
        label: 'Hands-On Ready',
        description: 'Attempt the practice simulation phase.',
        earned: currentStep >= 3,
        icon: '🤝',
      },
    ]

    return {
      earned: badges.filter((badge) => badge.earned),
      upcoming: badges.filter((badge) => !badge.earned),
    }
  }, [currentStep, quizScore, showQuizResults])
  const badgePanel = (
    <div className="mt-4">
      <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-1">Badges</div>
      <div className="badge-line">
        {heimlichBadgeGroups.earned.length > 0 ? (
          heimlichBadgeGroups.earned.map((badge) => (
            <span key={badge.id} className="badge-pill" data-earned="true">
              <span className="badge-label">
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400">Complete the steps to unlock badges.</span>
        )}
      </div>
      {heimlichBadgeGroups.upcoming.length > 0 && (
        <div className="badge-line mt-2 opacity-80">
          {heimlichBadgeGroups.upcoming.map((badge) => (
            <span key={badge.id} className="badge-pill" data-earned="false">
              <span className="badge-label">
                <span>🔒</span>
                <span>{badge.label}</span>
              </span>
              <span className="badge-description">{badge.description}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )

  // Load saved progress on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('heimlich-training-progress')
    if (savedProgress) {
      const progress = JSON.parse(savedProgress)
      setCurrentStep(progress.currentStep || 0)
      setQuizScore(progress.quizScore || 0)
      setShowQuizResults(progress.showQuizResults || false)
      
      // Restore scroll position after a short delay to ensure content is rendered
      if (progress.scrollY !== undefined) {
        setTimeout(() => {
          window.scrollTo({ top: progress.scrollY, behavior: 'smooth' })
        }, 100)
      }
    } else {
      // Only scroll to top for new users (no saved progress)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Save progress whenever key state changes
  useEffect(() => {
    const progress = {
      currentStep,
      quizScore,
      showQuizResults,
      scrollY: window.scrollY // Save current scroll position
    }
    localStorage.setItem('heimlich-training-progress', JSON.stringify(progress))
  }, [currentStep, quizScore, showQuizResults])

  // Save scroll position when user navigates away or scrolls
  useEffect(() => {
    const saveScrollPosition = () => {
      const existingProgress = localStorage.getItem('heimlich-training-progress')
      if (existingProgress) {
        const progress = JSON.parse(existingProgress)
        progress.scrollY = window.scrollY
        localStorage.setItem('heimlich-training-progress', JSON.stringify(progress))
      }
    }

    // Save on scroll (throttled)
    let scrollTimer: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(saveScrollPosition, 500)
    }

    // Save before page unload
    const handleBeforeUnload = () => {
      saveScrollPosition()
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearTimeout(scrollTimer)
    }
  }, [])

  const steps = [
    { id: 'video', title: 'Watch & Learn', description: 'Heimlich Video Tutorial' },
    { id: 'knowledge', title: 'Key Points', description: 'Essential Heimlich Knowledge' },
    { id: 'quiz', title: 'Test Knowledge', description: 'Heimlich Quiz' },
    { id: 'practice', title: 'Practice', description: 'Interactive Simulation' }
  ]
  const viewSummary = useMemo(() => {
    const stepId = steps[currentStep]?.id
    switch (stepId) {
      case 'video':
        return 'Watching the Heimlich maneuver tutorial video focusing on positioning and upward thrust technique.'
      case 'knowledge':
        return 'Reviewing key Heimlich steps: recognizing choking, positioning, making a fist, performing abdominal thrusts, and post-care reminders.'
      case 'quiz':
        return showQuizResults
          ? `Reviewing quiz results (score: ${quizScore}).`
          : 'Answering the Heimlich knowledge check on correct fist placement.'
      case 'practice':
        return 'Walking through the practice simulation for choking response (recognize, position, thrust, follow up).'
      default:
        return 'Exploring the Heimlich training module.'
    }
  }, [currentStep, quizScore, showQuizResults, steps])

  const moduleContext = useMemo(() => ({
    moduleId: 'heimlich',
    currentStep: steps[currentStep]?.id || 'video',
    stepData: steps[currentStep],
    userProgress: ((currentStep + 1) / steps.length) * 100,
    viewSummary,
    currentQuestionPrompt: currentStep === 2
      ? 'Where should you place your fist for the Heimlich maneuver?'
      : undefined
  }), [currentStep, steps, viewSummary])
  const heimlichFlashcards = useMemo<FlashcardItem[]>(() => [
    {
      id: 'recognize',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Recognize Severe Choking</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Silent cough or no sound</li>
            <li>Unable to speak or breathe</li>
            <li>Hands grasping the throat</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Act Fast</p>
          <p className="text-sm opacity-80">
            Ask “Are you choking?” If the person nods or cannot respond, start the Heimlich immediately while calling for help.
          </p>
        </div>
      )
    },
    {
      id: 'position',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Positioning &amp; Stance</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Stand behind the victim</li>
            <li>Place one foot forward for balance</li>
            <li>Kneel behind children to match height</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Balance Reminder</p>
          <p className="text-sm opacity-80">
            A staggered stance lets you deliver forceful thrusts without losing balance—critical if the victim suddenly slumps.
          </p>
        </div>
      )
    },
    {
      id: 'hand-placement',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Hand Placement</p>
          <ol className="text-sm opacity-80 space-y-1 list-decimal list-inside">
            <li>Make a fist with thumb inward</li>
            <li>Place it above the navel, below ribs</li>
            <li>Grasp fist with your other hand</li>
          </ol>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Feel the Soft Spot</p>
          <p className="text-sm opacity-80">
            Target the upper abdomen—not the ribs or breastbone—to direct force toward the diaphragm and expel the blockage.
          </p>
        </div>
      )
    },
    {
      id: 'thrust',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Delivering Thrusts</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Pull inward and upward sharply</li>
            <li>Reset quickly and repeat</li>
            <li>Continue until object clears or victim collapses</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Coaching Cue</p>
          <p className="text-sm opacity-80">
            Imagine “J” shaped motions—drive under the ribcage toward the head to create enough pressure to dislodge the object.
          </p>
        </div>
      )
    },
    {
      id: 'special-cases',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Special Situations</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Pregnant/obese: thrust at chest center</li>
            <li>Infant (&lt;1 yr): 5 back blows + 5 chest thrusts</li>
            <li>If unconscious: begin CPR chest compressions</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Aftercare</p>
          <p className="text-sm opacity-80">
            Always seek medical evaluation after the obstruction clears—internal injuries or residual swelling can occur.
          </p>
        </div>
      )
    }
  ], [])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'video':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Heimlich Maneuver Video Tutorial</h2>
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-6">
              <div className="text-white text-center">
                <div className="text-6xl mb-4"><FontAwesomeIcon icon={faPlay} /></div>
                <p className="text-xl">Heimlich Training Video</p>
                <p className="text-gray-300">Learn proper choking response</p>
              </div>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg mb-6">
              <p className="text-orange-800">
                <strong>Important:</strong> Focus on proper positioning and upward thrust technique.
              </p>
            </div>
          </div>
        )

      case 'knowledge':
        return (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Heimlich Maneuver Key Points</h2>
              <p className="text-sm text-slate-500 mt-2">
                Review the essentials in whichever format keeps you sharp—step-by-step guide or quick-flip flashcards.
              </p>
              <div className="inline-flex mt-4 bg-slate-100 rounded-xl p-1">
                {[
                  { key: 'guide' as const, label: 'Study Guide' },
                  { key: 'flashcards' as const, label: 'Flashcards' }
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setStudyMode(option.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      studyMode === option.key
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {studyMode === 'guide' ? (
              <div className="space-y-4">
                {[
                  { icon: faExclamationTriangle, title: 'Recognize Choking', desc: 'Look for inability to speak, cough, or breathe' },
                  { icon: faUser, title: 'Position Yourself', desc: 'Stand behind the person, kneel for children' },
                  { icon: faFistRaised, title: 'Make a Fist', desc: 'Place thumb side against abdomen above navel' },
                  { icon: faArrowUp, title: 'Abdominal Thrusts', desc: 'Quick upward thrusts until object is expelled' },
                  { icon: faHospital, title: 'Follow Up', desc: 'Seek medical attention even if successful' }
                ].map((point, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-2xl text-orange-500"><FontAwesomeIcon icon={point.icon} /></div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">{index + 1}. {point.title}</h3>
                      <p className="text-gray-600">{point.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamation} className="text-orange-500" />
                    Practice Tips
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Always announce what you are doing to reassure the victim.</li>
                    <li>If the person becomes unconscious, lower them gently to the ground and start CPR.</li>
                    <li>Alternate rescuers quickly if available—thrusts are physically demanding.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <FlashcardDeck
                cards={heimlichFlashcards}
                title="Heimlich Mastery Flashcards"
                subtitle="Tap to flip, then move through the deck until each response feels automatic."
              />
            )}
          </div>
        )

      case 'quiz':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Heimlich Knowledge Quiz</h2>
            {!showQuizResults ? (
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Where should you place your fist for the Heimlich maneuver?</h3>
                  <div className="space-y-2">
                    {['On the chest', 'Above the navel, below ribcage', 'On the back'].map((option, i) => (
                      <button
                        key={i}
                        className="block w-full text-left p-3 border rounded hover:bg-gray-100"
                        onClick={() => {
                          setQuizScore(i === 1 ? 100 : 0)
                          setShowQuizResults(true)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-4xl mb-4"><FontAwesomeIcon icon={quizScore === 100 ? faCheckCircle : faBook} /></div>
                <h3 className="text-xl font-bold mb-2">
                  {quizScore === 100 ? 'Correct!' : 'Try Again'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {quizScore === 100 
                    ? 'Correct! Place your fist above the navel, below the ribcage.'
                    : 'The correct answer is above the navel, below the ribcage.'
                  }
                </p>
                <button
                  onClick={() => setShowQuizResults(false)}
                  className="btn-secondary mr-2"
                >
                  Retry Quiz
                </button>
              </div>
            )}
          </div>
        )

      case 'practice':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Heimlich Practice Simulation</h2>
            <div className="bg-orange-600 text-white p-8 rounded-lg mb-6">
              <div className="text-6xl mb-4"><FontAwesomeIcon icon={faExclamation} /></div>
              <h3 className="text-xl font-bold mb-4">Interactive Heimlich Practice</h3>
              <p className="mb-6">Practice proper positioning and technique</p>
              <button className="bg-white text-orange-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
                Start Simulation
              </button>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <p className="text-orange-800">
                <strong>Remember:</strong> Quick, upward thrusts are key. Don't be afraid to use force.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton />
      {/* Header */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Heimlich Maneuver Training</h1>
              <p className="text-gray-600">{steps[currentStep].title}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Progress</div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {badgePanel}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1" style={{ position: 'relative', zIndex: 1 }}>
              <div className="bg-white rounded-lg p-8">
                {renderStepContent()}
            
                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                  <div className="flex space-x-2">
                    {currentStep > 0 && (
                      <button onClick={prevStep} className="btn-secondary">
                        ← Previous
                      </button>
                    )}
                    <Link to="/" className="btn-secondary">
                      Back to Home
                    </Link>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  
                  {currentStep < steps.length - 1 ? (
                    <button onClick={nextStep} className="btn-primary">
                      Next →
                    </button>
                  ) : (
                    <Link to="/" className="btn-primary">
                      Complete Module
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* AI Chatbot Sidebar */}
            <div className="w-80 flex-shrink-0" style={{ position: 'relative', zIndex: 9999999 }}>
              <SimpleChatbot moduleContext={moduleContext} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeimlichTraining
