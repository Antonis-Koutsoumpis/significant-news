import { useLocation, useNavigate } from 'react-router-dom'
import { useData } from '../data/DataContext'

/** Opens a randomly chosen development from the whole archive (never the one currently open). */
export default function LuckyButton({ className = '' }: { className?: string }) {
  const { items, status } = useData()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (status !== 'ready' || items.length === 0) return null

  const pick = () => {
    const current = pathname.startsWith('/development/') ? pathname.slice('/development/'.length) : undefined
    const pool = items.length > 1 ? items.filter((d) => d.id !== current) : items
    const d = pool[Math.floor(Math.random() * pool.length)]
    navigate(`/development/${d.id}`)
  }

  return (
    <button
      type="button"
      onClick={pick}
      title="Open a random development from the archive"
      className={`rounded-full bg-pink-soft px-3.5 py-1.5 text-sm font-medium text-pink-ink hover:bg-pink hover:text-white transition-colors ${className}`}
    >
      I'm feeling lucky
    </button>
  )
}
