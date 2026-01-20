"use client"

import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Clock, Hammer, RefreshCw, BarChart3, MapPin } from "lucide-react"

// --- SUPABASE SETUP ---
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

  useEffect(() => {
    fetchReports()
    const channel = supabase
      .channel('realtime reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        setActiveJobs((prev) => [payload.new as Report, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (data) {
      setActiveJobs(data.filter(r => r.status === 'Pending'))
      setHistoryJobs(data.filter(r => r.status === 'Completed'))
    }
    setLoading(false)
  }

  const markAsDone = async (id: number) => {
    const job = activeJobs.find(j => j.id === id)
    if (job) {
      setActiveJobs(activeJobs.filter(j => j.id !== id))
      setHistoryJobs([{ ...job, status: 'Completed' }, ...historyJobs])
      await supabase.from('reports').update({ status: 'Completed' }).eq('id', id)
    }
  }

  // --- NEW: DATE FORMATTER HELPER ---
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Hammer className="text-blue-400" /> Maintenance<span className="text-slate-400">Admin</span>
          </div>
          <button onClick={fetchReports} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Pending" value={activeJobs.length} color="bg-orange-500" icon={<Clock />} />
          <StatCard title="Completed" value={historyJobs.length} color="bg-green-500" icon={<CheckCircle />} />
          <StatCard title="Total Reports" value={activeJobs.length + historyJobs.length} color="bg-blue-500" icon={<BarChart3 />} />
        </div>

        {/* ACTIVE JOBS */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div> 
            Live Issues
          </h2>

          <div className="grid gap-3">
            {activeJobs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                No active issues. Good job!
              </div>
            ) : (
              // THIS IS THE CORRECTED MAP SECTION
              activeJobs.map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-l-orange-500 flex justify-between items-center group hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">
                      <MapPin className="w-3 h-3" /> {job.room_id}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{job.issue}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 bg-slate-100 inline-block px-2 py-1 rounded">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                  <button onClick={() => markAsDone(job.id)} className="bg-slate-100 hover:bg-green-500 hover:text-white text-slate-600 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Done
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="opacity-70 hover:opacity-100 transition-opacity">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Recent History</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {historyJobs.slice(0, 10).map((job) => (
              <div key={job.id} className="p-4 border-b border-slate-100 flex justify-between items-center hover:bg-slate-50">
                <span className="font-medium text-slate-600">{job.room_id}: {job.issue}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">FIXED</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg text-white ${color} shadow-lg shadow-${color}/30`}>{icon}</div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  )
}