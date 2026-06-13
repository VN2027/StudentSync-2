import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-muted text-sm mb-8">Log in to your StudentSync dashboard.</p>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted block mb-1">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu.au"
            className="w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="text-sm text-muted block mb-1">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-accent text-ink font-medium py-2.5 rounded-lg hover:bg-accent/90 transition disabled:opacity-60">
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        <p className="text-sm text-muted text-center">
          <Link to="/forgot-password" className="hover:text-white">Forgot password?</Link>
        </p>
        <p className="text-sm text-muted text-center">
          No account? <Link to="/register" className="text-accent hover:underline">Register</Link>
        </p>
      </form>
    </div>
  )
}
