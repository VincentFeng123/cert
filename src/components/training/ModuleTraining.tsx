import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight, faBookOpen, faCheck, faCheckCircle, faChevronRight, faClock, faGraduationCap, faHeart, faLightbulb, faRotateRight, faShieldHalved, faTrophy } from '@fortawesome/free-solid-svg-icons'
import FlashcardDeck from '../FlashcardDeck'
import SimpleChatbot from '../module/SimpleChatbot'
import type { TrainingModuleData, TrainingScenario } from '../../data/trainingModules'
import { freshProgress, restoreTrainingProgress, scoreTrainingQuiz, type TrainingProgress } from '../../lib/module-progress'
import { getPracticeDefinition } from '../../data/practice'
import { practiceIsComplete } from '../../lib/practice-progress'
import './training.css'
import '../practice/practice.css'

const PracticeStudio = lazy(() => import('../practice/PracticeStudio'))

const stages = [
  { id: 'learn', title: 'Learn the essentials', short: 'Learn', icon: faBookOpen },
  { id: 'knowledge', title: 'Key points', short: 'Key points', icon: faLightbulb },
  { id: 'quiz', title: 'Test your knowledge', short: 'Knowledge check', icon: faGraduationCap },
  { id: 'practice', title: '3D practice & scenarios', short: 'Practice', icon: faShieldHalved },
]


function LearningIllustration({ kind }: { kind: TrainingModuleData['illustration'] }) {
  if (kind === 'choking') return <div className="training-visual" aria-label="Severe choking response: five back blows, then five abdominal thrusts if needed">
    <div className="training-visual-number"><strong>5</strong><span>Back blows</span></div><div className="training-visual-arrow" aria-hidden="true">→</div><div className="training-visual-number"><strong>5</strong><span>Abdominal thrusts</span></div>
    <p>Stop when the airway clears.<br />Repeat if still needed.</p>
  </div>
  if (kind === 'safety') return <div className="training-visual training-visual-path" aria-label="Get to safety, contact help, provide care when safe">
    <span><FontAwesomeIcon icon={faArrowRight} /><strong>Safety</strong></span><i aria-hidden="true" /><span><FontAwesomeIcon icon={faShieldHalved} /><strong>Help</strong></span><i aria-hidden="true" /><span><FontAwesomeIcon icon={faHeart} /><strong>Care</strong></span>
  </div>
  return <div className="training-visual training-visual-support" aria-label="Listen, believe, support">
    <div className="training-dialogue">“I believe you.”</div><div className="training-dialogue">“What would help?”</div><p>Support starts with listening.</p>
  </div>
}

