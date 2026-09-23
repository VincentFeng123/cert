import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom'
import Home from './pages/Home'
import Modules from './pages/Modules'
import Header from './components/Header'
const CPRTraining = lazy(() => import('./pages/CPRTraining'))
const HeimlichTraining = lazy(() => import('./pages/HeimlichTraining'))
const GunViolenceTraining = lazy(() => import('./pages/GunViolenceTraining'))
const DomesticViolenceTraining = lazy(() => import('./pages/DomesticViolenceTraining'))
const Achievements = lazy(() => import('./pages/Achievements'))
function AppContent() {
  const location = useLocation()
  const showHeader = ['/', '/modules', '/achievements'].includes(location.pathname)
  useEffect(() => { window.scrollTo({top: 0, behavior: 'instant'}) }, [location.pathname])
  return <div className="min-h-screen bg-slate-50/30">
    {showHeader && <Header />}
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500" role="status">Preparing your lesson…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/cpr" element={<CPRTraining />} />
        <Route path="/heimlich" element={<HeimlichTraining />} />
        <Route path="/gun-violence" element={<GunViolenceTraining />} />
        <Route path="/domestic-violence" element={<DomesticViolenceTraining />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="*" element={<main className="container py-24"><p className="text-xs uppercase tracking-widest text-slate-400">404 · Page not found</p><h1 className="text-3xl text-slate-800 my-4">Let's get you back to learning.</h1><Link to="/modules" className="btn-primary inline-block">Explore modules →</Link></main>} />
      </Routes>
    </Suspense>
  </div>
}
export default function App() { return <Router><AppContent /></Router> }
