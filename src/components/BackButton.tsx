import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

type BackButtonProps = {
  elevation?: 'overlay' | 'baseline'
}

const BackButton = ({ elevation = 'overlay' }: BackButtonProps) => {
  const navigate = useNavigate()

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/')
    // Small delay to ensure navigation completes, then scroll to top
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const wrapperZIndex = elevation === 'overlay' ? 2147483647 : 10

  return (
    <div className="sticky top-0 pt-16 pl-16 pointer-events-none" style={{ zIndex: wrapperZIndex }}>
      <Link
        to="/"
        onClick={handleBackClick}
        className="pointer-events-auto inline-flex items-center justify-center px-4 py-4 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-white hover:border-slate-600 transition-all duration-300"
        style={{ position: 'relative', zIndex: wrapperZIndex }}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
      </Link>
    </div>
  )
}

export default BackButton
