import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { type Assessment, type Task, type Profile, daysUntil, todayISO, colorForSubject } from '../lib/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const [profileRes, assessmentsRes, tasksRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase.from('assessments').select('*').eq('user_id', user!.id).order('due_date', { ascending: true }),
      supabase.from('tasks').select('*').eq('user_id', user!.id).eq('scheduled_date', todayISO()).order('created_at', { ascending: true }),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    if (assessmentsRes.data) setAssessments(assessmentsRes.data as Assessment[])
    if (tasksRes.data) setTodayTasks(tasksRes.data as Task[])
    setLoading(false)
  }

  async function toggleTask(task: Task) {
    const newCompleted = !task.completed
    setTodayTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: newCompleted } : t)))
    await supabase
      .from('tasks')
      .update({ completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null })
      .eq('id', task.id)
  }

  const upcoming = assessments.filter((a) => daysUntil(a.due_date) >= 0).slice(0, 5)
  const completedCount = todayTasks.filter((t) => t.completed).length
  const completionPct = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <i className="ti ti-loader-2 animate-spin text-2xl text-accent"></i>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="text-muted text-sm">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} — here's what's on today.
          </p>
        </div>
        <Link to="/upload" className="bg-accent text-ink text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 transition flex items-center gap-2">
          <i className="ti ti-plus text-sm"></i> Add assessment
        </Link>
      </div>

      {/* Progress row */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-panel border border-line rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Completion today</p>
          <p className="font-display text-3xl font-bold text-white">{completionPct}%</p>
          <div className="mt-3 h-1.5 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${completionPct}%` }}></div>
          </div>
        </div>
        <div className="bg-panel border border-line rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Tasks today</p>
          <p className="font-display text-3xl font-bold text-white">{completedCount}<span className="text-base text-muted font-body"> / {todayTasks.length}</span></p>
          <p className="text-xs text-muted mt-3">{todayTasks.length === 0 ? 'Nothing scheduled — add an assessment to get a plan' : 'Completed today'}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Study streak</p>
          <p className="font-display text-3xl font-bold text-white flex items-center gap-2">
            {profile?.study_streak ?? 0} <i className="ti ti-flame text-accent2"></i>
          </p>
          <p className="text-xs text-muted mt-3">Personal best: {profile?.longest_streak ?? 0} days</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Today */}
        <div className="md:col-span-2 bg-panel border border-line rounded-xl p-5">
          <h2 className="font-display font-bold text-white mb-4">Today</h2>
          {todayTasks.length === 0 ? (
            <div className="text-center py-10">
              <i className="ti ti-calendar-event text-3xl text-muted mb-3 block"></i>
              <p className="text-sm text-muted mb-4">No tasks scheduled for today yet.</p>
              <Link to="/upload" className="text-sm text-accent hover:underline">Upload an assessment to generate a plan →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <label key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-line cursor-pointer">
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} className="w-4 h-4 accent-accent" />
                  <div className="flex-1">
                    <p className={`text-sm text-slate-200 ${task.completed ? 'line-through text-muted' : ''}`}>{task.title}</p>
                    <p className="text-xs text-muted">~{task.estimated_minutes} min</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming assessments */}
        <div className="bg-panel border border-line rounded-xl p-5">
          <h2 className="font-display font-bold text-white mb-4">Upcoming assessments</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">No assessments yet. <Link to="/upload" className="text-accent hover:underline">Add one →</Link></p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => {
                const color = colorForSubject(a.subject)
                return (
                  <div key={a.id} className="border border-line rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-mono text-xs ${color.text} ${color.bg} px-2 py-0.5 rounded`}>{a.subject}</span>
                      <span className="font-display text-sm font-bold text-white">{daysUntil(a.due_date)}d</span>
                    </div>
                    <p className="text-sm text-slate-200">{a.title}</p>
                    <p className="text-xs text-muted">Due {new Date(a.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                )
              })}
            </div>
          )}
          <Link to="/planner" className="w-full block mt-4 text-sm text-accent hover:underline">View full planner →</Link>
        </div>
      </div>
    </div>
  )
}
