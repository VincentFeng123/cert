import { heimlichPractice } from './heimlich.ts'
import { gunViolencePractice } from './gun-violence.ts'
import { domesticViolencePractice } from './domestic-violence.ts'
import type { PracticeDefinition } from '../../lib/practice-types'

export const practiceDefinitions: Record<string, PracticeDefinition> = {
  heimlich: heimlichPractice,
  'gun-violence': gunViolencePractice,
  'domestic-violence': domesticViolencePractice,
}

export function getPracticeDefinition(slug: string): PracticeDefinition {
  const definition = practiceDefinitions[slug]
  if (!definition) throw new Error(`Unknown practice module: ${slug}`)
  return definition
}
