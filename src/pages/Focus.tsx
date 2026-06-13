import { useEffect, useRef, useState } from 'react'

const TOTAL_SECONDS = 25 * 60
const CIRCUMFERENCE = 2 * Math.PI * 90

export default function Focus() {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  function reset() {
    setRunning(false)
    setSeconds(TOTAL_SECONDS)
  }

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const progress = seconds / TOTAL_SECONDS
  const offset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-white mb-1">Focus mode</h1>
      <p className="text-muted text-sm mb-8">25-minute Pomodoro sessions to power through your tasks.</p>

      <div className="bg-panel border border-line rounded-xl p-8 flex flex-col items-center max-w-md mx-auto">
        <div className="relative w-56 h-56">
          <svg className="w-56 h-56" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" stroke="#1F2533" strokeWidth="10" fill="none" />
            <circle
              cx="100" cy="100" r="90" stroke="#7AF6C7" strokeWidth="10" fill="none" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-5xl font-bold text-white">{minutes}:{secs.toString().padStart(2, '0')}</p>
            <p className="text-xs text-muted mt-1">Focus session</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setRunning((r) => !r)} className="bg-accent text-ink font-medium px-6 py-2.5 rounded-lg hover:bg-accent/90 transition flex items-center gap-2">
            <i className={`ti ${running ? 'ti-player-pause' : 'ti-player-play'} text-sm`}></i> {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={reset} className="border border-line px-6 py-2.5 rounded-lg text-sm hover:border-accent/40 transition">Reset</button>
        </div>
      </div>
    </div>
  )
}
