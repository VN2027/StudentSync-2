import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center">
            <i className="ti ti-bolt text-accent text-sm"></i>
          </span>
          <span className="font-display font-bold text-lg text-white tracking-tight">StudentSync</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-7 text-sm">
            <Link to="/dashboard" className="text-muted hover:text-white transition hidden sm:block">Dashboard</Link>
            <Link to="/upload" className="text-muted hover:text-white transition hidden sm:block">Upload</Link>
            <Link to="/planner" className="text-muted hover:text-white transition hidden sm:block">Planner</Link>
            <Link to="/focus" className="text-muted hover:text-white transition hidden sm:block">Focus</Link>
            <button onClick={handleSignOut} className="text-muted hover:text-white transition">Log out</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm text-muted hover:text-white transition">Log in</Link>
            <Link to="/register" className="text-sm font-medium bg-accent text-ink px-4 py-2 rounded-lg hover:bg-accent/90 transition">Get started</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
