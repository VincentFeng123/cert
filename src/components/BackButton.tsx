import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

type BackButtonProps = { elevation?: 'overlay' | 'baseline' }

const BackButton = ({ elevation = 'overlay' }: BackButtonProps) => (
  <div className="relative px-4 pt-5 sm:px-8 sm:pt-8 lg:px-12" style={{ zIndex: elevation === 'overlay' ? 30 : 10 }}>
    <Link to="/modules" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-600">
      <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> All modules
    </Link>
  </div>
)

export default BackButton
