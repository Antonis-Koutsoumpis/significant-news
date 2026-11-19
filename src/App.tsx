import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useData } from './data/DataContext'
import HomePage from './pages/HomePage'
import ArchivePage from './pages/ArchivePage'
import DevelopmentPage from './pages/DevelopmentPage'
import MethodologyPage from './pages/MethodologyPage'
import NotFound from './pages/NotFound'
import { formatDate } from './lib/text'
import LuckyButton from './components/LuckyButton'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 font-medium ${isActive ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:text-ink hover:bg-paper-deep'}`

export default function App() {
  const { status, error, config } = useData()

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <header className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <NavLink to="/" className="font-display font-bold text-2xl tracking-tight text-ink">
            The Record<span className="text-pink">.</span>
          </NavLink>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm -ml-3 sm:ml-0">
            <NavLink to="/" end className={navClass}>
              Current
            </NavLink>
            <NavLink to="/archive" className={navClass}>
              Archive
            </NavLink>
            <NavLink to="/methodology" className={navClass}>
              Methodology
            </NavLink>
            <LuckyButton className="ml-1" />
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-5 sm:px-8 py-8 sm:py-12">
        {status === 'loading' && <p className="text-muted">Loading the dataset…</p>}
        {status === 'error' && (
          <div className="max-w-prose">
            <h1 className="font-display font-bold text-2xl mb-3">The dataset could not be loaded</h1>
            <p className="text-muted">{error}</p>
            <p className="text-muted mt-3">
              If you opened <code>index.html</code> directly from disk, run <code>npm run dev</code> or{' '}
              <code>npm run preview</code> instead; browsers block local data files opened that way.
            </p>
          </div>
        )}
        {status === 'ready' && (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/development/:id" element={<DevelopmentPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-6 text-xs text-faint flex flex-col sm:flex-row gap-2 sm:justify-between">
          <span>A pilot archive of concluded developments. Scores are editorial judgements, not measurements.</span>
          {config.datasetReviewed && <span>Dataset last reviewed {formatDate(config.datasetReviewed)}</span>}
        </div>
      </footer>
    </div>
  )
}
