import type { TrainingModuleData } from '../data/trainingModules'
import { getPracticeDefinition } from '../data/practice/index.ts'
import { practiceIsComplete, restorePracticeActions, type PracticeActions } from './practice-progress.ts'

export type TrainingProgress = {
  version: 2
  currentStep: number
  overviewRead: boolean
  guideRead: boolean
  currentQuestion: number
  showQuestionFeedback: boolean
  quizAnswers: (number | null)[]
  quizSubmitted: boolean
  passedQuizAnswers: number[]
  completedScenarioIds: string[]
  practiceActions: PracticeActions
  moduleCompleted: boolean
}

export const scoreTrainingQuiz = (data: TrainingModuleData, answers: (number | null)[]) => Math.round(data.quiz.reduce((score, question, index) => score + (answers[index] === question.correct ? 1 : 0), 0) / data.quiz.length * 100)

export const freshProgress = (data: TrainingModuleData): TrainingProgress => ({ version: 2, currentStep: 0, overviewRead: false, guideRead: false, currentQuestion: 0, showQuestionFeedback: false, quizAnswers: data.quiz.map(() => null), quizSubmitted: false, passedQuizAnswers: [], completedScenarioIds: [], practiceActions: {}, moduleCompleted: false })

export const restoreTrainingProgress = (data: TrainingModuleData, raw: string | null): TrainingProgress => {
  const empty = freshProgress(data)
  if (!raw) return empty
  try {
    const saved: unknown = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return empty
    const value = saved as Record<string, unknown>
    if (value.version !== 1 && value.version !== 2) return empty
    const practice = getPracticeDefinition(data.slug)
    const practiceActions = value.version === 2 ? restorePracticeActions(practice, value.practiceActions) : {}
    const validateAnswers = (answers: unknown) => Array.isArray(answers) && answers.length === data.quiz.length && answers.every((answer, index) => Number.isInteger(answer) && answer >= 0 && answer < data.quiz[index].options.length)
    const quizAnswers = Array.isArray(value.quizAnswers) && value.quizAnswers.length === data.quiz.length ? value.quizAnswers.map((answer: unknown, index: number) => typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < data.quiz[index].options.length ? answer : null) : empty.quizAnswers
    const passedQuizAnswers = validateAnswers(value.passedQuizAnswers) && scoreTrainingQuiz(data, value.passedQuizAnswers as number[]) >= 80 ? value.passedQuizAnswers as number[] : []
    const completedScenarioIds = Array.isArray(value.completedScenarioIds) ? data.scenarios.filter(scenario => value.completedScenarioIds instanceof Array && value.completedScenarioIds.includes(scenario.id)).map(scenario => scenario.id) : []
    const currentStep = typeof value.currentStep === 'number' && Number.isInteger(value.currentStep) && value.currentStep >= 0 && value.currentStep < 4 ? value.currentStep : 0
    const currentQuestion = typeof value.currentQuestion === 'number' && Number.isInteger(value.currentQuestion) && value.currentQuestion >= 0 && value.currentQuestion < data.quiz.length ? value.currentQuestion : 0
    return {
      version: 2, currentStep, currentQuestion, showQuestionFeedback: value.showQuestionFeedback === true && quizAnswers[currentQuestion] !== null, overviewRead: value.overviewRead === true, guideRead: value.guideRead === true,
      quizAnswers, quizSubmitted: value.quizSubmitted === true && validateAnswers(quizAnswers), passedQuizAnswers, completedScenarioIds, practiceActions,
      moduleCompleted: value.moduleCompleted === true && value.overviewRead === true && value.guideRead === true && passedQuizAnswers.length === data.quiz.length && completedScenarioIds.length === data.scenarios.length && practiceIsComplete(practice, practiceActions),
    }
  } catch { return empty }
}
