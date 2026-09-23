import type { PracticeDefinition } from './practice-types'

export type PracticeActions = Record<string, number>

/** Only an ordered sequence of known, bounded action counts is resumable. */
export function restorePracticeActions(definition: PracticeDefinition, saved: unknown): PracticeActions {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
  const values = saved as Record<string, unknown>
  const actions: PracticeActions = {}
  for (const step of definition.steps) {
    const count = values[step.id]
    const required = step.repetitions ?? 1
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > required) break
    if (count > 0) actions[step.id] = count
    if (count !== required) break
  }
  return actions
}

export function practiceIsComplete(definition: PracticeDefinition, actions: PracticeActions): boolean {
  return definition.steps.every(step => actions[step.id] === (step.repetitions ?? 1))
}

export function performPracticeAction(definition: PracticeDefinition, actions: PracticeActions, stepId: string, targetId: string): PracticeActions {
  const current = restorePracticeActions(definition, actions)
  const step = definition.steps.find(item => (current[item.id] ?? 0) < (item.repetitions ?? 1))
  if (!step || step.id !== stepId || !step.targets.some(target => target.id === targetId && target.correct)) return current
  return { ...current, [step.id]: (current[step.id] ?? 0) + 1 }
}
