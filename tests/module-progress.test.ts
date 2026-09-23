import assert from 'node:assert/strict'
import { test } from 'node:test'
import { freshProgress, restoreTrainingProgress, scoreTrainingQuiz } from '../src/lib/module-progress.ts'
import { domesticViolenceModule, gunViolenceModule, heimlichModule } from '../src/data/trainingModules.ts'
import { getPracticeDefinition } from '../src/data/practice/index.ts'

const modules = [heimlichModule, gunViolenceModule, domesticViolenceModule]

test('malformed, unrelated, and outdated saved data restore to a safe fresh session', () => {
  for (const module of modules) {
    for (const raw of [null, '{invalid', 'null', '[]', '42', '"string"', '{"version":0,"moduleCompleted":true}', '{"currentStep":3,"quizScore":100,"moduleCompleted":true}']) {
      assert.deepEqual(restoreTrainingProgress(module, raw), freshProgress(module))
    }
  }
})

test('invalid question, stage, and scenario values cannot create completion', () => {
  for (const module of modules) {
    const restored = restoreTrainingProgress(module, JSON.stringify({ ...freshProgress(module), currentStep: 999, overviewRead: 'true', guideRead: true, quizAnswers: [-1, 999, '1', null, 0.5], quizSubmitted: true, passedQuizAnswers: [999, 999, 999, 999, 999], completedScenarioIds: ['invented', 'invented'], moduleCompleted: true }))
    assert.equal(restored.currentStep, 0)
    assert.equal(restored.overviewRead, false)
    assert.equal(restored.quizSubmitted, false)
    assert.deepEqual(restored.quizAnswers, [null, null, null, null, null])
    assert.deepEqual(restored.passedQuizAnswers, [])
    assert.deepEqual(restored.completedScenarioIds, [])
    assert.equal(restored.moduleCompleted, false)
  }
})

test('completion requires lessons, a passing quiz, every scenario, and every 3D practice action', () => {
  for (const module of modules) {
    const practiceActions = Object.fromEntries(getPracticeDefinition(module.slug).steps.map(step => [step.id, step.repetitions ?? 1]))
    const valid = { ...freshProgress(module), currentStep: 3, overviewRead: true, guideRead: true, passedQuizAnswers: module.quiz.map(question => question.correct), completedScenarioIds: module.scenarios.map(scenario => scenario.id), practiceActions, moduleCompleted: true }
    assert.equal(restoreTrainingProgress(module, JSON.stringify(valid)).moduleCompleted, true)
    for (const incomplete of [{ overviewRead: false }, { guideRead: false }, { passedQuizAnswers: [] }, { completedScenarioIds: [] }, { completedScenarioIds: [module.scenarios[0].id, module.scenarios[0].id] }, { practiceActions: {} }]) {
      assert.equal(restoreTrainingProgress(module, JSON.stringify({ ...valid, ...incomplete })).moduleCompleted, false)
    }
  }
})

test('existing version-one lessons and scenarios survive migration without claiming new 3D completion', () => {
  for (const module of modules) {
    const saved = { ...freshProgress(module), version: 1, currentStep: 3, overviewRead: true, guideRead: true, passedQuizAnswers: module.quiz.map(question => question.correct), completedScenarioIds: module.scenarios.map(scenario => scenario.id), moduleCompleted: true }
    const restored = restoreTrainingProgress(module, JSON.stringify(saved))
    assert.equal(restored.version, 2)
    assert.equal(restored.overviewRead, true)
    assert.equal(restored.guideRead, true)
    assert.deepEqual(restored.passedQuizAnswers, saved.passedQuizAnswers)
    assert.deepEqual(restored.completedScenarioIds, saved.completedScenarioIds)
    assert.deepEqual(restored.practiceActions, {})
    assert.equal(restored.moduleCompleted, false)
  }
})

test('scores come from actual answers and the passing threshold is 80 percent', () => {
  for (const module of modules) {
    const answers = module.quiz.map(question => question.correct)
    assert.equal(scoreTrainingQuiz(module, answers), 100)
    answers[0] = (answers[0] + 1) % module.quiz[0].options.length
    assert.equal(scoreTrainingQuiz(module, answers), 80)
    assert.equal(restoreTrainingProgress(module, JSON.stringify({ ...freshProgress(module), passedQuizAnswers: answers })).passedQuizAnswers.length, 5)
    answers[1] = (answers[1] + 1) % module.quiz[1].options.length
    assert.equal(scoreTrainingQuiz(module, answers), 60)
    assert.equal(restoreTrainingProgress(module, JSON.stringify({ ...freshProgress(module), quizScore: 100, passedQuizAnswers: answers })).passedQuizAnswers.length, 0)
  }
})

test('scenario decisions have complete, reachable success paths without cycles', () => {
  for (const module of modules) {
    for (const scenario of module.scenarios) {
      const reachable = new Set<string>()
      const visit = (id: string, ancestors: string[]) => {
        assert.ok(!ancestors.includes(id), `${scenario.id}: cycle in ${id}`)
        const decision = scenario.decisions.find(item => item.id === id)
        assert.ok(decision, `${scenario.id}: missing decision ${id}`)
        reachable.add(id)
        const correctChoices = decision.choices.filter(choice => choice.correct)
        assert.ok(correctChoices.length > 0, `${scenario.id}: no safe response for ${id}`)
        for (const choice of correctChoices) if (choice.next) visit(choice.next, [...ancestors, id])
        for (const choice of decision.choices) assert.ok(choice.feedback.length > 0)
      }
      visit(scenario.decisions[0].id, [])
      assert.equal(reachable.size, scenario.decisions.length, `${scenario.id}: unreachable decision`)
    }
  }
})

test('quiz position and checked-answer feedback survive a reload', () => {
  const module = heimlichModule
  const saved = { ...freshProgress(module), currentStep: 2, currentQuestion: 2, quizAnswers: [1, 0, 2, null, null], showQuestionFeedback: true }
  const restored = restoreTrainingProgress(module, JSON.stringify(saved))
  assert.equal(restored.currentQuestion, 2)
  assert.equal(restored.showQuestionFeedback, true)
  assert.equal(restored.quizSubmitted, false)
  assert.deepEqual(restored.quizAnswers, saved.quizAnswers)
  const invalid = restoreTrainingProgress(module, JSON.stringify({ ...saved, currentQuestion: 99, quizAnswers: [null, null, null, null, null] }))
  assert.equal(invalid.currentQuestion, 0)
  assert.equal(invalid.showQuestionFeedback, false)
})
