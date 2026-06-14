import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'choice' | 'manual'>('choice')
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState('')

  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [weighting, setWeighting] = useState('')
  const [requirements, setRequirements] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, PNG, or JPG file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }

    setError(null)
    setUploading(true)
    setUploadedFileName(file.name)

    const filePath = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('assessments')
      .upload(filePath, file)

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    setExtracting(true)

    const base64 = await fileToBase64(file)
    const mediaType = file.type === 'application/pdf' ? 'application/pdf' : file.type as 'image/png' | 'image/jpeg'

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `You are a tool that extracts assessment details from uploaded school task sheets, notifications, or screenshots. 
Extract ONLY the following fields and respond with ONLY valid JSON, no other text:
{
  "subject": "the school subject (e.g. Physics, Economics, English Standard)",
  "title": "the assessment/task name",
  "due_date": "due date in YYYY-MM-DD format, or empty string if not found",
  "weighting": "percentage weighting e.g. 30%, or empty string if not found",
  "requirements": "brief summary of key requirements in 1-2 sentences"
}
If you cannot determine a field, use an empty string. Never generate fake data.`,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: mediaType === 'application/pdf' ? 'document' : 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: 'Extract the assessment details from this document.',
                },
              ],
            },
          ],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      let parsed: Record<string, string> = {}
      try {
        const clean = text.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(clean)
      } catch {
        setError('Could not read the document. Please enter details manually.')
        setExtracting(false)
        setMode('manual')
        return
      }

      setSubject(parsed.subject || '')
      setTitle(parsed.title || '')
      setDueDate(parsed.due_date || '')
      setWeighting(parsed.weighting || '')
      setRequirements(parsed.requirements || '')
      setExtracted(true)
      setExtracting(false)
      setMode('manual')
    } catch {
      setError('AI extraction failed. Please enter details manually.')
      setExtracting(false)
      setMode('manual')
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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
      setError('Error saving assessment: ' + error?.message)
      return
    }

    await generateTasks(assessment.id, dueDate, subject, title, requirements)
    setSaving(false)
    navigate('/planner')
  }

  async function generateTasks(
    assessmentId: string,
    dueDateStr: string,
    subj: string,
    taskTitle: string,
    reqs: string
  ) {
    if (!user) return
    const due = new Date(dueDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const totalDays = Math.max(1, Math.round((due.getTime() - today.getTime()) / 86400000))

    const allStages = [
      { label: 'Read task sheet, rubric & marking criteria carefully', mins: 20 },
      { label: 'Research topic & gather sources/notes', mins: 45 },
      { label: 'Create outline and plan your structure', mins: 30 },
      { label: 'Draft main content', mins: 60 },
      { label: 'Review draft & incorporate feedback', mins: 40 },
      { label: 'Edit, proofread & finalise', mins: 30 },
      { label: 'Final check & submit', mins: 20 },
    ]

    const numStages = Math.min(allStages.length, Math.max(2, totalDays))
    const stages = allStages.slice(0, numStages)
    const interval = totalDays / stages.length

    const tasks = stages.map((stage, i) => {
      const dayOffset = Math.min(totalDays - 1, Math.round(i * interval))
      const scheduledDate = new Date(today)
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset)
      return {
        user_id: user!.id,
        assessment_id: assessmentId,
        title: `${subj}: ${stage.label} — ${taskTitle}`,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        estimated_minutes: stage.mins,
        completed: false,
      }
    })

    await supabase.from('tasks').insert(tasks)

    if (reqs && totalDays >= 3) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            system: `You are a study planning assistant for Australian high school students. 
Generate a study plan as a JSON array of tasks. Each task has: label (string), day_offset (number, 0 = today), estimated_minutes (number).
Spread tasks evenly. Focus on PLANNING and ORGANISATION only — never generate assignment content or answers.
Respond with ONLY a JSON array, no other text.`,
            messages: [
              {
                role: 'user',
                content: `Subject: ${subj}
Assessment: ${taskTitle}
Requirements: ${reqs}
Days until due: ${totalDays}

Generate ${Math.min(7, totalDays)} study tasks spread across ${totalDays} days.`,
              },
            ],
          }),
        })

        const data = await response.json()
        const text = data.content?.[0]?.text || ''
        const clean = text.replace(/```json|```/g, '').trim()
        const aiTasks = JSON.parse(clean)

        if (Array.isArray(aiTasks) && aiTasks.length > 0) {
          await supabase.from('tasks').delete().eq('assessment_id', assessmentId)

          const smartTasks = aiTasks.map((t: { label: string; day_offset: number; estimated_minutes: number }) => {
            const scheduledDate = new Date(today)
            scheduledDate.setDate(scheduledDate.getDate() + Math.min(t.day_offset, totalDays - 1))
            return {
              user_id: user!.id,
              assessment_id: assessmentId,
              title: `${subj}: ${t.label} — ${taskTitle}`,
              scheduled_date: scheduledDate.toISOString().split('T')[0],
              estimated_minutes: t.estimated_minutes || 30,
              completed: false,
            }
          })

          await supabase.from('tasks').insert(smartTasks)
        }
      } catch {
        // AI plan failed — keep basic plan
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-white mb-1">Add assessment</h1>
      <p className="text-muted text-sm mb-8">
        Upload a task sheet or screenshot and StudentSync will read the details automatically, then build your study plan.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {mode === 'choice' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-line rounded-xl p-10 text-center cursor-pointer hover:border-accent/40 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileUpload}
            />
            {uploading ? (
              <>
                <i className="ti ti-loader-2 text-4xl text-accent animate-spin mb-3 block mx-auto"></i>
                <p className="text-slate-200 font-medium">Uploading...</p>
                <p className="text-xs text-muted mt-1">{uploadedFileName}</p>
              </>
            ) : extracting ? (
              <>
                <i className="ti ti-brain text-4xl text-accent2 animate-pulse mb-3 block mx-auto"></i>
                <p className="text-slate-200 font-medium">Reading with AI...</p>
                <p className="text-xs text-muted mt-1">Extracting assessment details</p>
              </>
            ) : (
              <>
                <i className="ti ti-cloud-upload text-4xl text-muted mb-3 block mx-auto"></i>
                <p className="text-slate-200 font-medium">Upload task sheet</p>
                <p className="text-xs text-muted mt-1">PDF, PNG, JPG — AI reads the details for you</p>
              </>
            )}
          </div>

          <div
            onClick={() => setMode('manual')}
            className="border border-line rounded-xl p-10 text-center cursor-pointer hover:border-accent/40 transition"
          >
            <i className="ti ti-pencil text-4xl text-muted mb-3 block mx-auto"></i>
            <p className="text-slate-200 font-medium">Enter manually</p>
            <p className="text-xs text-muted mt-1">Type in the details yourself</p>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleSave} className="mt-2 bg-panel border border-line rounded-xl p-5">
          {extracted && (
            <div className="mb-4 flex items-center gap-2 text-sm text-accent bg-accent/10 border border-accent/20 rounded-lg px-4 py-2.5">
              <i className="ti ti-sparkles"></i>
              AI extracted these details from your file — check and edit anything that's off, then confirm.
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted block mb-1">Subject</label>
              <input required value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics"
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Assessment name</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Depth Study Report"
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Due date</label>
              <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Weighting</label>
              <input value={weighting} onChange={(e) => setWeighting(e.target.value)}
                placeholder="e.g. 30%"
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted block mb-1">Key requirements</label>
              <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)}
                placeholder="Brief summary of what the task involves..."
                className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50 h-24" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={saving}
              className="bg-accent text-ink font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-accent/90 transition flex items-center gap-2 disabled:opacity-60">
              <i className="ti ti-route text-sm"></i>
              {saving ? 'Building your plan...' : extracted ? 'Confirm & generate plan' : 'Generate study plan'}
            </button>
            <button type="button" onClick={() => { setMode('choice'); setExtracted(false) }}
              className="border border-line px-5 py-2.5 rounded-lg text-sm hover:border-accent/40 transition">
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
