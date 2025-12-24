import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faCheckCircle, faBook, faGraduationCap, faSquareCheck, faChartBar, faLightbulb, faBookOpen, faChevronDown, faChevronRight, faXmark, faCheck, faTrophy, faLock, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons'
import BackButton from '../components/BackButton'
import CPRSimulation, { CPR_SIMULATION_STEPS } from '../components/CPRSimulation'
import SimulationInstructions from '../components/SimulationInstructions'
import SimpleChatbot from '../components/module/SimpleChatbot'
import FlashcardDeck from '../components/FlashcardDeck'
import type { Flashcard as FlashcardItem } from '../components/FlashcardDeck'
type BadgeNotification = {
  id: string
  label: string
  message: string
  icon: string
  duration?: number
}

type LearningGoal = 'confidence' | 'certification' | 'refresh'

const CPRTraining = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showQuestionFeedback, setShowQuestionFeedback] = useState(false)
  const [expandedAnalysis, setExpandedAnalysis] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([])
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)
  const [sceneViewTime, setSceneViewTime] = useState(0)
  const [handsPlaced, setHandsPlaced] = useState(false)
  const [compressionCount, setCompressionCount] = useState(0)
  const [compressionRate, setCompressionRate] = useState(0)
  const [compressionFailed, setCompressionFailed] = useState(false)
  const [compressionTimes, setCompressionTimes] = useState<number[]>([])
  const [moduleCompleted, setModuleCompleted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [goal, setGoal] = useState<LearningGoal>('confidence')
  const [reviewBookmarks, setReviewBookmarks] = useState<string[]>([])
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [feedbackLog, setFeedbackLog] = useState<string[]>([])
  const [showDailyAnswer, setShowDailyAnswer] = useState(false)
  const [studyMode, setStudyMode] = useState<'guide' | 'flashcards'>('guide')
  const [notifications, setNotifications] = useState<BadgeNotification[]>([])
  const [showBadges, setShowBadges] = useState(false)
  const [isClosingBadges, setIsClosingBadges] = useState(false)
  const [isSimulationFullscreen, setSimulationFullscreen] = useState(false)
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const narrationRef = useRef<SpeechSynthesisUtterance | null>(null)
  const notificationTimersRef = useRef<Record<string, number>>({})
  const earnedBadgeSetRef = useRef<Set<string>>(new Set())
  const notifiedBadgeSetRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!isSimulationFullscreen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSimulationFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSimulationFullscreen])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const { body, documentElement } = document

    if (isSimulationFullscreen) {
      const previousBodyOverflow = body.style.overflow
      const previousHtmlOverflow = documentElement.style.overflow
      body.style.overflow = 'hidden'
      documentElement.style.overflow = 'hidden'

      return () => {
        body.style.overflow = previousBodyOverflow
        documentElement.style.overflow = previousHtmlOverflow
      }
    } else {
      body.style.overflow = ''
      documentElement.style.overflow = ''
    }
  }, [isSimulationFullscreen])

  useEffect(() => {
    if (currentStep !== 3 && isSimulationFullscreen) {
      setSimulationFullscreen(false)
    }
  }, [currentStep, isSimulationFullscreen])

  const handleCompressionFeedback = useCallback((message: string) => {
    setFeedbackLog((prev) => (prev[0] === message ? prev : [message]))
  }, [])

  const handleSimulationStepComplete = useCallback((step: number) => {
    if (step < CPR_SIMULATION_STEPS.length - 1) {
      setSimulationStep(step + 1)
    } else {
      setModuleCompleted(true)
    }
  }, [setModuleCompleted, setSimulationStep])

  const showNotification = useCallback((notification: Omit<BadgeNotification, 'id'> & { id?: string; duration?: number }) => {
    const { id, duration = 5600, ...rest } = notification
    const toastId = id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    setNotifications((prev) => [...prev, { ...rest, id: toastId }])

    if (typeof window !== 'undefined') {
      if (notificationTimersRef.current[toastId]) {
        window.clearTimeout(notificationTimersRef.current[toastId])
      }

      const timeoutId = window.setTimeout(() => {
        setNotifications((prev) => prev.filter((toast) => toast.id !== toastId))
        delete notificationTimersRef.current[toastId]
      }, duration)

      notificationTimersRef.current[toastId] = timeoutId
    }

    return toastId
  }, [setNotifications])
  const steps = useMemo(() => ([
    { id: 'video', title: 'Watch & Learn', description: 'CPR Video Tutorial' },
    { id: 'knowledge', title: 'Key Points', description: 'Essential CPR Knowledge' },
    { id: 'quiz', title: 'Test Knowledge', description: 'CPR Quiz' },
    { id: 'practice', title: 'Practice', description: 'Interactive Simulation' }
  ]), [])
  const goalPracticeCopy: Record<LearningGoal, string> = {
    confidence: 'Focus on smooth, steady compressions and calming self-talk for real emergencies.',
    certification: 'Aim for textbook alignment—count aloud and keep cadence between 100 and 120 BPM.',
    refresh: 'Hit the fundamentals quickly: safety sweep, 30 compressions, airway, breaths.'
  }
  const cprFlashcards = useMemo<FlashcardItem[]>(() => [
    {
      id: 'scene-safety',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Scene Safety Checklist</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Scan for hazards before kneeling</li>
            <li>Tap &amp; shout to check responsiveness</li>
            <li>Send someone to call 911/AED</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Why it matters</p>
          <p className="text-sm opacity-80">
            You cannot help if you become a second victim. A 5-second scan buys safety and lets you coordinate help quickly.
          </p>
        </div>
      )
    },
    {
      id: 'compression-basics',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Compression Fundamentals</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Hand heel on lower sternum</li>
            <li>Lock elbows, shoulders over wrists</li>
            <li>Use body weight, not arms</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Keep in mind</p>
          <p className="text-sm opacity-80">
            Direct force through the sternum to compress the heart between the spine and breastbone—this creates circulation.
          </p>
        </div>
      )
    },
    {
      id: 'compression-quality',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">High-Quality Compressions</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Depth: 5–6 cm (2–2.5 in)</li>
            <li>Rate: 100–120 per minute</li>
            <li>Full chest recoil every time</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Coaching cue</p>
          <p className="text-sm opacity-80">
            Count out loud or use a song beat (“Stayin’ Alive”) to hold tempo. Recoil refills the heart—never lean on the chest.
          </p>
        </div>
      )
    },
    {
      id: 'rescue-breaths',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Rescue Breath Steps</p>
          <ol className="text-sm opacity-80 space-y-1 list-decimal list-inside">
            <li>Tilt head, lift chin</li>
            <li>Pinch nose, seal mouth</li>
            <li>Give 2 breaths (1 sec each)</li>
          </ol>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Remember</p>
          <p className="text-sm opacity-80">
            Only give breaths if trained and willing. Watch for visible chest rise and restart compressions immediately afterwards.
          </p>
        </div>
      )
    },
    {
      id: 'aed',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">AED Quick Start</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Turn it on—follow prompts</li>
            <li>Expose chest, attach pads</li>
            <li>Stand clear during analysis</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Key reminder</p>
          <p className="text-sm opacity-80">
            Shock delivery is automatic. Resume compressions immediately when told—even after a shock.
          </p>
        </div>
      )
    },
    {
      id: 'when-to-switch',
      front: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">When to Transition</p>
          <ul className="text-sm opacity-80 space-y-1 list-disc list-inside">
            <li>Victim moves or breathes</li>
            <li>Trained help takes over</li>
            <li>You are physically exhausted</li>
          </ul>
        </div>
      ),
      back: (
        <div className="space-y-2">
          <p className="text-lg font-semibold">Signal to swap</p>
          <p className="text-sm opacity-80">
            Switch compressors every 2 minutes if help is available to prevent fatigue and keep compression quality high.
          </p>
        </div>
      )
    }
  ], [])
  const cprBadgeGroups = useMemo(() => {
    const badges = [
      {
        id: 'cpr-certified',
        label: 'CPR Certified',
        description: 'Complete every step of the interactive practice.',
        earned: moduleCompleted,
        icon: '🏅',
      },
      {
        id: 'quiz-ace',
        label: 'Quiz Ace',
        description: 'Score 90% or higher on the CPR knowledge quiz.',
        earned: showQuizResults && quizScore >= 90,
        icon: '🧠',
      },
      {
        id: 'study-habit',
        label: 'Study Habit',
        description: 'Enable weekly reminders or bookmark three study topics.',
        earned: reminderEnabled || reviewBookmarks.length >= 3,
        icon: '📘',
      },
      {
        id: 'practice-pro',
        label: 'Practice Pro',
        description: 'Complete 30 compressions at target pace without failing.',
        earned: moduleCompleted || (simulationStep >= 3 && compressionCount >= 30 && !compressionFailed),
        icon: '🫀',
      },
      {
        id: 'scene-guardian',
        label: 'Scene Guardian',
        description: 'Finish the full scene safety sweep before touching the patient.',
        earned: sceneViewTime >= 3,
        icon: '🛡️',
      },
    ]

    return {
      earned: badges.filter((badge) => badge.earned),
      upcoming: badges.filter((badge) => !badge.earned),
    }
  }, [moduleCompleted, showQuizResults, quizScore, reminderEnabled, reviewBookmarks.length, simulationStep, compressionCount, compressionFailed, sceneViewTime])
  useEffect(() => {
    const storedEarned = localStorage.getItem('cpr-earned-badges')
    if (storedEarned) {
      try {
        const parsed: unknown = JSON.parse(storedEarned)
        if (Array.isArray(parsed)) {
          earnedBadgeSetRef.current = new Set(parsed.filter((value): value is string => typeof value === 'string'))
        }
      } catch (error) {
        console.error('Failed to parse stored badge history', error)
      }
    }

    const storedNotified = localStorage.getItem('cpr-notified-badges')
    if (storedNotified) {
      try {
        const parsed: unknown = JSON.parse(storedNotified)
        if (Array.isArray(parsed)) {
          notifiedBadgeSetRef.current = new Set(parsed.filter((value): value is string => typeof value === 'string'))
        }
      } catch (error) {
        console.error('Failed to parse notified badge history', error)
      }
    }
  }, [])

  useEffect(() => {
    const currentEarned = new Set(cprBadgeGroups.earned.map((badge) => badge.id))

    cprBadgeGroups.earned.forEach((badge) => {
      if (!notifiedBadgeSetRef.current.has(badge.id)) {
        showNotification({
          id: `${badge.id}-${Date.now()}`,
          label: badge.label,
          message: badge.description ?? '',
          icon: badge.icon ?? '🏅'
        })
        notifiedBadgeSetRef.current.add(badge.id)
      }
    })

    earnedBadgeSetRef.current = currentEarned
    localStorage.setItem('cpr-earned-badges', JSON.stringify(Array.from(currentEarned)))
    localStorage.setItem('cpr-notified-badges', JSON.stringify(Array.from(notifiedBadgeSetRef.current)))
  }, [cprBadgeGroups.earned, showNotification])

  useEffect(() => () => {
    Object.values(notificationTimersRef.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
  }, [])
  const badgePanel = (
    <>
      {/* Floating Badge Button */}
      <button
        onClick={() => {
          if (showBadges) {
            setIsClosingBadges(true)
            setTimeout(() => {
              setShowBadges(false)
              setIsClosingBadges(false)
            }, 300)
          } else {
            setShowBadges(true)
          }
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-800 text-white rounded-full border border-slate-700 hover:bg-slate-700 transition-all duration-300 flex items-center justify-center"
        style={{ zIndex: 2147483648 }}
        aria-label="Toggle achievements"
      >
        <FontAwesomeIcon icon={faTrophy} className="text-lg" />
      </button>

      {/* Expandable Badge Panel */}
      {showBadges && (
        <div className={`fixed bottom-24 right-8 w-80 bg-white border border-slate-300 rounded-xl overflow-hidden ${isClosingBadges ? 'animate-slideDown' : 'animate-slideUp'}`} style={{ zIndex: 2147483648 }}>
          <div className="bg-slate-800 px-5 py-4 flex items-center justify-between border-b border-slate-700">
            <h3 className="text-white font-semibold text-base">Achievements</h3>
            <button
              onClick={() => {
                setIsClosingBadges(true)
                setTimeout(() => {
                  setShowBadges(false)
                  setIsClosingBadges(false)
                }, 300)
              }}
              className="text-white hover:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {cprBadgeGroups.earned.length > 0 ? (
              <div className="space-y-3">
                {cprBadgeGroups.earned.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{badge.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm">{badge.label}</div>
                      <div className="text-xs text-slate-600">{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                <FontAwesomeIcon icon={faTrophy} className="text-4xl mb-2 text-slate-300" />
                <p>No achievements yet!</p>
                <p className="text-xs mt-1">Complete tasks to earn badges</p>
              </div>
            )}

            {cprBadgeGroups.upcoming.length > 0 && (
              <>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-5 mb-3">Locked</div>
                <div className="space-y-3">
                  {cprBadgeGroups.upcoming.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg opacity-50">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faLock} className="text-lg text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-700 text-sm">{badge.label}</div>
                        <div className="text-xs text-slate-500">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
  const narrate = useCallback((message: string) => {
    if (!voiceEnabled || !speechSupported || !message.trim()) return
    if (typeof SpeechSynthesisUtterance === 'undefined') return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = goal === 'certification' ? 1 : 1.05
    utterance.pitch = 1
    narrationRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [goal, speechSupported, voiceEnabled])

  useEffect(() => {
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [speechSupported])

  useEffect(() => {
    if (!voiceEnabled && speechSupported) {
      window.speechSynthesis.cancel()
    }
  }, [speechSupported, voiceEnabled])


  useEffect(() => {
    if (currentStep !== 3) {
      setFeedbackLog([])
    }
  }, [currentStep])

  // Scroll to top on initial mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  // Load saved progress on component mount
  useEffect(() => {
    if (hasRestoredPosition) {
      return
    }

    const savedProgressRaw = localStorage.getItem('cpr-training-progress')
    if (savedProgressRaw) {
      const progress = JSON.parse(savedProgressRaw) as Record<string, unknown>
      
      const storedCurrentStep = typeof progress.currentStep === 'number' ? progress.currentStep : 0
      const storedQuizScore = typeof progress.quizScore === 'number' ? progress.quizScore : 0
      const storedCurrentQuestion = typeof progress.currentQuestion === 'number' ? progress.currentQuestion : 0
      const storedSimulationStep = typeof progress.simulationStep === 'number' ? progress.simulationStep : 0

      setCurrentStep(storedCurrentStep)
      setQuizScore(storedQuizScore)
      setShowQuizResults(Boolean(progress.showQuizResults))
      setShowVideo(Boolean(progress.showVideo))
      setCurrentQuestion(storedCurrentQuestion)
      setSelectedAnswers(Array.isArray(progress.selectedAnswers) ? (progress.selectedAnswers as number[]) : [])
      setSelectedAnswer(typeof progress.selectedAnswer === 'number' ? progress.selectedAnswer : null)
      setShowQuestionFeedback(Boolean(progress.showQuestionFeedback))
      setSimulationStep(storedSimulationStep)
      setModuleCompleted(Boolean(progress.moduleCompleted))

      if (typeof progress.voiceEnabled === 'boolean' && speechSupported) {
        setVoiceEnabled(progress.voiceEnabled)
      }
      if (typeof progress.goal === 'string') {
        setGoal(progress.goal as LearningGoal)
      }
      if (Array.isArray(progress.reviewBookmarks)) {
        setReviewBookmarks(progress.reviewBookmarks as string[])
      }
      if (typeof progress.reminderEnabled === 'boolean') {
        setReminderEnabled(progress.reminderEnabled)
      }
      
      const storedScroll = typeof progress.scrollY === 'number' ? progress.scrollY : undefined
      setHasRestoredPosition(true)
      if (storedScroll !== undefined) {
        setTimeout(() => {
          window.scrollTo({ top: storedScroll, behavior: 'smooth' })
        }, 200)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setHasRestoredPosition(true)
    }
  }, [hasRestoredPosition, speechSupported, steps])

  // Save progress whenever key state changes
  useEffect(() => {
    // Don't save during the initial restoration period
    if (!hasRestoredPosition) return
    
    const progress = {
      currentStep,
      quizScore,
      showQuizResults,
      showVideo,
      currentQuestion,
      selectedAnswers,
      selectedAnswer,
      showQuestionFeedback,
      simulationStep,
      moduleCompleted,
      scrollY: window.scrollY, // Save current scroll position
      voiceEnabled,
      goal,
      reviewBookmarks,
      reminderEnabled
    }
    localStorage.setItem('cpr-training-progress', JSON.stringify(progress))
  }, [currentQuestion, currentStep, goal, hasRestoredPosition, moduleCompleted, quizScore, reminderEnabled, reviewBookmarks, selectedAnswer, selectedAnswers, showQuestionFeedback, showQuizResults, showVideo, simulationStep, steps, voiceEnabled])

  // Save scroll position when user navigates away or scrolls
  useEffect(() => {
    const saveScrollPosition = () => {
      // Don't save during restoration or navigation
      if (!hasRestoredPosition || isNavigating) return
      
      const existingProgress = localStorage.getItem('cpr-training-progress')
      if (existingProgress) {
        const progress = JSON.parse(existingProgress) as Record<string, unknown>
        const updated = { ...progress, scrollY: window.scrollY }
        localStorage.setItem('cpr-training-progress', JSON.stringify(updated))
      }
    }

    let scrollTimer: ReturnType<typeof setTimeout> | undefined

    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        saveScrollPosition()
      }, 500)
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
  }, [hasRestoredPosition, isNavigating])

  const quizQuestions = useMemo(() => ([
    {
      question: "What is the first thing you should do before starting CPR?",
      options: ["Start chest compressions immediately", "Check if the scene is safe", "Give two rescue breaths", "Shake the victim forcefully"],
      correct: 1,
      explanation: "Scene safety is always the priority. You cannot help if you become a victim yourself. Always assess for dangers like traffic, fire, electrical hazards, or violence before approaching.",
      category: "Scene Safety"
    },
    {
      question: "If the victim does not respond when you check them, what should you do next?",
      options: ["Start compressions right away", "Call emergency services / ask someone else to call", "Move them into a chair", "Splash water on their face"],
      correct: 1,
      explanation: "Calling for professional help is critical. They have advanced equipment and medications. If you're alone, call first, then return to the victim. If others are present, send someone to call while you begin CPR.",
      category: "Emergency Response"
    },
    {
      question: "Where should your hands be placed for chest compressions on an adult?",
      options: ["Lower half of the sternum (center of the chest)", "Directly over the ribs on the left side", "Over the stomach", "On the collarbone"],
      correct: 0,
      explanation: "The lower half of the sternum (breastbone) is positioned directly over the heart. This location allows for maximum compression of the heart chambers to generate blood flow.",
      category: "Compression Technique"
    },
    {
      question: "Which part of the hand should you use for compressions?",
      options: ["Fingertips", "Palm heel", "Entire palm", "Knuckles"],
      correct: 1,
      explanation: "The heel of the palm provides the most effective force transfer while reducing the risk of rib fractures. Fingertips and knuckles can cause injuries, while the entire palm reduces compression effectiveness.",
      category: "Compression Technique"
    },
    {
      question: "How deep should chest compressions be on an adult?",
      options: ["About 2 cm (1 inch)", "About 4 cm (1.5 inches)", "About 5–6 cm (2–2.5 inches)", "As deep as possible"],
      correct: 2,
      explanation: "5-6 cm depth is needed to adequately compress the heart and generate sufficient blood flow to vital organs. Shallower compressions are ineffective, while excessive depth increases injury risk.",
      category: "Compression Technique"
    },
    {
      question: "What is the recommended compression rate?",
      options: ["60 per minute", "80–100 per minute", "100–120 per minute", "150 per minute"],
      correct: 2,
      explanation: "100-120 compressions per minute optimizes cardiac output. Slower rates don't generate enough blood flow, while faster rates don't allow adequate heart filling between compressions.",
      category: "Compression Technique"
    },
    {
      question: "After how many chest compressions should you give rescue breaths (if trained)?",
      options: ["Every 10 compressions", "Every 15 compressions", "Every 20 compressions", "Every 30 compressions"],
      correct: 3,
      explanation: "The 30:2 ratio maximizes the time spent on compressions while providing adequate ventilation. Shorter compression cycles reduce the effectiveness of blood circulation.",
      category: "CPR Cycles"
    },
    {
      question: "How many rescue breaths should be given after a set of compressions?",
      options: ["1", "2", "5", "10"],
      correct: 1,
      explanation: "Two rescue breaths provide adequate oxygen without taking too much time away from compressions. Each breath should make the chest visibly rise.",
      category: "Rescue Breathing"
    },
    {
      question: "What should you do before giving a rescue breath?",
      options: ["Tilt the head back and lift the chin", "Push down on the stomach", "Cover the victim's eyes", "Pat the victim's back"],
      correct: 0,
      explanation: "Head tilt-chin lift opens the airway by moving the tongue away from the back of the throat. This is essential for effective ventilation.",
      category: "Rescue Breathing"
    },
    {
      question: "What should you do after each chest compression?",
      options: ["Keep pressure on the chest", "Allow full chest recoil (let chest rise)", "Tap the shoulders", "Pause for 5 seconds"],
      correct: 1,
      explanation: "Complete chest recoil allows the heart to fill with blood between compressions. Leaning on the chest prevents proper filling and reduces the effectiveness of the next compression.",
      category: "Compression Technique"
    },
    {
      question: "Which of the following is a key sign that CPR is needed?",
      options: ["The victim is snoring", "The victim has shallow but steady breathing", "The victim is not breathing normally / gasping", "The victim's eyes are open but they can't talk"],
      correct: 2,
      explanation: "Absent or abnormal breathing (including agonal gasps) indicates cardiac arrest. Snoring indicates partial airway obstruction but some air movement. Shallow but steady breathing may not require CPR.",
      category: "Recognition"
    },
    {
      question: "Why is minimizing interruptions in compressions important?",
      options: ["It keeps rescuers from getting tired", "It helps blood continue flowing to the brain and heart", "It makes the victim breathe faster", "It prevents chest injuries"],
      correct: 1,
      explanation: "Continuous compressions maintain coronary and cerebral perfusion pressure. Even brief interruptions cause significant drops in blood flow, reducing survival chances.",
      category: "Compression Quality"
    },
    {
      question: "When should CPR be stopped?",
      options: ["When the victim starts breathing normally again", "When an AED is available and ready", "When professional help takes over", "All of the above"],
      correct: 3,
      explanation: "CPR should continue until the victim recovers, advanced help arrives, or you become too exhausted. An AED doesn't replace CPR but works with it - resume compressions immediately after shock delivery.",
      category: "CPR Management"
    },
    {
      question: "What is the purpose of an AED during CPR?",
      options: ["It keeps oxygen in the lungs", "It gives an electric shock to restore heart rhythm", "It replaces chest compressions", "It pumps air into the lungs automatically"],
      correct: 1,
      explanation: "AEDs analyze heart rhythm and deliver shock therapy for certain lethal arrhythmias (like ventricular fibrillation). The shock can restore a normal rhythm, but CPR must continue to circulate blood.",
      category: "AED Use"
    },
    {
      question: "Which statement about CPR is TRUE?",
      options: ["Only doctors should perform CPR", "CPR guarantees survival", "CPR can double or triple the chance of survival", "You should stop CPR after one minute if no response"],
      correct: 2,
      explanation: "Immediate bystander CPR significantly improves survival rates in cardiac arrest. Anyone can learn and perform CPR. While it doesn't guarantee survival, it maintains vital organ perfusion until advanced care arrives.",
      category: "CPR Effectiveness"
    }
  ]), [])

  const quizCategories = useMemo(() => {
    const set = new Set<string>()
    quizQuestions.forEach((question) => set.add(question.category))
    return Array.from(set)
  }, [quizQuestions])

  const dailyChallenge = useMemo(() => {
    if (quizQuestions.length === 0) return null
    const seed = new Date().toDateString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = seed % quizQuestions.length
    return quizQuestions[index]
  }, [quizQuestions])

  useEffect(() => {
    setShowDailyAnswer(false)
  }, [dailyChallenge])

  useEffect(() => {
    if (studyMode !== 'guide') {
      setShowDailyAnswer(false)
    }
  }, [studyMode])

  useEffect(() => {
    if (!voiceEnabled) return
    const stepId = steps[currentStep]?.id
    if (!stepId) return
    let narration = ''

    switch (stepId) {
      case 'video':
        narration = 'Watch the demonstration and focus on hand placement, compression rhythm, and rescue breath timing.'
        break
      case 'knowledge':
        narration = studyMode === 'flashcards'
          ? 'Flip through the flashcards and test yourself on compression technique, AED steps, and critical numbers.'
          : 'Review the study guide and bookmark any sections you want to revisit. Memorize the 30 to 2 ratio and compression depth.'
        break
      case 'quiz':
        narration = 'Answer each question thoughtfully. Use the feedback to understand why the correct technique matters.'
        break
      case 'practice':
        if (simulationStep === 0) {
          narration = 'Rotate the camera to confirm the scene is safe before you touch the patient.'
        } else if (simulationStep === 1) {
          narration = 'Place the heel of your hand on the lower half of the sternum, stack your hands, and lock your elbows.'
        } else if (simulationStep === 2) {
          narration = 'Drive from your shoulders at one hundred to one hundred twenty beats per minute, keeping compressions two inches deep.'
        } else {
          narration = 'Tilt the head back to open the airway and prepare for rescue breaths or AED pads.'
        }
        break
    }

    narrate(narration)
  }, [currentStep, narrate, simulationStep, steps, studyMode, voiceEnabled])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsNavigating(true)
      setCurrentStep(currentStep + 1)
      // Use setTimeout to ensure state update happens first
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setIsNavigating(false)
      }, 100)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setIsNavigating(true)
      setCurrentStep(currentStep - 1)
      // Use setTimeout to ensure state update happens first
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setIsNavigating(false)
      }, 100)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return

    if (!showQuestionFeedback) {
      setShowQuestionFeedback(true)
      return
    }

    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = selectedAnswer

    setSelectedAnswers(newAnswers)
    setShowQuestionFeedback(false)

    if (currentQuestion + 1 < quizQuestions.length) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(newAnswers[currentQuestion + 1] || null)
    } else {
      // Calculate final score
      let correct = 0
      newAnswers.forEach((answer, index) => {
        if (answer === quizQuestions[index].correct) {
          correct++
        }
      })
      setQuizScore(Math.round((correct / quizQuestions.length) * 100))
      setShowQuizResults(true)
      // Stay in quiz step but show results - don't auto-advance
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(selectedAnswers[currentQuestion - 1] || null)
    }
  }

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setSelectedAnswers([])
    setShowQuizResults(false)
    setShowQuestionFeedback(false)
    setQuizScore(0)
    setExpandedAnalysis(false)
    setExpandedQuestions([])
  }

  const toggleBookmark = useCallback((category: string) => {
    setReviewBookmarks((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    )
  }, [])

  const getWrongAnswersAnalysis = () => {
    const wrongAnswers: Array<{
      question: string
      category: string
      yourAnswer: string
      correctAnswer: string
      explanation: string
    }> = []
    selectedAnswers.forEach((answer, index) => {
      if (answer !== quizQuestions[index].correct) {
        wrongAnswers.push({
          question: quizQuestions[index].question,
          category: quizQuestions[index].category,
          yourAnswer: quizQuestions[index].options[answer],
          correctAnswer: quizQuestions[index].options[quizQuestions[index].correct],
          explanation: quizQuestions[index].explanation
        })
      }
    })
    return wrongAnswers
  }

  const getStudyRecommendations = () => {
    const wrongCategories = getWrongAnswersAnalysis().map(item => item.category)
    const uniqueCategories = [...new Set(wrongCategories)]
    
    const recommendations: Record<string, string> = {
      "Scene Safety": "Review the importance of scene assessment and personal safety before approaching any emergency situation.",
      "Emergency Response": "Study the steps for activating emergency medical services and coordinating with others at the scene.",
      "Compression Technique": "Focus on proper hand placement, compression depth (5-6 cm), rate (100-120/min), and allowing complete chest recoil.",
      "CPR Cycles": "Practice the 30:2 compression-to-ventilation ratio and understand when to use hands-only CPR.",
      "Rescue Breathing": "Review airway opening techniques and proper ventilation methods.",
      "Recognition": "Study the signs of cardiac arrest and how to differentiate from other emergency conditions.",
      "Compression Quality": "Understand the importance of minimizing interruptions and maintaining effective compressions.",
      "CPR Management": "Learn when to start, continue, and stop CPR in various scenarios.",
      "AED Use": "Study how AEDs work with CPR and the proper sequence of shock delivery and compressions.",
      "CPR Effectiveness": "Review the survival statistics and importance of immediate bystander intervention."
    }
    
    return uniqueCategories.map(category => ({
      category,
      recommendation: recommendations[category]
    }))
  }

  const viewSummary = useMemo(() => {
    const stepId = steps[currentStep]?.id
    switch (stepId) {
      case 'video':
        return 'Watching the CPR tutorial video that demonstrates cadence, hand placement, and rescue breaths.'
      case 'knowledge':
        if (studyMode === 'flashcards') {
          return 'Reviewing CPR essentials with flashcards covering scene safety, compression technique, rescue breaths, AED usage, and transition cues.'
        }
        return 'Reading the CPR study guide sections for scene safety, breathing assessment, compression technique, rescue breaths, CPR cycles, AED use, and key reminders.'
      case 'quiz':
        return quizQuestions[currentQuestion]
          ? `Answering quiz question ${currentQuestion + 1} of ${quizQuestions.length}: ${quizQuestions[currentQuestion].question}`
          : 'Answering CPR knowledge quiz questions.'
      case 'practice':
        if (simulationStep === 0) return 'Simulation step 1: scanning the scene to confirm safety.'
        if (simulationStep === 1) return 'Simulation step 2: placing hands on the chest and preparing for compressions.'
        if (simulationStep === 2) return `Simulation step 3: performing compressions (count ${compressionCount}, rate ${Math.round(compressionRate)} BPM).`
        return 'Simulation step 4: tilting the head to open the airway.'
      default:
        return 'Exploring the CPR training module.'
    }
  }, [compressionCount, compressionRate, currentQuestion, currentStep, quizQuestions, simulationStep, steps, studyMode])

  const currentQuestionPrompt = currentStep === 2 && quizQuestions[currentQuestion]
    ? quizQuestions[currentQuestion].question
    : undefined

  // Memoize module context to prevent chatbot from remounting
  const moduleContext = useMemo(() => ({
    moduleId: 'cpr',
    currentStep: steps[currentStep]?.id || 'practice',
    stepData: steps[currentStep],
    userProgress: ((currentStep + 1) / steps.length) * 100,
    learningGoal: goal,
    focusAreas: reviewBookmarks,
    studyMode,
    viewSummary,
    currentQuestionPrompt
  }), [currentQuestionPrompt, currentStep, goal, reviewBookmarks, steps, studyMode, viewSummary])

  const renderPracticeSidebar = useCallback((variant: 'normal' | 'overlay') => {
    const isOverlay = variant === 'overlay'

    const containerClass = isOverlay
      ? 'w-full lg:w-96 flex-shrink-0 flex flex-col h-full px-6 py-6'
      : 'w-64 flex-shrink-0'

    const wrapperClass = isOverlay
      ? 'flex-1 flex flex-col rounded-2xl overflow-hidden'
      : undefined

    const wrapperStyle = isOverlay
      ? undefined
      : { position: 'sticky', top: '20px', width: '100%' } as const

    const instructionsWrapperClass = isOverlay ? 'flex-1 overflow-y-auto px-4 py-4' : undefined

    return (
      <div className={containerClass}>
        <div className={wrapperClass} style={wrapperStyle}>
          <div className="mb-4 p-4 space-y-3">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Today's Focus</span>
              <p className="text-[0.7rem] text-slate-600 mt-1">{goalPracticeCopy[goal]}</p>
              {reviewBookmarks.length > 0 && (
                <p className="text-[0.65rem] text-slate-500 mt-2">
                  Focus today: {reviewBookmarks.join(', ')}
                </p>
              )}
            </div>
            {reminderEnabled && (
              <div className="text-[0.65rem] text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                Weekly review reminders are on. We'll surface your saved topics the next time you visit.
              </div>
            )}
          </div>

          <div className={instructionsWrapperClass ?? ''}>
            <SimulationInstructions
              currentStep={simulationStep}
              sceneViewTime={sceneViewTime}
              handsPlaced={handsPlaced}
              onStepComplete={handleSimulationStepComplete}
              compressionCount={compressionCount}
              compressionRate={compressionRate}
              compressionFailed={compressionFailed}
              setCompressionFailed={setCompressionFailed}
              setCompressionCount={setCompressionCount}
              setCompressionRate={setCompressionRate}
              setCompressionTimes={setCompressionTimes}
              feedbackLog={feedbackLog}
              onReset={() => {
                setSimulationStep(0)
                setSceneViewTime(0)
                setHandsPlaced(false)
                setCompressionCount(0)
                setCompressionRate(0)
                setCompressionFailed(false)
                setCompressionTimes([])
              }}
            />
          </div>
        </div>
      </div>
    )
  }, [
    compressionCount,
    compressionFailed,
    compressionRate,
    feedbackLog,
    goal,
    goalPracticeCopy,
    handsPlaced,
    handleSimulationStepComplete,
    reminderEnabled,
    reviewBookmarks,
    sceneViewTime,
    setCompressionCount,
    setCompressionFailed,
    setCompressionRate,
    setCompressionTimes,
    setHandsPlaced,
    setSceneViewTime,
    setSimulationStep,
    simulationStep
  ])

  const fullscreenOverlay = useMemo(() => {
    if (!isSimulationFullscreen || typeof document === 'undefined') return null

    return createPortal(
      <div
        className="fixed inset-0 z-[10000] bg-white overflow-auto"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSimulationFullscreen(false)
          }
        }}
      >
        <div className="flex h-full w-full flex-col lg:flex-row">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-6 lg:px-10 py-6 border-b border-slate-200 bg-white">
              <h2 className="text-xl lg:text-2xl font-semibold text-slate-800">Interactive CPR Practice</h2>
              <button
                onClick={() => setSimulationFullscreen(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                type="button"
              >
                <FontAwesomeIcon icon={faCompress} />
                Exit Full Screen
              </button>
            </div>

            <div className="flex-1 overflow-hidden px-6 lg:px-10 py-6">
              <div className="h-full w-full rounded-2xl bg-white">
                <CPRSimulation
                  currentStep={simulationStep}
                  onStepComplete={handleSimulationStepComplete}
                  sceneViewTime={sceneViewTime}
                  setSceneViewTime={setSceneViewTime}
                  handsPlaced={handsPlaced}
                  setHandsPlaced={setHandsPlaced}
                  compressionCount={compressionCount}
                  setCompressionCount={setCompressionCount}
                  compressionRate={compressionRate}
                  setCompressionRate={setCompressionRate}
                  compressionFailed={compressionFailed}
                  setCompressionFailed={setCompressionFailed}
                  compressionTimes={compressionTimes}
                  setCompressionTimes={setCompressionTimes}
                  onFeedback={handleCompressionFeedback}
                  isFullscreen
                />
              </div>
            </div>

            {moduleCompleted && (
              <div className="px-6 lg:px-10 pb-8">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4">
                  <p>
                    <strong>Congratulations!</strong> You have successfully completed the CPR practice simulation. You've learned all the essential steps for performing CPR.
                  </p>
                </div>
              </div>
            )}
          </div>

          {renderPracticeSidebar('overlay')}
        </div>
      </div>,
      document.body
    )
  }, [
    compressionCount,
    compressionFailed,
    compressionRate,
    compressionTimes,
    handleSimulationStepComplete,
    handsPlaced,
    isSimulationFullscreen,
    moduleCompleted,
    sceneViewTime,
    setCompressionCount,
    setCompressionFailed,
    setCompressionRate,
    setCompressionTimes,
    setHandsPlaced,
    setSceneViewTime,
    simulationStep,
    handleCompressionFeedback,
    renderPracticeSidebar,
    setSimulationFullscreen
  ])

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'video':
        return (
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-800 mb-8">CPR Video Tutorial</h2>
            <div className="image-box mb-8">
              {!showVideo ? (
                <div className="bg-slate-900 rounded-2xl aspect-video flex items-center justify-center cursor-pointer"
                     onClick={() => setShowVideo(true)}>
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4 hover:scale-110 transition-transform duration-300">
                      <FontAwesomeIcon icon={faPlay} />
                    </div>
                    <p className="text-xl font-medium">CPR Training Video</p>
                    <p className="text-slate-300 mt-2">Click to play video</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/Plse2FOkV4Q?autoplay=1"
                    title="CPR Training Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
            <div className="banner-box">
              <p className="text-slate-700 text-lg">
                <strong>Important:</strong> Pay close attention to hand placement, compression depth, and rhythm demonstrated in the video.
              </p>
            </div>
          </div>
        )

      case 'knowledge':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faGraduationCap} className="text-slate-600" />
                CPR Knowledge Studio
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Choose how you want to review today’s material—deep dive with the guide or drill with flashcards.
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
              <div className="space-y-8">
                {/* Scene Safety */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">1. Scene Safety & Initial Steps</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>• Always check if the scene is safe before approaching the victim</li>
                    <li>• Tap the victim and check for responsiveness (shout "Are you okay?")</li>
                    <li>• If unresponsive:</li>
                    <li className="ml-4">- Call emergency services immediately (or send someone else to call)</li>
                    <li className="ml-4">- If available, have someone bring an AED (Automated External Defibrillator)</li>
                  </ul>
                </div>

                {/* Breathing Assessment */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">2. Checking Breathing & Signs of Cardiac Arrest</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>• Look, listen, and feel for normal breathing</li>
                    <li>• Agonal gasps (gasping, irregular breaths) are not normal breathing</li>
                    <li>• <strong>No response + no normal breathing = start CPR immediately</strong></li>
                  </ul>
                </div>

                {/* Chest Compressions */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">3. Chest Compressions</h3>
                  <div className="text-slate-700 space-y-3">
                    <div>
                      <h4 className="font-semibold">Hand position:</h4>
                      <ul className="ml-4 space-y-1">
                        <li>• Place the heel of one hand on the center of the chest (lower half of the sternum)</li>
                        <li>• Place the other hand on top, fingers interlaced</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Posture:</h4>
                      <ul className="ml-4 space-y-1">
                        <li>• Kneel close, shoulders directly above hands</li>
                        <li>• Keep arms straight, push with your body weight</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Technique:</h4>
                      <ul className="ml-4 space-y-1">
                        <li>• <strong>Depth:</strong> compress 5–6 cm (2–2.5 inches) in adults</li>
                        <li>• <strong>Rate:</strong> about 100–120 compressions per minute</li>
                        <li>• Let the chest fully recoil after each compression</li>
                        <li>• <strong>Avoid interruptions—minimize pauses at all costs</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Rescue Breaths */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">4. Rescue Breaths (if trained and willing)</h3>
                  <div className="text-slate-700 space-y-3">
                    <p>• After 30 compressions, give 2 rescue breaths</p>
                    <div>
                      <h4 className="font-semibold">Technique:</h4>
                      <ul className="ml-4 space-y-1">
                        <li>• Open airway: tilt head back, lift chin</li>
                        <li>• Pinch nose shut, seal your mouth over the victim's mouth</li>
                        <li>• Deliver a breath just until you see the chest rise</li>
                        <li>• Each breath should last about 1 second</li>
                      </ul>
                    </div>
                    <p>• <strong>If not trained / unwilling → continue hands-only CPR (compressions only)</strong></p>
                  </div>
                </div>

                {/* CPR Cycle */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">5. CPR Cycle</h3>
                  <div className="text-slate-700 space-y-2">
                    <p>• <strong>Standard cycle: 30 compressions : 2 breaths</strong></p>
                    <p>• Continue cycles until:</p>
                    <ul className="ml-4 space-y-1">
                      <li>- Victim shows signs of life (normal breathing / movement)</li>
                      <li>- An AED is available and ready</li>
                      <li>- Professional rescuers take over</li>
                      <li>- You are too exhausted to continue</li>
                    </ul>
                  </div>
                </div>

                {/* AED Use */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">6. AED Use</h3>
                  <div className="text-slate-700 space-y-2">
                    <p>• <strong>AED = Automated External Defibrillator</strong></p>
                    <p>• Purpose: delivers a controlled electric shock to restore a normal heart rhythm</p>
                    <p>• As soon as an AED arrives:</p>
                    <ul className="ml-4 space-y-1">
                      <li>- Turn it on, follow voice prompts</li>
                      <li>- Attach pads as instructed</li>
                      <li>- Resume CPR immediately after shock is delivered (or if advised)</li>
                    </ul>
                  </div>
                </div>

                {/* Key Principles */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">7. Key Principles to Remember</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>• CPR buys time by keeping blood flowing to the brain and heart until professional help arrives</li>
                    <li>• <strong>High-quality compressions are the most critical factor in survival</strong></li>
                    <li>• Do not be afraid to act — doing something is far better than doing nothing</li>
                    <li>• <strong>CPR can double or triple survival chances in cardiac arrest</strong></li>
                  </ul>
                </div>

                {/* How to Use Guide */}
                <div className="bg-slate-100 border border-slate-300 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                    <FontAwesomeIcon icon={faSquareCheck} className="text-slate-600" />
                    How to Use This Study Guide
                  </h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>• <strong>Memorize numbers:</strong> 30:2 ratio, 5–6 cm depth, 100–120/min rate</li>
                    <li>• <strong>Focus on sequence:</strong> Check safety → Check response → Call for help → CPR → AED</li>
                    <li>• <strong>Understand why:</strong> compressions = blood flow, breaths = oxygen, AED = restart rhythm</li>
                    <li>• <strong>Use the guide as a cheat sheet to review before the quiz</strong></li>
                  </ul>
                </div>

                {/* Retention Toolkit */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-slate-600" />
                      Retention Toolkit
                    </h3>
                    <span className="text-xs text-slate-500">Tap topics to review later and keep practicing on tough areas.</span>
                  </div>
                  {reminderEnabled && (
                    <div className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                      Weekly review reminders are on. We'll surface your saved topics the next time you visit.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {quizCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleBookmark(category)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition ${reviewBookmarks.includes(category) ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {reviewBookmarks.includes(category) ? 'Saved • ' : ''}{category}
                      </button>
                    ))}
                  </div>

                  {dailyChallenge && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-800">Daily Challenge</p>
                          <p className="mt-1">{dailyChallenge.question}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDailyAnswer((prev) => !prev)}
                          className="text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-lg transition"
                        >
                          {showDailyAnswer ? 'Hide answer' : 'Reveal answer'}
                        </button>
                      </div>
                      {showDailyAnswer && (
                        <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3 text-slate-700">
                          <p className="font-semibold text-slate-800">Answer: {dailyChallenge.options[dailyChallenge.correct]}</p>
                          <p className="text-xs text-slate-500 mt-2">{dailyChallenge.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <FlashcardDeck
                  cards={cprFlashcards}
                  title="CPR Essentials Flashcards"
                  subtitle="Tap a card to flip it, then move forward or back to keep the cadence fresh."
                />

                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 mt-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-slate-600" />
                      Retention Toolkit
                    </h3>
                    <span className="text-xs text-slate-500">Tap topics to review later and keep practicing on tough areas.</span>
                  </div>
                  {reminderEnabled && (
                    <div className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                      Weekly review reminders are on. We'll surface your saved topics the next time you return.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {quizCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleBookmark(category)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition ${reviewBookmarks.includes(category) ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {reviewBookmarks.includes(category) ? 'Saved • ' : ''}{category}
                      </button>
                    ))}
                  </div>

                  {dailyChallenge && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-800">Daily Challenge</p>
                          <p className="mt-1">{dailyChallenge.question}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDailyAnswer((prev) => !prev)}
                          className="text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-lg transition"
                        >
                          {showDailyAnswer ? 'Hide answer' : 'Reveal answer'}
                        </button>
                      </div>
                      {showDailyAnswer && (
                        <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3 text-slate-700">
                          <p className="font-semibold text-slate-800">Answer: {dailyChallenge.options[dailyChallenge.correct]}</p>
                          <p className="text-xs text-slate-500 mt-2">{dailyChallenge.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )

      case 'quiz':
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">CPR Knowledge Quiz</h2>
            {!showQuizResults ? (
              <div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">
                      Question {currentQuestion + 1} of {quizQuestions.length}
                    </span>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">{quizQuestions[currentQuestion].question}</h3>
                    <div className="space-y-3">
                      {quizQuestions[currentQuestion].options.map((option, i) => {
                        let buttonClass = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        if (showQuestionFeedback) {
                          if (i === quizQuestions[currentQuestion].correct) {
                            buttonClass = 'border-green-500 bg-green-50'
                          } else if (selectedAnswer === i) {
                            buttonClass = 'border-red-500 bg-red-50'
                          }
                        } else if (selectedAnswer === i) {
                          buttonClass = 'border-blue-500 bg-blue-50'
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => !showQuestionFeedback && handleAnswerSelect(i)}
                            disabled={showQuestionFeedback}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${buttonClass} ${
                              showQuestionFeedback ? 'cursor-default' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                showQuestionFeedback
                                  ? i === quizQuestions[currentQuestion].correct
                                    ? 'border-green-500 bg-green-500'
                                    : selectedAnswer === i
                                    ? 'border-red-500 bg-red-500'
                                    : 'border-gray-300'
                                  : selectedAnswer === i 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {((showQuestionFeedback && i === quizQuestions[currentQuestion].correct) || 
                                  (!showQuestionFeedback && selectedAnswer === i) ||
                                  (showQuestionFeedback && selectedAnswer === i)) && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                              <span className="text-gray-900">
                                {String.fromCharCode(65 + i)}. {option}
                                {showQuestionFeedback && i === quizQuestions[currentQuestion].correct && (
                                  <span className="ml-2 text-green-600 font-semibold">Correct</span>
                                )}
                                {showQuestionFeedback && selectedAnswer === i && i !== quizQuestions[currentQuestion].correct && (
                                  <span className="ml-2 text-red-600 font-semibold">Your Answer</span>
                                )}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {showQuestionFeedback && (
                      <div className={`mt-4 p-4 rounded-lg border-l-4 ${
                        selectedAnswer === quizQuestions[currentQuestion].correct 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-red-50 border-red-400'
                      }`}>
                        <h4 className={`font-semibold mb-2 ${
                          selectedAnswer === quizQuestions[currentQuestion].correct 
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          {selectedAnswer === quizQuestions[currentQuestion].correct ? 'Correct!' : 'Incorrect'}
                        </h4>
                        <p className={`${
                          selectedAnswer === quizQuestions[currentQuestion].correct 
                            ? 'text-green-700' 
                            : 'text-red-700'
                        }`}>
                          {quizQuestions[currentQuestion].explanation}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={handlePrevQuestion}
                      disabled={currentQuestion === 0}
                      className={`px-6 py-3 rounded-lg transition-colors ${
                        currentQuestion === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswer === null}
                      className={`px-6 py-3 rounded-lg transition-colors ${
                        selectedAnswer !== null
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {showQuestionFeedback 
                        ? (currentQuestion + 1 === quizQuestions.length ? 'Finish Quiz' : 'Next Question')
                        : 'Submit Answer'
                      }
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="text-4xl mb-4"><FontAwesomeIcon icon={quizScore >= 70 ? faCheckCircle : faBook} /></div>
                <h3 className="text-xl font-bold mb-2">
                  {quizScore >= 70 ? 'Great Job!' : 'Keep Learning!'}
                </h3>
                <p className="text-gray-600 mb-4">
                  You scored {Math.round((selectedAnswers.filter((answer, index) => answer === quizQuestions[index].correct).length / quizQuestions.length) * 100)}% ({selectedAnswers.filter((answer, index) => answer === quizQuestions[index].correct).length} out of {quizQuestions.length} correct)
                </p>
                {quizScore >= 70 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-700">
                      Excellent! You've demonstrated solid understanding of CPR fundamentals. You're ready to proceed to the practice session.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700">
                      You may want to review the key points before proceeding. A score of 70% or higher is recommended.
                    </p>
                  </div>
                )}
                {/* Quiz Statistics */}
                <div className="mt-8 grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-slate-800">{selectedAnswers.filter((answer, index) => answer === quizQuestions[index].correct).length}</div>
                    <div className="text-sm text-slate-600 mt-1">Correct Answers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-800">{getWrongAnswersAnalysis().length}</div>
                    <div className="text-sm text-slate-600 mt-1">Incorrect Answers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-800">{Math.round((selectedAnswers.filter((answer, index) => answer === quizQuestions[index].correct).length / quizQuestions.length) * 100)}%</div>
                    <div className="text-sm text-slate-600 mt-1">Overall Score</div>
                  </div>
                </div>

                {/* Performance by Category */}
                {(() => {
                  const categoryStats: Record<string, { total: number; correct: number }> = {}
                  quizQuestions.forEach((q, index) => {
                    const category = q.category
                    if (!categoryStats[category]) {
                      categoryStats[category] = { total: 0, correct: 0 }
                    }
                    categoryStats[category].total++
                    if (selectedAnswers[index] === q.correct) {
                      categoryStats[category].correct++
                    }
                  })
                  
                  return (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faChartBar} className="text-slate-600" />
                        Performance by Category
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(categoryStats).map(([category, stats]) => {
                          const percentage = Math.round((stats.correct / stats.total) * 100)
                          return (
                            <div key={category}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-slate-800">{category}</span>
                                <span className="text-sm text-slate-600">{stats.correct}/{stats.total} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    percentage >= 80 ? 'bg-green-500' : 
                                    percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Detailed Analysis */}
                <div className="mt-8">
                  <button
                    onClick={() => setExpandedAnalysis(!expandedAnalysis)}
                    className="flex items-center gap-2 text-lg font-semibold text-slate-800 hover:text-slate-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={expandedAnalysis ? faChevronDown : faChevronRight} className="text-slate-600" />
                    <FontAwesomeIcon icon={faBookOpen} className="text-slate-600" />
                    Detailed Analysis ({quizQuestions.length} questions)
                  </button>
                  
                  {expandedAnalysis && (
                    <div className="mt-6 space-y-3">
                      {quizQuestions.map((question, index) => {
                        const isCorrect = selectedAnswers[index] === question.correct
                        const isExpanded = expandedQuestions.includes(index)
                        
                        return (
                          <div key={index} className="border border-slate-200 rounded-lg">
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedQuestions(expandedQuestions.filter(i => i !== index))
                                } else {
                                  setExpandedQuestions([...expandedQuestions, index])
                                }
                              }}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FontAwesomeIcon 
                                  icon={isCorrect ? faCheck : faXmark} 
                                  className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
                                />
                                <span className="font-medium text-slate-800">Question {index + 1}</span>
                                <span className="text-slate-600 text-sm truncate">{question.question}</span>
                              </div>
                              <FontAwesomeIcon 
                                icon={isExpanded ? faChevronDown : faChevronRight} 
                                className="text-slate-400 text-sm"
                              />
                            </button>
                            
                            {isExpanded && (
                              <div className="p-6 border-t border-slate-200 bg-slate-50">
                                <h5 className="font-semibold text-slate-800 mb-4">{question.question}</h5>
                                <div className="space-y-3 text-sm">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <span className="font-medium text-red-700">Your Answer:</span>
                                    <span className="text-red-600 ml-2">{question.options[selectedAnswers[index]]}</span>
                                  </div>
                                  {!isCorrect && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <span className="font-medium text-green-700">Correct Answer:</span>
                                      <span className="text-green-600 ml-2">{question.options[question.correct]}</span>
                                    </div>
                                  )}
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <span className="font-medium text-blue-700">Category:</span>
                                    <span className="text-blue-600 ml-2">{question.category}</span>
                                  </div>
                                  <div className="bg-slate-100 border border-slate-300 rounded-lg p-3">
                                    <span className="font-medium text-slate-700">Explanation:</span>
                                    <p className="text-slate-600 mt-1">{question.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {getStudyRecommendations().length > 0 && (
                  <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-blue-600" />
                      Study Recommendations
                    </h4>
                    <div className="space-y-4 text-left">
                      {getStudyRecommendations().map((item, index) => (
                        <div key={index}>
                          <div className="font-medium text-blue-800 mb-1">{item.category}</div>
                          <div className="text-blue-700 text-sm">{item.recommendation}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-blue-700 text-sm font-medium flex items-center gap-2">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                        Review the Study Guide above and retake the quiz when you're ready!
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={handleRetakeQuiz}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Retake Quiz
                  </button>
                  {quizScore >= 70 && (
                    <button
                      onClick={nextStep}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continue to Practice
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 'practice':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Interactive CPR Practice</h2>
              <button
                onClick={() => {
                  setSimulationFullscreen(true)
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                type="button"
              >
                <FontAwesomeIcon icon={faExpand} />
                Full Screen
              </button>
            </div>

            {!isSimulationFullscreen && (
              <>
                <div className="transition-all duration-300">
                  <CPRSimulation
                    currentStep={simulationStep}
                    onStepComplete={handleSimulationStepComplete}
                    sceneViewTime={sceneViewTime}
                    setSceneViewTime={setSceneViewTime}
                    handsPlaced={handsPlaced}
                    setHandsPlaced={setHandsPlaced}
                    compressionCount={compressionCount}
                    setCompressionCount={setCompressionCount}
                    compressionRate={compressionRate}
                    setCompressionRate={setCompressionRate}
                    compressionFailed={compressionFailed}
                    setCompressionFailed={setCompressionFailed}
                    compressionTimes={compressionTimes}
                    setCompressionTimes={setCompressionTimes}
                    onFeedback={handleCompressionFeedback}
                  />
                </div>

                {moduleCompleted ? (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg mt-6">
                    <p className="text-green-800">
                      <strong>Congratulations!</strong> You have successfully completed the CPR practice simulation. You've learned all the essential steps for performing CPR.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-[120vh] bg-slate-50/30">
      {notifications.length > 0 && (
        <div className="badge-toast-container">
          {notifications.map((toast) => (
            <div key={toast.id} className="badge-toast">
              <div className="badge-toast-icon">{toast.icon}</div>
              <div className="badge-toast-content">
                <div className="badge-toast-title">{toast.label}</div>
                {toast.message && <div className="badge-toast-message">{toast.message}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {badgePanel}
      {/* Practice step with special layout */}
      {currentStep === 3 ? (
        <div className="min-h-[130vh] bg-slate-50/30" style={{backgroundColor: '#f8fafc'}}>
          <BackButton elevation={isSimulationFullscreen ? 'baseline' : 'overlay'} />
          {/* Module Header */}
          <div className="mb-10" style={{ marginTop: '-3.2rem', position: 'relative', zIndex: isSimulationFullscreen ? 1 : 2147483646 }}>
            <div className="container mx-auto py-4">
              <div className="flex items-start justify-between gap-6">
                {/* Title Section */}
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">CPR Training Module</h1>
                  <p className="text-muted">{steps[currentStep].title}</p>
                </div>

                {/* Progress Bar */}
                <div className="text-right">
                  <div className="text-sm text-muted mb-2">Progress</div>
                  <div className="w-48 bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-slate-700 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content with two-column layout */}
          <div className="container mx-auto py-12 mt-8 mb-32">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-6">
              {/* Center content area */}
              <div className="flex-1" style={{ maxWidth: isSimulationFullscreen ? '100%' : '75%' }}>
                <div className="card-module">
                  <div className="p-12">
                    {renderStepContent()}
                  </div>

                  {/* Navigation */}
                  <div className="px-12 pb-12">
                    <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                      <div className="flex space-x-3">
                        {currentStep > 0 && (
                          <button onClick={prevStep} className="btn-secondary">
                            ← Previous
                          </button>
                        )}
                        <Link
                          to="/"
                          className="btn-secondary"
                          onClick={() => {
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }, 100)
                          }}
                        >
                          Back to Home
                        </Link>
                      </div>

                      {currentStep < steps.length - 1 ? (
                        <button
                          onClick={nextStep}
                          className="btn-primary"
                        >
                          Continue →
                        </button>
                      ) : (
                        <Link
                          to="/"
                          className="btn-primary"
                          onClick={() => {
                            // Mark module as completed when user clicks Complete Module
                            if (currentStep === 3) {
                              setModuleCompleted(true)
                              // Also save to localStorage immediately
                              const existingProgress = localStorage.getItem('cpr-training-progress')
                              if (existingProgress) {
                                const progress = JSON.parse(existingProgress)
                                progress.moduleCompleted = true
                                localStorage.setItem('cpr-training-progress', JSON.stringify(progress))
                              }
                            }
                          }}
                        >
                          Complete Module
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar - Instructions */}
              {renderPracticeSidebar('normal')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Normal layout for other steps
        <div>
          <BackButton elevation={isSimulationFullscreen ? 'baseline' : 'overlay'} />
          {/* Module Header */}
          <div className="mb-10" style={{ marginTop: '-3.2rem', position: 'relative', zIndex: isSimulationFullscreen ? 1 : 2147483646 }}>
            <div className="container mx-auto py-4">
              <div className="flex items-start justify-between">
                {/* Title Section */}
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">CPR Training Module</h1>
                  <p className="text-muted">{steps[currentStep].title}</p>
                </div>

                {/* Progress Bar */}
                <div className="text-right ml-auto">
                  <div className="text-sm text-muted mb-2">Progress</div>
                  <div className="w-48 bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-slate-700 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto py-12 mt-8 mb-32">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-6">
                {/* Main Content Area */}
                <div className="flex-1" style={{ position: 'relative', zIndex: 1 }}>
                <div className="card-module">
                  <div className="p-12">
                    {renderStepContent()}
                  </div>
                
                    {/* Navigation */}
                    <div className="px-12 pb-12">
                      <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                        <div className="flex space-x-3">
                          {currentStep > 0 && (
                            <button onClick={prevStep} className="btn-secondary">
                              ← Previous
                            </button>
                          )}
                          <Link 
                            to="/" 
                            className="btn-secondary"
                            onClick={() => {
                              setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }, 100)
                            }}
                          >
                            Back to Home
                          </Link>
                        </div>
                        
                        {currentStep < steps.length - 1 ? (
                          <button 
                            onClick={nextStep} 
                            className="btn-primary"
                          >
                            Continue →
                          </button>
                        ) : (
                          <Link 
                            to="/" 
                            className="btn-primary"
                            onClick={() => {
                              // Mark module as completed when user clicks Complete Module
                              if (currentStep === 3) {
                                setModuleCompleted(true)
                                // Also save to localStorage immediately
                                const existingProgress = localStorage.getItem('cpr-training-progress')
                                if (existingProgress) {
                                  const progress = JSON.parse(existingProgress)
                                  progress.moduleCompleted = true
                                  localStorage.setItem('cpr-training-progress', JSON.stringify(progress))
                                }
                              }
                            }}
                          >
                            Complete Module 
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Chatbot Sidebar */}
                {!isSimulationFullscreen && (
                  <div className="w-80 flex-shrink-0" style={{ position: 'relative', zIndex: 9999999, pointerEvents: 'auto' }}>
                    <SimpleChatbot
                      moduleContext={moduleContext}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom spacer for extra scrolling space */}
          <div className="h-20"></div>
        </div>
      )}

      {fullscreenOverlay}
    </div>
  )
}

export default CPRTraining
