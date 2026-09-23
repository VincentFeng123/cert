import { useEffect, useState } from 'react'
import { faHeartPulse, faHandsHoldingCircle, faShieldHeart, faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons'
import { restoreCprProgress } from './cpr-progress'
import { CPR_QUIZ_QUESTIONS } from './cpr-quiz'
import { restoreTrainingProgress, scoreTrainingQuiz } from './module-progress'
import { heimlichModule, gunViolenceModule, domesticViolenceModule } from '../data/trainingModules'
import { getPracticeDefinition } from '../data/practice'
import { practiceIsComplete } from './practice-progress'

export const trainingModules = [
  { id: 'cpr', title: 'CPR Training', category: 'Cardiac emergencies', description: 'Build your understanding of CPR, then practice the response sequence in an interactive 3D scene.', path: '/cpr', storageKey: 'cpr-training-progress', practice: '3D practice', icon: faHeartPulse },
  { id: 'heimlich', title: 'Heimlich Maneuver', category: 'Choking response', description: 'Rehearse the choking response with animated 3D mannequins, then practice adapting care as the situation changes.', path: '/heimlich', storageKey: 'heimlich-training-progress', practice: '3D practice', icon: faHandsHoldingCircle },
  { id: 'gun-violence', title: 'Gun Violence Response', category: 'Emergency preparedness', description: 'Explore a 3D safety scene, choose an exit, move to safety, and rehearse communication with responders.', path: '/gun-violence', storageKey: 'gun-violence-training-progress', practice: '3D practice', icon: faShieldHeart },
  { id: 'domestic-violence', title: 'Domestic Violence Awareness', category: 'Recognition & support', description: 'Practice listening, respecting choices, and offering support in an interactive 3D conversation scene.', path: '/domestic-violence', storageKey: 'domestic-violence-training-progress', practice: '3D practice', icon: faHandHoldingHeart },
] as const

export type TrainingModuleId = typeof trainingModules[number]['id']
export type TrainingProgress = { currentStep: number; quizScore: number; showQuizResults: boolean; moduleCompleted: boolean; percent: number; quizPassed: boolean }
export type TrainingProgressMap = Record<TrainingModuleId, TrainingProgress | null>

export function readTrainingProgress(storageKey: string): TrainingProgress | null {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return null
    const value = stored as Record<string, unknown>
    if (typeof value.currentStep !== 'number' || !Number.isFinite(value.currentStep)) return null
    if (storageKey === 'cpr-training-progress') {
      const restored = restoreCprProgress(value, CPR_QUIZ_QUESTIONS)
      return { ...restored, percent: restored.moduleCompleted ? 100 : restored.currentStep * 25, quizPassed: restored.showQuizResults && restored.quizScore >= 70 }
    }
    const data = [heimlichModule, gunViolenceModule, domesticViolenceModule].find(module => `${module.slug}-training-progress` === storageKey)
    if (!data || (value.version !== 1 && value.version !== 2)) return null
    const restored = restoreTrainingProgress(data, JSON.stringify(stored))
    const quizPassed = restored.passedQuizAnswers.length === data.quiz.length
    const completedStages = [restored.overviewRead, restored.guideRead, quizPassed, restored.completedScenarioIds.length === data.scenarios.length && practiceIsComplete(getPracticeDefinition(data.slug), restored.practiceActions)]
    return { currentStep: restored.currentStep, moduleCompleted: restored.moduleCompleted, quizScore: scoreTrainingQuiz(data, restored.quizAnswers), showQuizResults: restored.quizSubmitted, percent: completedStages.filter(Boolean).length * 25, quizPassed }
  } catch {
    return null
  }
}

function readAllProgress(): TrainingProgressMap {
  return Object.fromEntries(trainingModules.map(module => [module.id, readTrainingProgress(module.storageKey)])) as TrainingProgressMap
}

export function useTrainingProgress() {
  const [progress, setProgress] = useState<TrainingProgressMap>(readAllProgress)
  useEffect(() => {
    const refresh = () => setProgress(readAllProgress())
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('training-progress-updated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('training-progress-updated', refresh)
    }
  }, [])
  return progress
}

export function getProgressPercent(progress: TrainingProgress | null): number {
  return progress?.percent ?? 0
}

export function getModuleAction(progress: TrainingProgress | null): string {
  if (progress?.moduleCompleted) return 'Review module'
  return progress ? 'Continue learning' : 'Start learning'
}

export function getModuleStage(progress: TrainingProgress | null): string {
  if (progress?.moduleCompleted) return 'Completed'
  if (!progress) return 'Not started'
  return ['Learn the essentials', 'Key points', 'Knowledge check', 'Practice'][progress.currentStep]
}
