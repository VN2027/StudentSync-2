import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [yearLevel, setYearLevel] = useState('Year 11')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signUp(email, password, fullName, yearLevel)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      // If email confirmation is disabled in Supabase, user is signed in immediately
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1200)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Create your account</h1>
      <p className="text-muted text-sm mb-8">Takes about a minute. Free forever plan included.</p>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-accent bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5">
          Account created! Redirecting to your dashboard...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted block mb-1">Full name</label>
          <input
            type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
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
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="text-sm text-muted block mb-1">Year level</label>
          <select
            value={yearLevel} onChange={(e) => setYearLevel(e.target.value)}
            className="w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50"
          >
            <option>Year 10</option>
            <option>Year 11</option>
            <option>Year 12</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-accent text-ink font-medium py-2.5 rounded-lg hover:bg-accent/90 transition disabled:opacity-60">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-sm text-muted text-center">
          Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}
