import { Link, NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faTrophy, faGraduationCap, faHeartPulse } from '@fortawesome/free-solid-svg-icons'
import './app-shell.css'

const Header = () => (
  <>
    <a className="skip-to-content" href="#main-content">Skip to content</a>
    <header className="app-sidebar">
      <Link to="/" className="app-brand" aria-label="LifeSkills home">
        <span className="app-brand-symbol"><FontAwesomeIcon icon={faHeartPulse} /></span>
        <span><strong>LifeSkills</strong><small>Emergency response</small></span>
      </Link>
      <nav className="app-navigation" aria-label="Main navigation">
        {[{ to: '/', label: 'Home', icon: faHome }, { to: '/modules', label: 'Modules', icon: faGraduationCap }, { to: '/achievements', label: 'Achievements', icon: faTrophy }].map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}>
            <FontAwesomeIcon icon={item.icon} /><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="app-sidebar-note">
        <span className="hub-eyebrow">Practice with purpose</span>
        <p>A little preparation can make a meaningful difference.</p>
      </div>
    </header>
  </>
)

export default Header
