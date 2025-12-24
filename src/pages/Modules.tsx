import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeartPulse, faFistRaised, faCheckCircle, faPlay, faGun, faHandFist } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect, useMemo } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

type TrainingStatus = {
  text: string
  icon: IconDefinition
  completed: boolean
}

type CprProgress = {
  currentStep?: number
  moduleCompleted?: boolean
  showQuizResults?: boolean
  quizScore?: number
}

type HeimlichProgress = {
  currentStep?: number
  quizScore?: number
  showQuizResults?: boolean
}

const parseStoredJson = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Failed to parse stored progress:', error)
    return null
  }
}

const getCprStatus = (progress: CprProgress | null): TrainingStatus => {
  if (!progress) return { text: 'Start CPR Module', icon: faPlay, completed: false }

  if (progress.moduleCompleted) {
    return { text: 'Restart CPR Module', icon: faPlay, completed: true }
  }

  const currentStep = progress.currentStep ?? 0

  if (currentStep >= 3) {
    return { text: 'Continue CPR Module', icon: faPlay, completed: false }
  }

  if (currentStep === 2 && progress.showQuizResults && (progress.quizScore ?? 0) >= 70) {
    return { text: 'Continue CPR Module', icon: faPlay, completed: false }
  }

  return { text: 'Continue CPR Module', icon: faPlay, completed: false }
}

const getHeimlichStatus = (progress: HeimlichProgress | null): TrainingStatus => {
  if (!progress) return { text: 'Start Heimlich Module', icon: faPlay, completed: false }
  const currentStep = progress.currentStep ?? 0
  if (currentStep >= 3 && (progress.quizScore ?? 0) >= 70) {
    return { text: 'Heimlich Completed', icon: faCheckCircle, completed: true }
  }
  return { text: 'Continue Heimlich Module', icon: faPlay, completed: false }
}

const Modules = () => {
  const [cprProgress, setCprProgress] = useState<CprProgress | null>(null)
  const [heimlichProgress, setHeimlichProgress] = useState<HeimlichProgress | null>(null)

  useEffect(() => {
    // Load progress from localStorage
    const storedCpr = parseStoredJson<CprProgress>(localStorage.getItem('cpr-training-progress'))
    const storedHeimlich = parseStoredJson<HeimlichProgress>(localStorage.getItem('heimlich-training-progress'))

    if (storedCpr) {
      setCprProgress(storedCpr)
    }
    if (storedHeimlich) {
      setHeimlichProgress(storedHeimlich)
    }
  }, [])

  const cprStatus = useMemo(() => getCprStatus(cprProgress), [cprProgress])
  const heimlichStatus = useMemo(() => getHeimlichStatus(heimlichProgress), [heimlichProgress])

  return (
    <div className="min-h-screen bg-slate-50/30 ml-56">
      {/* Modules Section */}
      <section className="py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Training Modules
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Choose your learning path and start building life-saving skills
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* CPR Module */}
            <div className="card group transition-all duration-300">
              <div className="p-8">
                <div className="image-box inline-block mb-6">
                  <FontAwesomeIcon icon={faHeartPulse} className="text-4xl text-slate-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">CPR Training</h3>
                <h4 className="text-lg text-muted mb-4">Cardiopulmonary Resuscitation</h4>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Learn life-saving CPR techniques through interactive simulations and step-by-step guidance.
                </p>
                <Link
                  to="/cpr"
                  className={`w-full text-center block ${cprStatus.completed ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => {
                    // If it's a restart, reset the progress
                    if (cprStatus.text === 'Restart CPR Module') {
                      localStorage.removeItem('cpr-training-progress')
                    }
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                >
                  <FontAwesomeIcon icon={cprStatus.icon} className="mr-2" />
                  {cprStatus.text}
                </Link>
              </div>
            </div>

            {/* Heimlich Module */}
            <div className="card group transition-all duration-300">
              <div className="p-8">
                <div className="image-box inline-block mb-6">
                  <FontAwesomeIcon icon={faFistRaised} className="text-4xl text-slate-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">Heimlich Maneuver</h3>
                <h4 className="text-lg text-muted mb-4">Choking Response</h4>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Master the Heimlich maneuver with comprehensive training to respond effectively to choking emergencies.
                </p>
                <Link
                  to="/heimlich"
                  className={`w-full text-center block ${heimlichStatus.completed ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                >
                  <FontAwesomeIcon icon={heimlichStatus.icon} className="mr-2" />
                  {heimlichStatus.text}
                </Link>
              </div>
            </div>

            {/* Gun Violence Module */}
            <div className="card group transition-all duration-300">
              <div className="p-8">
                <div className="image-box inline-block mb-6">
                  <FontAwesomeIcon icon={faGun} className="text-4xl text-slate-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">Gun Violence Response</h3>
                <h4 className="text-lg text-muted mb-4">Emergency Response</h4>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Learn critical skills for responding to gun violence incidents and providing emergency care.
                </p>
                <Link
                  to="#"
                  className="w-full text-center block btn-primary"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} className="mr-2" />
                  Start Gun Violence Module
                </Link>
              </div>
            </div>

            {/* Domestic Violence Module */}
            <div className="card group transition-all duration-300">
              <div className="p-8">
                <div className="image-box inline-block mb-6">
                  <FontAwesomeIcon icon={faHandFist} className="text-4xl text-slate-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">Domestic Violence Awareness</h3>
                <h4 className="text-lg text-muted mb-4">Recognition & Support</h4>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Understand signs of domestic violence and learn how to provide appropriate support and resources.
                </p>
                <Link
                  to="#"
                  className="w-full text-center block btn-primary"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} className="mr-2" />
                  Start Domestic Violence Module
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Modules
