import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheck, faLock, faTrophy, faBookOpen, faStar, faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { trainingModules, useTrainingProgress, getModuleAction, getModuleStage, getProgressPercent } from '../lib/training-progress'

const Achievements = () => {
  const progress = useTrainingProgress()
  const completedCount = trainingModules.filter(module => progress[module.id]?.moduleCompleted).length
  const passedQuizzes = trainingModules.filter(module => progress[module.id]?.quizPassed).length
  const startedCount = trainingModules.filter(module => progress[module.id] !== null).length
  const badges = [
    { id: 'first-steps', title: 'First steps', description: 'Move beyond the introduction in any module.', icon: faBookOpen, earned: trainingModules.some(module => (progress[module.id]?.currentStep ?? 0) >= 1) },
    { id: 'knowledge', title: 'Knowledge builder', description: 'Score 90% or higher on a submitted knowledge check.', icon: faStar, earned: trainingModules.some(module => progress[module.id]?.showQuizResults && (progress[module.id]?.quizScore ?? 0) >= 90) },
    { id: 'first-completion', title: 'Practice complete', description: 'Finish the lessons, quiz, and practice in one module.', icon: faFlagCheckered, earned: completedCount > 0 },
    { id: 'learning-path', title: 'Full learning path', description: 'Complete all four training modules.', icon: faTrophy, earned: completedCount === trainingModules.length },
  ]
  const earnedCount = badges.filter(badge => badge.earned).length
  return (
    <main id="main-content" className="app-shell-page" tabIndex={-1}>
      <div className="hub-content">
        <header className="hub-page-heading"><div><p className="hub-eyebrow">Every step counts</p><h1>Your achievements</h1><p>A record of what you have learned and where you can go next.</p></div><Link to="/modules" className="hub-text-link">Keep learning <FontAwesomeIcon icon={faArrowRight} /></Link></header>
        <dl className="achievement-stats">
          <div><dt>Modules completed</dt><dd>{completedCount}<span> / {trainingModules.length}</span></dd></div>
          <div><dt>Knowledge checks passed</dt><dd>{passedQuizzes}<span> / {trainingModules.length}</span></dd></div>
          <div><dt>Milestones earned</dt><dd>{earnedCount}<span> / {badges.length}</span></dd></div>
        </dl>
        {startedCount === 0 && <div className="achievement-empty"><span className="hub-icon"><FontAwesomeIcon icon={faTrophy} /></span><div><h2>Your first achievement starts with a lesson.</h2><p>Choose a module, learn the essentials, and see your progress here.</p></div><Link to="/modules" className="hub-button">Start learning <FontAwesomeIcon icon={faArrowRight} /></Link></div>}
        <section className="achievement-section" aria-labelledby="module-progress-title">
          <div className="hub-section-heading"><h2 id="module-progress-title">Module progress</h2><span className="hub-subtle">Saved on this device</span></div>
          <div className="achievement-modules">
            {trainingModules.map(module => {
              const saved = progress[module.id]
              const percent = getProgressPercent(saved)
              return <div key={module.id} className="achievement-module-row">
                <span className="hub-icon"><FontAwesomeIcon icon={module.icon} /></span>
                <div className="achievement-module-info"><h3>{module.title}</h3><p>{getModuleStage(saved)}{saved?.showQuizResults ? ` · Quiz ${saved.quizScore}%` : ''}</p></div>
                <div className="achievement-module-progress"><div className="hub-progress-track" role="progressbar" aria-label={`${module.title} progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div><span>{percent}%</span></div>
                <Link to={module.path} className="hub-text-link" aria-label={`${getModuleAction(saved)}: ${module.title}`}>{saved?.moduleCompleted ? 'Review' : saved ? 'Continue' : 'Start'}<FontAwesomeIcon icon={faArrowRight} /></Link>
              </div>
            })}
          </div>
        </section>
        <section className="achievement-section" aria-labelledby="milestone-title">
          <div className="hub-section-heading"><h2 id="milestone-title">Learning milestones</h2><span className="hub-subtle">{earnedCount} earned</span></div>
          <div className="milestone-grid">
            {badges.map(badge => <article key={badge.id} className={`milestone-card${badge.earned ? ' is-earned' : ''}`}><div className="milestone-top"><span className="hub-icon"><FontAwesomeIcon icon={badge.icon} /></span><span className="module-state"><FontAwesomeIcon icon={badge.earned ? faCheck : faLock} /> {badge.earned ? 'Earned' : 'To unlock'}</span></div><h3>{badge.title}</h3><p>{badge.description}</p></article>)}
          </div>
        </section>
        <p className="hub-footnote">Achievements reflect your activity in this browser. They are learning milestones, not professional certifications.</p>
      </div>
    </main>
  )
}

export default Achievements