function ScenarioPractice({ scenario, onComplete, onExit }: { scenario: TrainingScenario; onComplete: () => void; onExit: () => void }) {
  const [decisionId, setDecisionId] = useState(scenario.decisions[0].id)
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [visited, setVisited] = useState<string[]>([])
  const titleRef = useRef<HTMLHeadingElement>(null)
  const decision = scenario.decisions.find(item => item.id === decisionId) ?? scenario.decisions[0]
  const choice = choiceIndex === null ? null : decision.choices[choiceIndex]

  const next = () => {
    if (!choice?.correct) return
    setVisited(previous => [...previous, decision.id])
    if (choice.next) {
      setDecisionId(choice.next)
      setChoiceIndex(null)
    } else {
      setFinished(true)
      onComplete()
    }
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  if (finished) return <div className="training-result" role="status">
    <span className="training-result-icon"><FontAwesomeIcon icon={faCheckCircle} /></span>
    <h3 ref={titleRef} tabIndex={-1}>Scenario complete</h3>
    <p>You worked through {visited.length} decisions in “{scenario.title}.” Use this sequence as a starting point, and follow trained responders in a real emergency.</p>
    <button className="btn-primary" onClick={onExit}>Back to scenarios <FontAwesomeIcon icon={faArrowRight} /></button>
  </div>

  return <div className="training-scenario">
    <button className="training-text-button" onClick={onExit}><FontAwesomeIcon icon={faArrowLeft} /> All scenarios</button>
    <div className="training-section-label">{scenario.title} · Decision {visited.length + 1}</div>
    <h3 ref={titleRef} tabIndex={-1}>{decision.title}</h3>
    <div className="training-situation"><FontAwesomeIcon icon={faLightbulb} /><p>{decision.situation}</p></div>
    <h4 className="training-question">{decision.prompt}</h4>
    <div className="training-options">
      {decision.choices.map((option, index) => <button key={option.label} disabled={choice !== null} onClick={() => setChoiceIndex(index)} className={`training-option ${choiceIndex === index ? option.correct ? 'is-correct' : 'is-incorrect' : ''}`}>
        <span className="training-option-letter">{String.fromCharCode(65 + index)}</span><span>{option.label}</span>{choiceIndex === index && option.correct && <FontAwesomeIcon icon={faCheck} />}
      </button>)}
    </div>
    {choice && <div className={`training-feedback ${choice.correct ? 'is-correct' : 'is-incorrect'}`} role="status">
      <strong>{choice.correct ? 'A safe response' : 'Pause and reconsider'}</strong><p>{choice.feedback}</p>
      {choice.correct ? <button className="btn-primary" onClick={next}>{choice.next ? 'Continue scenario' : 'Finish scenario'} <FontAwesomeIcon icon={faArrowRight} /></button> : <button className="btn-secondary" onClick={() => setChoiceIndex(null)}>Try another response</button>}
    </div>}
  </div>
}

function ModuleTrainingSession({ data }: { data: TrainingModuleData }) {
  const [progress, setProgress] = useState<TrainingProgress>(() => {
    try { return restoreTrainingProgress(data, localStorage.getItem(`${data.slug}-training-progress`)) } catch { return freshProgress(data) }
  })
  const [studyMode, setStudyMode] = useState<'guide' | 'flashcards'>('guide')
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [practiceMode, setPracticeMode] = useState<'3d' | 'scenarios'>('3d')
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const currentStep = progress.currentStep
  const questionIndex = progress.currentQuestion
  const answerChecked = progress.showQuestionFeedback
  const quizPassed = progress.passedQuizAnswers.length === data.quiz.length
  const quizScore = scoreTrainingQuiz(data, progress.quizAnswers)
  const practiceDefinition = getPracticeDefinition(data.slug)
  const studioComplete = practiceIsComplete(practiceDefinition, progress.practiceActions)
  const scenariosComplete = progress.completedScenarioIds.length === data.scenarios.length
  const practiceComplete = studioComplete && scenariosComplete
  const completedStages = [progress.overviewRead, progress.guideRead, quizPassed, practiceComplete]
  const percent = Math.round(completedStages.filter(Boolean).length / stages.length * 100)
  const canComplete = completedStages.every(Boolean)
  const question = data.quiz[questionIndex]
  const selectedAnswer = progress.quizAnswers[questionIndex]
  const activeScenario = data.scenarios.find(scenario => scenario.id === activeScenarioId)
  const flashcards = useMemo(() => data.lessons.map((lesson, index) => ({ id: `${data.slug}-${index}`, front: <><p className="text-lg font-semibold">{lesson.title}</p><p className="text-sm opacity-80 mt-3">{lesson.summary}</p></>, back: <><p className="text-lg font-semibold">Remember</p><p className="text-sm opacity-80 mt-3">{lesson.recall}</p></> })), [data])

  useEffect(() => {
    try {
      localStorage.setItem(`${data.slug}-training-progress`, JSON.stringify({ ...progress, quizScore: progress.quizSubmitted ? quizScore : scoreTrainingQuiz(data, progress.passedQuizAnswers), showQuizResults: progress.quizSubmitted, practiceCompleted: practiceComplete }))
      window.dispatchEvent(new Event('training-progress-updated'))
    } catch { setStorageUnavailable(true) }
  }, [data, progress, quizScore, practiceComplete])

  const goToStep = (step: number) => {
    setProgress(previous => ({ ...previous, currentStep: step }))
    setActiveScenarioId(null)
    requestAnimationFrame(() => {
      contentRef.current?.focus({ preventScroll: true })
      contentRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    })
  }
  const continueStep = () => {
    setProgress(previous => ({ ...previous, overviewRead: previous.overviewRead || currentStep === 0, guideRead: previous.guideRead || currentStep === 1 }))
    goToStep(Math.min(currentStep + 1, 3))
  }
  const submitQuiz = () => {
    setProgress(previous => ({ ...previous, quizSubmitted: true, showQuestionFeedback: false, passedQuizAnswers: quizScore >= 80 ? previous.quizAnswers as number[] : previous.passedQuizAnswers }))
  }
  const retryQuiz = () => {
    setProgress(previous => ({ ...previous, quizAnswers: data.quiz.map(() => null), quizSubmitted: false, currentQuestion: 0, showQuestionFeedback: false }))
  }
  const completeModule = () => {
    if (!canComplete) return
    setProgress(previous => ({ ...previous, moduleCompleted: true }))
  }

  const renderContent = () => {
    if (currentStep === 0) return <>
      <div className="training-section-label">A practical starting point</div><h2>Small steps. A more prepared you.</h2><p className="training-lead">{data.description}</p>
      <LearningIllustration kind={data.illustration} />
      <h3 className="training-subheading">What you will learn</h3>
      <ul className="training-objectives">{data.objectives.map(objective => <li key={objective}><FontAwesomeIcon icon={faCheckCircle} /><span>{objective}</span></li>)}</ul>
      <div className="training-note"><FontAwesomeIcon icon={faBookOpen} /><p>{data.scope}</p></div>
    </>
    if (currentStep === 1) return <>
      <div className="training-section-label">Build your understanding</div><h2>{data.shortTitle} essentials</h2><p className="training-lead">Review the guide or use flashcards to check what you remember.</p>
      <div className="training-study-switch" role="group" aria-label="Study format">
        <button className={studyMode === 'guide' ? 'is-active' : ''} aria-pressed={studyMode === 'guide'} onClick={() => setStudyMode('guide')}>Study guide</button><button className={studyMode === 'flashcards' ? 'is-active' : ''} aria-pressed={studyMode === 'flashcards'} onClick={() => setStudyMode('flashcards')}>Flashcards</button>
      </div>
      {studyMode === 'flashcards' ? <FlashcardDeck cards={flashcards} title={`${data.shortTitle} flashcards`} subtitle="Flip each card to recall the key action." /> : <div className="training-lessons">{data.lessons.map((lesson, index) => <section className="training-lesson" key={lesson.title}>
        <span className="training-lesson-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{lesson.title}</h3><p>{lesson.summary}</p><ul>{lesson.details.map(detail => <li key={detail}>{detail}</li>)}</ul></div>
      </section>)}</div>}
    </>
    if (currentStep === 2) return <>
      <div className="training-section-label">Put your knowledge to work</div><h2>Knowledge check</h2><p className="training-lead">Five questions. Helpful feedback after every answer. Score at least 80% to pass.</p>
      {progress.quizSubmitted ? <>
        <div className={`training-result ${quizScore < 80 ? 'needs-review' : ''}`} role="status"><span className="training-score">{quizScore}<small>%</small></span><h3>{quizScore >= 80 ? 'You’re ready to practice' : 'A little more review will help'}</h3><p>{data.quiz.filter((item, index) => progress.quizAnswers[index] === item.correct).length} of {data.quiz.length} correct. {quizScore >= 80 ? 'Your knowledge check is complete.' : 'Read the explanations, then try again. You need 4 correct answers to pass.'}</p><div className="training-result-actions"><button className="btn-secondary" onClick={retryQuiz}><FontAwesomeIcon icon={faRotateRight} /> Retake quiz</button><button className="btn-primary" onClick={() => goToStep(quizScore >= 80 || quizPassed ? 3 : 1)}>{quizScore >= 80 || quizPassed ? 'Go to practice' : 'Review key points'} <FontAwesomeIcon icon={faArrowRight} /></button></div></div>
        <div className="training-answer-review"><h3>Review your answers</h3>{data.quiz.map((item, index) => <details key={item.question}><summary><span className={`training-review-mark ${progress.quizAnswers[index] === item.correct ? 'is-correct' : ''}`}>{progress.quizAnswers[index] === item.correct ? '✓' : '↻'}</span><span>{item.question}</span><FontAwesomeIcon icon={faChevronRight} /></summary><div><p><strong>Your answer:</strong> {item.options[progress.quizAnswers[index] ?? 0]}</p>{progress.quizAnswers[index] !== item.correct && <p><strong>Correct answer:</strong> {item.options[item.correct]}</p>}<p>{item.explanation}</p></div></details>)}</div>
      </> : <>
        <div className="training-question-progress"><span>Question {questionIndex + 1} of {data.quiz.length}</span><div className="training-mini-progress"><span style={{ width: `${questionIndex / data.quiz.length * 100}%` }} /></div></div>
        <h3 className="training-question">{question.question}</h3>
        <div className="training-options" role="group" aria-label="Answer options">{question.options.map((option, index) => <button key={option} aria-pressed={selectedAnswer === index} disabled={answerChecked} onClick={() => setProgress(previous => ({ ...previous, quizAnswers: previous.quizAnswers.map((answer, answerIndex) => answerIndex === questionIndex ? index : answer) }))} className={`training-option ${selectedAnswer === index ? 'is-selected' : ''} ${answerChecked && index === question.correct ? 'is-correct' : ''} ${answerChecked && selectedAnswer === index && index !== question.correct ? 'is-incorrect' : ''}`}><span className="training-option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{answerChecked && index === question.correct && <FontAwesomeIcon icon={faCheck} />}</button>)}</div>
        {answerChecked && <div className={`training-feedback ${selectedAnswer === question.correct ? 'is-correct' : 'is-incorrect'}`} role="status"><strong>{selectedAnswer === question.correct ? 'Correct' : 'Here’s what to remember'}</strong><p>{question.explanation}</p></div>}
        <div className="training-quiz-actions">{answerChecked ? <button className="btn-primary" onClick={() => { if (questionIndex === data.quiz.length - 1) submitQuiz(); else { setProgress(previous => ({ ...previous, currentQuestion: previous.currentQuestion + 1, showQuestionFeedback: false })) } }}>{questionIndex === data.quiz.length - 1 ? 'See results' : 'Next question'} <FontAwesomeIcon icon={faArrowRight} /></button> : <button className="btn-primary" disabled={selectedAnswer === null} onClick={() => setProgress(previous => ({ ...previous, showQuestionFeedback: true }))}>Check answer <FontAwesomeIcon icon={faArrowRight} /></button>}</div>
      </>}
    </>
    return <>
      <div className="training-section-label">See the scene. Rehearse the response.</div><h2>Interactive 3D practice</h2><p className="training-lead">{practiceDefinition.introduction}</p>
      <div className="practice-mode-tabs" role="group" aria-label="Practice format"><button aria-pressed={practiceMode === '3d'} onClick={() => setPracticeMode('3d')}>{studioComplete && <FontAwesomeIcon icon={faCheckCircle} />}3D practice</button><button aria-pressed={practiceMode === 'scenarios'} onClick={() => setPracticeMode('scenarios')}>{scenariosComplete && <FontAwesomeIcon icon={faCheckCircle} />}Decision scenarios</button></div>
      {practiceMode === '3d' ? <Suspense fallback={<div className="training-note" role="status">Preparing your 3D practice scene…</div>}><PracticeStudio definition={practiceDefinition} savedActions={progress.practiceActions} onScenarios={() => setPracticeMode('scenarios')} onActionsChange={actions => setProgress(previous => ({ ...previous, practiceActions: Object.fromEntries(practiceDefinition.steps.map(step => [step.id, Math.max(previous.practiceActions[step.id] ?? 0, actions[step.id] ?? 0)])) }))} /></Suspense> : activeScenario ? <ScenarioPractice key={activeScenario.id} scenario={activeScenario} onExit={() => setActiveScenarioId(null)} onComplete={() => setProgress(previous => ({ ...previous, completedScenarioIds: [...new Set([...previous.completedScenarioIds, activeScenario.id])] }))} /> : <>
        <div className="training-scenario-list">{data.scenarios.map((scenario, index) => {
          const complete = progress.completedScenarioIds.includes(scenario.id)
          return <button className="training-scenario-card" key={scenario.id} onClick={() => setActiveScenarioId(scenario.id)}><span className="training-scenario-icon"><FontAwesomeIcon icon={complete ? faCheckCircle : faShieldHalved} /></span><span className="training-scenario-card-copy"><small>{complete ? 'Completed · Replay anytime' : `Scenario ${index + 1}`}</small><strong>{scenario.title}</strong><span>{scenario.description}</span></span><FontAwesomeIcon icon={faArrowRight} /></button>
        })}</div>
        {scenariosComplete && <div className="training-feedback is-correct" role="status"><strong>Both scenarios completed</strong><p>{studioComplete ? 'You have also completed the 3D practice sequence.' : 'Your decisions are saved. Complete the 3D practice sequence to finish the practice stage.'}</p></div>}
        {!studioComplete && <div className="practice-missing"><p>Rehearse the response in the interactive 3D scene, too.</p><button className="btn-secondary" onClick={() => setPracticeMode('3d')}>Open 3D practice</button></div>}
        {progress.moduleCompleted ? <div className="training-result"><span className="training-result-icon"><FontAwesomeIcon icon={faTrophy} /></span><h3>Module completed</h3><p>Your progress is saved on this device. Come back anytime to refresh your knowledge. This learning achievement is not a professional certification.</p><Link className="btn-primary" to="/modules">Explore more modules <FontAwesomeIcon icon={faArrowRight} /></Link></div> : <div className="training-completion"><h3>Your completion checklist</h3><ul>{completedStages.map((complete, index) => <li key={stages[index].id}><FontAwesomeIcon icon={complete ? faCheckCircle : stages[index].icon} /><span>{stages[index].title}</span><strong>{complete ? 'Complete' : 'To do'}</strong>{!complete && <button onClick={() => goToStep(index)} aria-label={`Go to ${stages[index].title}`}><FontAwesomeIcon icon={faArrowRight} /></button>}</li>)}</ul><button className="btn-primary" disabled={!canComplete} onClick={completeModule}>Complete module <FontAwesomeIcon icon={faCheck} /></button>{!canComplete && <p>Finish the checklist above to record completion.</p>}</div>}
      </>}
    </>
  }

  return <div className="training-page guided-training">
    <div className="container">
      <div className="training-topline"><Link to="/modules" className="training-back"><FontAwesomeIcon icon={faArrowLeft} /> All modules</Link><span><FontAwesomeIcon icon={faClock} /> {data.duration}</span></div>
      <header className="training-header"><div><p className="training-section-label">{data.eyebrow}</p><h1>{data.title}</h1><p>{stages[currentStep].title}</p></div><div className="training-progress"><span>{progress.moduleCompleted ? 'Module complete' : 'Your progress'}<strong>{percent}%</strong></span><div role="progressbar" aria-label="Completed training stages" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div><small>{completedStages.filter(Boolean).length} of 4 stages complete</small></div></header>
      {data.slug === 'domestic-violence' && <div className="training-privacy-note"><p>Need to leave quickly? This opens a neutral page. It does not clear browser history or device monitoring.</p><a href="https://www.google.com" onClick={event => { event.preventDefault(); window.location.replace('https://www.google.com') }}>Quick exit <FontAwesomeIcon icon={faArrowRight} /></a></div>}
      <nav className="training-stages" aria-label="Training stages">{stages.map((stage, index) => <button key={stage.id} aria-current={currentStep === index ? 'step' : undefined} onClick={() => goToStep(index)} className={currentStep === index ? 'is-active' : ''}><span>{completedStages[index] ? <FontAwesomeIcon icon={faCheck} /> : String(index + 1).padStart(2, '0')}</span><strong>{stage.short}</strong></button>)}</nav>
      {storageUnavailable && <p className="training-storage-notice" role="status">Your browser is not allowing progress to be saved. You can continue this session.</p>}
      <div className="training-columns"><main className="card-module training-main" ref={contentRef} tabIndex={-1}><div className="training-content">{renderContent()}</div><footer className="training-footer"><div>{currentStep > 0 && <button className="btn-secondary" onClick={() => goToStep(currentStep - 1)}><FontAwesomeIcon icon={faArrowLeft} /> Previous</button>}</div><span>Step {currentStep + 1} of 4</span>{currentStep < 2 ? <button className="btn-primary" onClick={continueStep}>{currentStep === 0 ? 'Start learning' : 'Continue to quiz'} <FontAwesomeIcon icon={faArrowRight} /></button> : currentStep === 2 && quizPassed ? <button className="btn-primary" onClick={() => goToStep(3)}>Practice <FontAwesomeIcon icon={faArrowRight} /></button> : <Link to="/modules" className="training-text-button">All modules <FontAwesomeIcon icon={faArrowRight} /></Link>}</footer></main>
        <aside className="training-sidebar" aria-label="Learning support"><section className="training-sidebar-card"><div className="training-section-label"><FontAwesomeIcon icon={faLightbulb} /> Keep in mind</div><p className="training-takeaway">{data.takeaway}</p><span className="training-save-label"><FontAwesomeIcon icon={faCheckCircle} /> {storageUnavailable ? 'Session progress only' : 'Progress saved on this device'}</span></section>
          <section className="training-sidebar-card training-assistant"><SimpleChatbot moduleContext={{ moduleId: data.slug, currentStep: stages[currentStep].id, stepData: { title: stages[currentStep].title }, userProgress: percent, studyMode, viewSummary: `${data.description} Current stage: ${stages[currentStep].title}. ${data.takeaway}`, currentQuestionPrompt: currentStep === 2 && !progress.quizSubmitted ? question.question : undefined }} /></section>
          <section className="training-sidebar-card training-sources"><h3>Trusted learning resources</h3><p>Guidance reviewed September 2026.</p>{data.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span aria-hidden="true">↗</span></a>)}<small>Educational practice. Not a substitute for emergency services or hands-on training.</small></section>
        </aside>
      </div>
    </div>
  </div>
}

export default function ModuleTraining({ data }: { data: TrainingModuleData }) {
  return <ModuleTrainingSession key={data.slug} data={data} />
}
