import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheck, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { trainingModules, useTrainingProgress, getProgressPercent, getModuleAction, getModuleStage } from '../lib/training-progress'

const Modules = () => {
  const progress = useTrainingProgress()
  const completedCount = trainingModules.filter(module => progress[module.id]?.moduleCompleted).length
  return (
    <main id="main-content" className="app-shell-page" tabIndex={-1}>
      <div className="hub-content">
        <header className="hub-page-heading">
          <div><p className="hub-eyebrow">Your learning library</p><h1>Training modules</h1><p>Learn the essentials. Test your knowledge. Put it into practice.</p></div>
          <span className="hub-count"><FontAwesomeIcon icon={faLayerGroup} /> {completedCount} of {trainingModules.length} completed</span>
        </header>
        <div className="module-catalog">
          {trainingModules.map((module, index) => {
            const saved = progress[module.id]
            const percent = getProgressPercent(saved)
            return (
              <article key={module.id} className="catalog-card">
                <div className="catalog-card-top">
                  <span className="hub-icon"><FontAwesomeIcon icon={module.icon} /></span>
                  <span className="module-state">{saved?.moduleCompleted && <FontAwesomeIcon icon={faCheck} />}{saved?.moduleCompleted ? 'Completed' : saved ? 'In progress' : `Module 0${index + 1}`}</span>
                </div>
                <p className="hub-eyebrow">{module.category}</p><h2>{module.title}</h2>
                <p className="catalog-description">{module.description}</p>
                <div className="catalog-details"><span>4 guided stages</span><span>{module.practice}</span></div>
                <div className="catalog-progress">
                  <div><span>{getModuleStage(saved)}</span><span>{percent}%</span></div>
                  <div className="hub-progress-track" role="progressbar" aria-label={`${module.title} progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
                </div>
                <Link to={module.path} className={saved?.moduleCompleted ? 'hub-button hub-button-secondary' : 'hub-button'} aria-label={`${getModuleAction(saved)}: ${module.title}`}>{getModuleAction(saved)} <FontAwesomeIcon icon={faArrowRight} /></Link>
              </article>
            )
          })}
        </div>
        <p className="hub-footnote">Your progress is saved in this browser. These modules support learning and practice; they do not provide professional certification.</p>
      </div>
    </main>
  )
}

export default Modules
