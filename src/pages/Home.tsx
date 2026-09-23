import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheck, faBookOpen, faCircleQuestion, faCube } from '@fortawesome/free-solid-svg-icons'
import { trainingModules, useTrainingProgress, getModuleAction, getModuleStage, getProgressPercent } from '../lib/training-progress'

const Home = () => {
  const progress = useTrainingProgress()
  const completedCount = trainingModules.filter(module => progress[module.id]?.moduleCompleted).length
  const nextModule = trainingModules.find(module => progress[module.id] && !progress[module.id]?.moduleCompleted)
    ?? trainingModules.find(module => !progress[module.id]?.moduleCompleted) ?? trainingModules[0]
  const saved = progress[nextModule.id]
  return (
    <main id="main-content" className="app-shell-page" tabIndex={-1}>
      <div className="hub-content">
        <section className="home-intro">
          <div className="home-intro-copy">
            <p className="hub-eyebrow">Learn. Practice. Be prepared.</p>
            <h1>Be ready when<br />it matters.</h1>
            <p>Build confidence in emergency response, one practical skill at a time.</p>
            <Link to="/modules" className="hub-button">Explore training <FontAwesomeIcon icon={faArrowRight} /></Link>
          </div>
          <div className="next-session-card">
            <div className="next-session-heading"><span className="hub-eyebrow">{completedCount === 4 ? 'Keep your skills fresh' : saved ? 'Pick up where you left off' : 'A good place to begin'}</span><FontAwesomeIcon icon={nextModule.icon} /></div>
            <svg className="home-pulse" viewBox="0 0 400 100" fill="none" aria-hidden="true"><path d="M0 52H105L128 52L145 32L169 82L196 15L223 67L242 52H400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <h2>{nextModule.title}</h2>
            <p>{saved ? getModuleStage(saved) : nextModule.description}</p>
            {saved && <div className="hub-progress-track" role="progressbar" aria-label={`${nextModule.title} progress`} aria-valuenow={getProgressPercent(saved)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${getProgressPercent(saved)}%` }} /></div>}
            <Link to={nextModule.path} className="hub-text-link">{getModuleAction(saved)} <FontAwesomeIcon icon={faArrowRight} /></Link>
          </div>
        </section>
        <section className="home-learning-path" aria-labelledby="learning-path-title">
          <div className="hub-section-heading"><div><p className="hub-eyebrow">Small steps. Useful skills.</p><h2 id="learning-path-title">Your learning path</h2></div><Link to="/achievements" className="hub-text-link">{completedCount} of {trainingModules.length} completed <FontAwesomeIcon icon={faArrowRight} /></Link></div>
          <div className="learning-path-grid">
            {trainingModules.map((module, index) => (
              <Link to={module.path} key={module.id} className="learning-path-card">
                <div className="learning-path-top"><span className="hub-icon"><FontAwesomeIcon icon={module.icon} /></span><span>{progress[module.id]?.moduleCompleted ? <FontAwesomeIcon icon={faCheck} aria-label="Completed" /> : `0${index + 1}`}</span></div>
                <h3>{module.title}</h3><p>{module.category}</p>
                <span className="learning-path-status">{getModuleStage(progress[module.id])}<FontAwesomeIcon icon={faArrowRight} /></span>
              </Link>
            ))}
          </div>
        </section>
        <section className="home-method" aria-labelledby="learning-method-title">
          <div><p className="hub-eyebrow">A clear way to learn</p><h2 id="learning-method-title">From understanding<br />to practice.</h2></div>
          <div className="method-step"><FontAwesomeIcon icon={faBookOpen} /><h3>Learn the essentials</h3><p>Follow focused lessons and revisit the key points at your own pace.</p></div>
          <div className="method-step"><FontAwesomeIcon icon={faCircleQuestion} /><h3>Check your knowledge</h3><p>Test what you have learned and understand the reasoning behind each answer.</p></div>
          <div className="method-step"><FontAwesomeIcon icon={faCube} /><h3>Put it into practice</h3><p>Work through 3D activities and realistic decisions, with guidance along the way.</p></div>
        </section>
        <p className="hub-footnote">Self-paced learning, saved in this browser. For hands-on certification, complete a course with a qualified training provider.</p>
      </div>
    </main>
  )
}

export default Home
