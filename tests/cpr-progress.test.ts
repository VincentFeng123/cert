import { test } from 'node:test'
import assert from 'node:assert/strict'
import { restoreCprProgress } from '../src/lib/cpr-progress.ts'
import { CPR_QUIZ_QUESTIONS } from '../src/lib/cpr-quiz.ts'
const questions = CPR_QUIZ_QUESTIONS
const passed = { currentStep: 3, showQuizResults: true, selectedAnswers: questions.map(question => question.correct) }
test('invalid or out-of-range stored progress recovers to a usable lesson', () => {
  for (const input of [null, [], 'bad', {currentStep: -1, currentQuestion: 999, selectedAnswer: 99, goal: 'bad'}, {currentStep: Infinity}]) {
    const restored = restoreCprProgress(input, questions)
    assert.equal(restored.currentStep, 0)
    assert.equal(restored.currentQuestion, 0)
    assert.equal(restored.selectedAnswer, null)
    assert.equal(restored.goal, 'confidence')
  }
})
test('stored score and old completion flags cannot bypass knowledge and practice', () => {
  const restored = restoreCprProgress({currentStep: 3, quizScore: 100, showQuizResults: true, moduleCompleted: true}, questions)
  assert.equal(restored.currentStep, 2)
  assert.equal(restored.quizScore, 0)
  assert.equal(restored.moduleCompleted, false)
  assert.equal(restoreCprProgress(passed, questions).moduleCompleted, false)
})
test('valid completion survives reload and first answer option is retained', () => {
  const restored = restoreCprProgress({...passed, version: 2, practiceCompleted: true, currentQuestion: 2, selectedAnswer: 0, showQuestionFeedback: true}, questions)
  assert.equal(restored.quizScore, 100)
  assert.equal(restored.moduleCompleted, true)
  assert.equal(restored.selectedAnswer, 0)
  assert.equal(restored.showQuestionFeedback, true)
})
test('an invalid saved answer invalidates results and locks practice', () => {
  const restored = restoreCprProgress({...passed, selectedAnswers: questions.map((question, index) => index === 2 ? 6 : question.correct)}, questions)
  assert.equal(restored.showQuizResults, false)
  assert.equal(restored.currentStep, 2)
})
