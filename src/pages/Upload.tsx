import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'choice' | 'manual' | 'file'>('choice')
  const [processing, setProcessing] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [saving, setSaving] = useState(false)

  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [weighting, setWeighting] = useState('')
  const [requirements, setRequirements] = useState('')

  function handleFileSelect() {
    setProcessing(true)
    // Mock AI extraction for V1 - real OCR/AI extraction comes later (Step 5)
    setTimeout(() => {
      setSubject('Business Studies')
      setTitle('Marketing Plan — Urban Café')
      setDueDate('')
      setWeighting('30%')
      setRequirements('PowerPoint presentation covering the 4Ps of marketing for a hypothetical café, including target market analysis and a real-company case study comparison.')
      setProcessing(false)
      setExtracted(true)
      setMode('manual')
    }, 1200)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({
        user_id: user.id,
        subject,
        title,
        due_date: dueDate,
        weighting,
        requirements,
      })
      .select()
      .single()

    if (error || !assessment) {
      setSaving(false)
      alert('Error saving assessment: ' + error?.message)
      return
    }

    // Generate a simple study plan: spread tasks across the days leading up to due date
    await generateTasks(assessment.id, dueDate, subject, title)

    setSaving(false)
    navigate('/planner')
  }

  async function generateTasks(assessmentId: string, dueDateStr: string, subj: string, taskTitle: string) {
    if (!user) return
    const due = new Date(dueDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const totalDays = Math.max(1, Math.round((due.getTime() - today.getTime()) / 86400000))

    // Simple breakdown template - this is the placeholder for the real AI planner (Step 6)
    const stages = [
      'Read task sheet & rubric carefully',
      'Research and gather sources/notes',
      'Create outline / plan structure',
      'Draft main content',
      'Review and refine draft',
      'Final proofread and submit',
    ]

    const stagesToUse = stages.slice(0, Math.min(stages.length, Math.max(2, totalDays)))
    const interval = totalDays / stagesToUse.length

    const tasks = stagesToUse.map((label, i) => {
      const dayOffset = Math.min(totalDays - 1, Math.round(i * interval))
      const scheduledDate = new Date(today)
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset)
      return {
        user_id: user.id,
        assessment_id: assessmentId,
        title: `${subj}: ${label} — ${taskTitle}`,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        estimated_minutes: 30,
        completed: false,
      }
    })

    await supabase.from('tasks').insert(tasks)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-white mb-1">Add assessment</h1>
      <p className="text-muted text-sm mb-8">Upload a task sheet, or enter the details manually. StudentSync will build a study plan automatically.</p>

      {mode === 'choice' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={handleFileSelect}
            className="border-2 border-dashed border-line rounded-xl p-10 text-center hover:border-accent/40 transition"
          >
            <i className="ti ti-cloud-upload text-4xl text-muted mb-3 block mx-auto"></i>
            <p className="text-slate-200 font-medium">Upload file</p>
            <p className="text-xs text-muted mt-1">PDF, PNG, JPG — AI extracts the details</p>
          </button>
          <button
            onClick={() => setMode('manual')}
            className="border border-line rounded-xl p-10 text-center hover:border-accent/40 transition"
          >
            <i className="ti ti-pencil text-4xl text-muted mb-3 block mx-auto"></i>
            <p className="text-slate-200 font-medium">Enter manually</p>
            <p className="text-xs text-muted mt-1">Type in the assessment details yourself</p>
          </button>
        </div>
      )}

      {processing && (
        <div className="mt-6 bg-panel border border-line rounded-xl p-5 flex items-center gap-3">
          <i className="ti ti-loader-2 text-accent animate-spin"></i>
          <p className="text-sm text-slate-200">Reading document...</p>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleSave} className="mt-6 bg-panel border border-line rounded-xl p-5">
          {extracted && (
            <p className="text-xs text-accent mb-4 flex items-center gap-1">
              <i className="ti ti-sparkles"></i> Extracted from your file — check these over and edit anything that's off.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted block mb-1">Subject</label>
              <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Economics"
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Assessment name</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Federal Budget Essay"
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Due date</label>
              <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Weighting</label>
              <input value={weighting} onChange={(e) => setWeighting(e.target.value)} placeholder="e.g. 20%"
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted block mb-1">Key requirements</label>
              <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)}
                placeholder="Brief notes on what the task involves..."
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50 h-24" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="mt-5 bg-accent text-ink font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-accent/90 transition flex items-center gap-2 disabled:opacity-60">
            <i className="ti ti-route text-sm"></i> {saving ? 'Generating plan...' : 'Generate study plan'}
          </button>
        </form>
      )}
    </div>
  )
}
