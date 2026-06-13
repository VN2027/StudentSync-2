export interface Assessment {
  id: string
  user_id: string
  subject: string
  title: string
  due_date: string
  weighting: string | null
  requirements: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  assessment_id: string | null
  title: string
  scheduled_date: string
  estimated_minutes: number
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  year_level: string | null
  study_streak: number
  longest_streak: number
  last_active_date: string | null
  created_at: string
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

const SUBJECT_COLORS: Record<string, string> = {}
const PALETTE = [
  { text: 'text-accent', bg: 'bg-accent/10' },
  { text: 'text-accent2', bg: 'bg-accent2/10' },
  { text: 'text-amber-300', bg: 'bg-amber-300/10' },
  { text: 'text-pink-300', bg: 'bg-pink-300/10' },
  { text: 'text-blue-300', bg: 'bg-blue-300/10' },
]

export function colorForSubject(subject: string) {
  if (!SUBJECT_COLORS[subject]) {
    const idx = Object.keys(SUBJECT_COLORS).length % PALETTE.length
    SUBJECT_COLORS[subject] = JSON.stringify(PALETTE[idx])
  }
  return JSON.parse(SUBJECT_COLORS[subject]) as { text: string; bg: string }
}
