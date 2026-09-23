export type PracticeTarget = { id: string; label: string; correct: boolean; feedback: string }
export type PracticeStep = {
  id: string
  title: string
  instruction: string
  targets: PracticeTarget[]
  repetitions?: number
  motionMs?: number
  success: string
}
export type PracticeDefinition = {
  slug: 'heimlich' | 'gun-violence' | 'domestic-violence'
  title: string
  introduction: string
  scope: string
  steps: PracticeStep[]
}
export type PracticeSceneProps = {
  stepId: string
  actionCount: number
  completed: boolean
  motionEnabled: boolean
  activeTargetIds: string[]
  onTarget: (id: string) => void
}
