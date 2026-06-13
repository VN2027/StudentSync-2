import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { type Task, colorForSubject } from '../lib/types'

function getWeekDates(): Date[] {
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // 1 = Mon ... 7 = Sun
  monday.setDate(today.getDate() - (dayOfWeek - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function Planner() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const weekDates = getWeekDates()
  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    loadTasks()
  }, [user])

  async function loadTasks() {
    setLoading(true)
    const start = weekDates[0].toISOString().split('T')[0]
    const end = weekDates[6].toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user!.id)
      .gte('scheduled_date', start)
      .lte('scheduled_date', end)
      .order('scheduled_date', { ascending: true })

    if (data) setTasks(data as Task[])
    setLoading(false)
  }

  async function toggleTask(task: Task) {
    const newCompleted = !task.completed
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: newCompleted } : t)))
    await supabase
      .from('tasks')
      .update({ completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null })
      .eq('id', task.id)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <i className="ti ti-loader-2 animate-spin text-2xl text-accent"></i>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Study planner</h1>
        <p className="text-muted text-sm">
          Week of {weekDates[0].toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-panel border border-line rounded-xl p-10 text-center">
          <i className="ti ti-calendar-event text-3xl text-muted mb-3 block mx-auto"></i>
          <p className="text-sm text-muted">No tasks scheduled this week yet. Add an assessment to generate a plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
          {weekDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0]
            const dayTasks = tasks.filter((t) => t.scheduled_date === dateStr)
            const isToday = dateStr === todayStr
            return (
              <div key={dateStr} className={`bg-panel border rounded-xl p-3 min-h-[160px] ${isToday ? 'border-2 border-accent' : 'border-line'}`}>
                <p className={`text-xs mb-3 font-mono ${isToday ? 'text-accent' : 'text-muted'}`}>
                  {date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }).toUpperCase()}{isToday ? ' · TODAY' : ''}
                </p>
                <div className="space-y-2">
                  {dayTasks.map((task) => {
                    const subject = task.title.split(':')[0]
                    const color = colorForSubject(subject)
                    return (
                      <label key={task.id} className={`block ${color.bg} border ${color.bg.replace('bg-', 'border-').replace('/10', '/30')} rounded-lg p-2 cursor-pointer`}>
                        <div className="flex items-start gap-2">
                          <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} className="w-3.5 h-3.5 accent-accent mt-0.5" />
                          <p className={`text-xs text-slate-200 ${task.completed ? 'line-through text-muted' : ''}`}>{task.title}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
