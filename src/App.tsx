import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Modules from './pages/Modules'
import CPRTraining from './pages/CPRTraining'
import HeimlichTraining from './pages/HeimlichTraining'
import Achievements from './pages/Achievements'
import Header from './components/Header'

function AppContent() {
  const location = useLocation()
  const showHeader = ['/', '/modules', '/achievements'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/cpr" element={<CPRTraining />} />
        <Route path="/heimlich" element={<HeimlichTraining />} />
        <Route path="/achievements" element={<Achievements />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
