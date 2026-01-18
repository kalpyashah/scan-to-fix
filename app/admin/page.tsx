"use client"

import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Clock, Archive, Hammer, RefreshCw } from "lucide-react"

// --- SETUP SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabase = createClient(supabaseUrl, supabaseKey)

type Report = {
  id: number
  room_id: string
  issue: string
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const [activeJobs, setActiveJobs] = useState<Report[]>([])
  const [historyJobs, setHistoryJobs] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchReports()

    // 2. Setup Realtime Listener
    // This listens for NEW rows and INSTANTLY adds them to the list
    const channel = supabase
      .channel('realtime reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        const newReport = payload.new as Report
        setActiveJobs((current) => [newReport, ...current])
        playNotificationSound()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setActiveJobs(data.filter(r => r.status === 'Pending'))
      setHistoryJobs(data.filter(r => r.status === 'Completed'))
    }
    setLoading(false)
  }

  const markAsDone = async (id: number) => {
    // Optimistic Update (Update UI immediately to feel fast)
    const jobToMove = activeJobs.find(job => job.id === id)
    if (jobToMove) {
      setActiveJobs(activeJobs.filter(job => job.id !== id))
      setHistoryJobs([{ ...jobToMove, status: 'Completed' }, ...historyJobs])
    }

    // Update Database
    await supabase
      .from('reports')
      .update({ status: 'Completed' })
      .eq('id', id)
  }

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3') // You can add a sound file later if you want
    audio.play().catch(e => console.log("Audio play failed (user didn't interact yet)"))
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Hammer className="text-blue-600" /> Maintenance Dashboard
            </h1>
            <p className="text-gray-500">Live feed of incoming issues</p>
          </div>
          <button onClick={fetchReports} className="p-2 bg-white rounded-full shadow hover:bg-gray-50">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* ACTIVE JOBS SECTION */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="text-orange-500" /> To-Do List ({activeJobs.length})
          </h2>
          
          <div className="grid gap-4">
            {activeJobs.length === 0 && !loading && (
              <div className="p-8 text-center bg-white rounded-xl text-gray-400 border border-dashed border-gray-300">
                All caught up! No active issues.
              </div>
            )}

            {activeJobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-orange-500 flex justify-between items-center animate-in slide-in-from-top-2">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{job.room_id}</h3>
                  <p className="text-lg text-gray-600 font-medium">{job.issue}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Reported: {new Date(job.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => markAsDone(job.id)}
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark Done
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY SECTION */}
        <div className="opacity-60">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Archive className="text-gray-500" /> History
          </h2>
          <div className="space-y-3">
            {historyJobs.map((job) => (
              <div key={job.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                <span className="font-bold text-gray-600">{job.room_id}: {job.issue}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">COMPLETED</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}