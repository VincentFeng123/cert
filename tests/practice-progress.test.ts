import assert from 'node:assert/strict'
import { test } from 'node:test'
import { practiceDefinitions } from '../src/data/practice/index.ts'
import { performPracticeAction, practiceIsComplete, restorePracticeActions } from '../src/lib/practice-progress.ts'

for (const definition of Object.values(practiceDefinitions)) {
  test(`${definition.slug}: wrong and out-of-order actions never advance the sequence`, () => {
    const [first, second] = definition.steps
    assert.deepEqual(performPracticeAction(definition, {}, second.id, second.targets.find(target => target.correct)!.id), {})
    assert.deepEqual(performPracticeAction(definition, {}, first.id, 'not-a-target'), {})
    for (const wrong of first.targets.filter(target => !target.correct)) assert.deepEqual(performPracticeAction(definition, {}, first.id, wrong.id), {})
    assert.equal(practiceIsComplete(definition, {}), false)
  })

  test(`${definition.slug}: each physical or decision action is required and bounded`, () => {
    let actions = {}
    for (const step of definition.steps) {
      assert.equal(practiceIsComplete(definition, actions), false)
      const target = step.targets.find(item => item.correct)!
      for (let count = 0; count < (step.repetitions ?? 1); count++) actions = performPracticeAction(definition, actions, step.id, target.id)
      assert.deepEqual(performPracticeAction(definition, actions, step.id, target.id), actions, 'repeated finished-step input must not add counts')
    }
    assert.equal(practiceIsComplete(definition, actions), true)
    assert.deepEqual(restorePracticeActions(definition, actions), actions)
  })

  test(`${definition.slug}: storage corruption cannot skip a missing practice step`, () => {
    const complete = Object.fromEntries(definition.steps.map(step => [step.id, step.repetitions ?? 1]))
    const first = definition.steps[0]
    for (const corrupt of [null, [], 'done', { ...complete, [first.id]: 999 }, { ...complete, [first.id]: -1 }, { ...complete, [first.id]: '1' }, { ...complete, [first.id]: 0.5 }, { ...complete, [first.id]: undefined }]) {
      assert.deepEqual(restorePracticeActions(definition, corrupt), {})
    }
    const midway = { ...complete, [definition.steps[1].id]: 0 }
    assert.deepEqual(restorePracticeActions(definition, midway), { [first.id]: first.repetitions ?? 1 })
  })
}
