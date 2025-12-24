// API utility functions for campus first aid app

const API_BASE_URL = import.meta.env.PROD
  ? '' // Use relative URLs in production (Vercel handles routing)
  : 'http://localhost:5174' // Development server

export interface TrainingModule {
  id: string
  title: string
  description: string
  stepCount?: number
  steps?: TrainingStep[]
}

export type TrainingContent = Record<string, unknown> | unknown[] | null

export interface TrainingStep {
  id: string
  title: string
  description: string
  content: TrainingContent
}

export interface UserProgress {
  completed: boolean
  currentStep: number
  score: number
  startedAt?: string
  completedAt?: string
  steps: Record<string, unknown>
}

// Fetch all training modules
export async function getTrainingModules(): Promise<TrainingModule[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/training`)
    if (!response.ok) {
      throw new Error('Failed to fetch training modules')
    }
    return (await response.json()) as TrainingModule[]
  } catch (error) {
    console.error('Error fetching training modules:', error)
    // Return fallback data
    return [
      {
        id: 'cpr',
        title: 'CPR Training',
        description: 'Cardiopulmonary Resuscitation',
        stepCount: 4
      },
      {
        id: 'heimlich',
        title: 'Heimlich Maneuver',
        description: 'Choking Response',
        stepCount: 4
      }
    ]
  }
}

// Fetch specific training module
export async function getTrainingModule(moduleId: string): Promise<TrainingModule | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/training?moduleId=${moduleId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch module: ${moduleId}`)
    }
    return (await response.json()) as TrainingModule
  } catch (error) {
    console.error(`Error fetching module ${moduleId}:`, error)
    return null
  }
}

// Get user progress for a module
export async function getUserProgress(userId: string, moduleId?: string): Promise<UserProgress | Record<string, UserProgress>> {
  try {
    const url = moduleId 
      ? `${API_BASE_URL}/api/progress?userId=${userId}&moduleId=${moduleId}`
      : `${API_BASE_URL}/api/progress?userId=${userId}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch user progress')
    }
    return (await response.json()) as UserProgress | Record<string, UserProgress>
  } catch (error) {
    console.error('Error fetching user progress:', error)
    // Return default progress
    return moduleId ? {
      completed: false,
      currentStep: 0,
      score: 0,
      steps: {}
    } : {}
  }
}

// Update user progress
export async function updateUserProgress(
  userId: string, 
  moduleId: string, 
  stepId?: string, 
  data?: Record<string, unknown>
): Promise<UserProgress> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        moduleId,
        stepId,
        data
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update user progress')
    }
    
    return (await response.json()) as UserProgress
  } catch (error) {
    console.error('Error updating user progress:', error)
    throw error
  }
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    return response.ok
  } catch (error) {
    console.error('Health check failed:', error)
    return false
  }
}
