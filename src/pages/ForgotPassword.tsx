import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError(error)
    else setSent(true)
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Reset your password</h1>
      <p className="text-muted text-sm mb-8">Enter your email and we'll send a reset link.</p>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}
      {sent && (
        <div className="mb-4 text-sm text-accent bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5">
          Check your email for a reset link.
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
        <button type="submit" disabled={loading} className="w-full bg-accent text-ink font-medium py-2.5 rounded-lg hover:bg-accent/90 transition disabled:opacity-60">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
        <p className="text-sm text-muted text-center">
          <Link to="/login" className="hover:text-white">Back to log in</Link>
        </p>
      </form>
    </div>
  )
}
