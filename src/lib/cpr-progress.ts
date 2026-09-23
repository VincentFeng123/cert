type Question = { options: string[]; correct: number }
export function readLocal(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}
export function writeLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Practice remains usable when storage is unavailable. */ }
}
const bounded = (value: unknown, max: number) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max ? value : 0
export function restoreCprProgress(value: unknown, questions: Question[]) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const selectedAnswers = Array.isArray(raw.selectedAnswers) ? raw.selectedAnswers.slice(0, questions.length).map((answer, index) => Number.isInteger(answer) && answer >= 0 && answer < questions[index].options.length ? answer as number : -1) : []
  const showQuizResults = raw.showQuizResults === true && selectedAnswers.length === questions.length && selectedAnswers.every(answer => answer >= 0)
  const quizScore = showQuizResults ? Math.round(selectedAnswers.filter((answer, index) => answer === questions[index].correct).length / questions.length * 100) : 0
  const requestedStep = bounded(raw.currentStep, 3)
  const currentStep = requestedStep === 3 && !(showQuizResults && quizScore >= 70) ? 2 : requestedStep
  const currentQuestion = bounded(raw.currentQuestion, questions.length - 1)
  const selectedAnswer = typeof raw.selectedAnswer === 'number' && Number.isInteger(raw.selectedAnswer) && raw.selectedAnswer >= 0 && raw.selectedAnswer < questions[currentQuestion].options.length ? raw.selectedAnswer : null
  const practiceCompleted = raw.version === 2 && raw.practiceCompleted === true
  return {
    currentStep, currentQuestion, selectedAnswers, selectedAnswer, showQuizResults, quizScore,
    practiceCompleted,
    moduleCompleted: practiceCompleted && showQuizResults && quizScore >= 70,
    showQuestionFeedback: raw.showQuestionFeedback === true && selectedAnswer !== null,
    showVideo: raw.showVideo === true,
    voiceEnabled: raw.voiceEnabled === true,
    reminderEnabled: raw.reminderEnabled === true,
    goal: raw.goal === 'certification' || raw.goal === 'refresh' ? raw.goal : 'confidence' as 'confidence' | 'certification' | 'refresh',
    reviewBookmarks: Array.isArray(raw.reviewBookmarks) ? raw.reviewBookmarks.filter((item): item is string => typeof item === 'string').slice(0, 15) : [],
  }
}
