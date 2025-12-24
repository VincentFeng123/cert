import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faTrophy, faGraduationCap, faHeart } from '@fortawesome/free-solid-svg-icons'

const Header = () => {
  const location = useLocation()

  return (
    <>
      <aside className="fixed left-6 top-12 h-[calc(100vh-6rem)] w-48 rounded-2xl z-50 p-4 flex flex-col">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
            <FontAwesomeIcon icon={faHeart} className="text-slate-800 text-2xl" />
            LifeSkills
          </h1>
          <p className="text-xs text-muted">Emergency Response</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <Link
            to="/"
            className={`flex items-center space-x-3 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
              location.pathname === '/'
                ? 'bg-slate-100 text-slate-800 pl-3 pr-1'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-1'
            }`}
            onClick={() => {
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }, 100)
            }}
          >
            <FontAwesomeIcon icon={faHome} className="text-lg" />
            <span>Home</span>
          </Link>
          <Link
            to="/modules"
            className={`flex items-center space-x-3 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
              location.pathname === '/modules'
                ? 'bg-slate-100 text-slate-800 pl-3 pr-1'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-1'
            }`}
            onClick={() => {
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }, 100)
            }}
          >
            <FontAwesomeIcon icon={faGraduationCap} className="text-lg" />
            <span>Modules</span>
          </Link>
          <Link
            to="/achievements"
            className={`flex items-center space-x-3 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
              location.pathname === '/achievements'
                ? 'bg-slate-100 text-slate-800 pl-3 pr-1'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-1'
            }`}
            onClick={() => {
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }, 100)
            }}
          >
            <FontAwesomeIcon icon={faTrophy} className="text-lg" />
            <span>Achievements</span>
          </Link>
        </nav>
      </aside>

      {/* Vertical divider line */}
      <div className="fixed left-[13.5rem] top-[5.5rem] h-[83vh] w-px bg-slate-200 z-40"></div>
    </>
  )
}

export default Header
