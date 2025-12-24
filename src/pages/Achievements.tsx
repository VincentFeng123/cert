import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faLock } from '@fortawesome/free-solid-svg-icons'

type CprProgress = {
  currentStep?: number
  moduleCompleted?: boolean
  showQuizResults?: boolean
  quizScore?: number
  reminderEnabled?: boolean
  reviewBookmarks?: string[]
  simulationStep?: number
  compressionCount?: number
  compressionFailed?: boolean
}

type HeimlichProgress = {
  currentStep?: number
  quizScore?: number
  showQuizResults?: boolean
}

type Badge = {
  id: string
  label: string
  description: string
  earned: boolean
  icon: string
  module: 'overall' | 'cpr' | 'heimlich'
}

const parseStoredJson = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Failed to parse stored progress:', error)
    return null
  }
}

const Achievements = () => {
  const [cprProgress, setCprProgress] = useState<CprProgress | null>(null)
  const [heimlichProgress, setHeimlichProgress] = useState<HeimlichProgress | null>(null)

  useEffect(() => {
    const storedCpr = parseStoredJson<CprProgress>(localStorage.getItem('cpr-training-progress'))
    const storedHeimlich = parseStoredJson<HeimlichProgress>(localStorage.getItem('heimlich-training-progress'))

    if (storedCpr) setCprProgress(storedCpr)
    if (storedHeimlich) setHeimlichProgress(storedHeimlich)
  }, [])

  const allBadges = useMemo(() => {
    const cprCompleted = Boolean(cprProgress?.moduleCompleted)
    const heimlichCompleted = (heimlichProgress?.currentStep ?? 0) >= 3
    const quizChampion = (cprProgress?.quizScore ?? 0) >= 90 || (heimlichProgress?.quizScore ?? 0) >= 100
    const studyHabit = (cprProgress?.reviewBookmarks?.length ?? 0) >= 3 || Boolean(cprProgress?.reminderEnabled)
    const trainingStarted = Boolean(cprProgress) || Boolean(heimlichProgress)

    const badges: Badge[] = [
      // Overall Achievements
      {
        id: 'dual-complete',
        label: 'First Aid Duo',
        description: 'Finish both CPR and Heimlich training modules.',
        earned: cprCompleted && heimlichCompleted,
        icon: '🏅',
        module: 'overall'
      },
      {
        id: 'quiz-champion',
        label: 'Quiz Champion',
        description: 'Score 90%+ on CPR or 100% on Heimlich knowledge quiz.',
        earned: quizChampion,
        icon: '🧠',
        module: 'overall'
      },
      {
        id: 'study-habit',
        label: 'Study Habit',
        description: 'Bookmark 3+ topics or enable weekly reminders.',
        earned: studyHabit,
        icon: '📘',
        module: 'overall'
      },
      {
        id: 'first-steps',
        label: 'First Steps',
        description: 'Begin your first aid journey by starting any module.',
        earned: trainingStarted,
        icon: '👟',
        module: 'overall'
      },

      // CPR Achievements
      {
        id: 'cpr-certified',
        label: 'CPR Certified',
        description: 'Complete every step of the interactive practice.',
        earned: cprProgress?.moduleCompleted ?? false,
        icon: '🏅',
        module: 'cpr'
      },
      {
        id: 'quiz-ace',
        label: 'Quiz Ace',
        description: 'Score 90% or higher on the CPR knowledge quiz.',
        earned: (cprProgress?.showQuizResults ?? false) && (cprProgress?.quizScore ?? 0) >= 90,
        icon: '🧠',
        module: 'cpr'
      },
      {
        id: 'study-habit-cpr',
        label: 'Study Habit',
        description: 'Enable weekly reminders or bookmark three study topics.',
        earned: (cprProgress?.reminderEnabled ?? false) || (cprProgress?.reviewBookmarks?.length ?? 0) >= 3,
        icon: '📘',
        module: 'cpr'
      },
      {
        id: 'practice-pro',
        label: 'Practice Pro',
        description: 'Complete 30 compressions at target pace without failing.',
        earned: cprProgress?.moduleCompleted || ((cprProgress?.simulationStep ?? 0) >= 3 && (cprProgress?.compressionCount ?? 0) >= 30 && !(cprProgress?.compressionFailed ?? true)),
        icon: '🫀',
        module: 'cpr'
      },
      {
        id: 'scene-guardian',
        label: 'Scene Guardian',
        description: 'Finish the full scene safety sweep before touching the patient.',
        earned: (cprProgress?.currentStep ?? 0) >= 1,
        icon: '👁️',
        module: 'cpr'
      },

      // Heimlich Achievements
      {
        id: 'heimlich-complete',
        label: 'Heimlich Hero',
        description: 'Work through all four Heimlich training stages.',
        earned: (heimlichProgress?.currentStep ?? 0) >= 3,
        icon: '🏅',
        module: 'heimlich'
      },
      {
        id: 'perfect-score',
        label: 'Quiz Perfect',
        description: 'Earn a perfect score on the Heimlich knowledge check.',
        earned: (heimlichProgress?.showQuizResults ?? false) && (heimlichProgress?.quizScore ?? 0) === 100,
        icon: '🧠',
        module: 'heimlich'
      },
      {
        id: 'video-ready',
        label: 'Prepared Responder',
        description: 'Complete the watch-and-learn tutorial.',
        earned: (heimlichProgress?.currentStep ?? 0) >= 1,
        icon: '🎬',
        module: 'heimlich'
      },
      {
        id: 'hands-on',
        label: 'Hands-On Ready',
        description: 'Attempt the practice simulation phase.',
        earned: (heimlichProgress?.currentStep ?? 0) >= 3,
        icon: '🤝',
        module: 'heimlich'
      },
    ]

    return {
      overall: {
        earned: badges.filter(b => b.module === 'overall' && b.earned),
        upcoming: badges.filter(b => b.module === 'overall' && !b.earned)
      },
      cpr: {
        earned: badges.filter(b => b.module === 'cpr' && b.earned),
        upcoming: badges.filter(b => b.module === 'cpr' && !b.earned)
      },
      heimlich: {
        earned: badges.filter(b => b.module === 'heimlich' && b.earned),
        upcoming: badges.filter(b => b.module === 'heimlich' && !b.earned)
      }
    }
  }, [cprProgress, heimlichProgress])

  const totalEarned = allBadges.overall.earned.length + allBadges.cpr.earned.length + allBadges.heimlich.earned.length
  const totalBadges = Object.values(allBadges).reduce((sum, group) => sum + group.earned.length + group.upcoming.length, 0)


  const renderBadgeSection = (title: string, badges: { earned: Badge[], upcoming: Badge[] }) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{title}</h2>

      {badges.earned.length > 0 ? (
        <>
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Earned</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {badges.earned.map((badge) => (
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
        </>
      ) : (
        <div className="text-center py-8 text-slate-400 text-sm">
          <FontAwesomeIcon icon={faTrophy} className="text-4xl mb-2 text-slate-300" />
          <p>No achievements yet!</p>
          <p className="text-xs mt-1">Complete tasks to earn badges</p>
        </div>
      )}

      {badges.upcoming.length > 0 && (
        <>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-5 mb-3">Locked</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {badges.upcoming.map((badge) => (
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
  )

  return (
    <div className="min-h-screen bg-slate-50/30 ml-56 py-16">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">Achievements</h1>
              <p className="text-muted max-w-2xl mx-auto">
                Track your progress across CPR and Heimlich training modules. Unlock badges by completing lessons, quizzes, and practice sessions.
              </p>
            </div>

            <div className="rounded-3xl p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Total Badges Earned</div>
                  <div className="text-3xl font-bold text-slate-800 mt-2">{totalEarned}</div>
                  <div className="text-xs text-muted mt-1">Out of {totalBadges} total badges</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide">CPR Progress</div>
                  <div className="text-3xl font-bold text-slate-800 mt-2">{allBadges.cpr.earned.length}</div>
                  <div className="text-xs text-muted mt-1">Badges earned in CPR module</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Heimlich Progress</div>
                  <div className="text-3xl font-bold text-slate-800 mt-2">{allBadges.heimlich.earned.length}</div>
                  <div className="text-xs text-muted mt-1">Badges earned in Heimlich module</div>
                </div>
              </div>

              {renderBadgeSection('Overall Achievements', allBadges.overall)}
              {renderBadgeSection('CPR Achievements', allBadges.cpr)}
              {renderBadgeSection('Heimlich Achievements', allBadges.heimlich)}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Achievements
