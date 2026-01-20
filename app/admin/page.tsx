"use client"

import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Clock, Hammer, RefreshCw, BarChart3, MapPin, Search, ChevronDown, ChevronUp, X, Calendar, Lock, LogOut } from "lucide-react"

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabase = createClient(supabaseUrl, supabaseKey)

// --- CONFIG ---
const ADMIN_PIN = "2024" // <--- CHANGE THIS TO YOUR DESIRED PIN

type Report = {
  id: number
  room_id: string
  issue: string
  status: string
  created_at: string
  solved_at: string | null
}

export default function AdminDashboard() {
  // AUTH STATE
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState("")
  
  // DASHBOARD STATE
  const [activeJobs, setActiveJobs] = useState<Report[]>([])
  const [historyJobs, setHistoryJobs] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJob, setSelectedJob] = useState<Report | null>(null)

  // 1. CHECK LOGIN ON LOAD
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_access")
    if (savedToken === "granted") {
      setIsAuthenticated(true)
      fetchReports() // Start fetching immediately if logged in
      setupRealtime()
    }
  }, [])

  // 2. SETUP REALTIME (Moved to function so we call it only after login)
  const setupRealtime = () => {
    const channel = supabase
      .channel('realtime reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        setActiveJobs((prev) => [payload.new as Report, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true)
      localStorage.setItem("admin_access", "granted")
      fetchReports()
      setupRealtime()
    } else {
      alert("Incorrect PIN access denied.")
      setPinInput("")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("admin_access")
    setPinInput("")
  }

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
      const solvedTime = new Date().toISOString()
      setActiveJobs(activeJobs.filter(j => j.id !== id))
      setHistoryJobs([{ ...job, status: 'Completed', solved_at: solvedTime }, ...historyJobs])
      
      await supabase
        .from('reports')
        .update({ status: 'Completed', solved_at: solvedTime })
        .eq('id', id)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
  }

  const filteredHistory = historyJobs.filter(job => 
    job.room_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.issue.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // --- LOGIN SCREEN RENDER ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Technician Access</h1>
          <p className="text-slate-500 mb-6 text-sm">Enter security PIN to view dashboard</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="••••" 
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-3xl font-bold tracking-[1em] p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none mb-6 text-slate-800 placeholder:tracking-normal placeholder:text-slate-300"
            />
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      
      {/* DETAILS POPUP */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-white text-2xl font-bold flex items-center gap-2"><CheckCircle className="text-green-400" /> Completed</h2>
                <p className="text-slate-400 mt-1">{selectedJob.room_id}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <div className="p-6 space-y-6">
              <div><label className="text-xs font-bold text-slate-400 uppercase">Issue</label><p className="text-xl font-bold text-slate-800">{selectedJob.issue}</p></div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Issued</label><p className="font-semibold text-slate-700 mt-1">{formatDate(selectedJob.created_at)}</p></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Solved</label><p className="font-semibold text-green-700 mt-1">{selectedJob.solved_at ? formatDate(selectedJob.solved_at) : "Unknown"}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Hammer className="text-blue-400" /> Maintenance<span className="text-slate-400">Admin</span>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchReports} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
            {/* LOGOUT BUTTON */}
            <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-full transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Pending" value={activeJobs.length} color="bg-orange-500" icon={<Clock />} />
          <StatCard title="Completed" value={historyJobs.length} color="bg-green-500" icon={<CheckCircle />} />
          <StatCard title="Total" value={activeJobs.length + historyJobs.length} color="bg-blue-500" icon={<BarChart3 />} />
        </div>

        {/* ACTIVE JOBS */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div> Live Issues</h2>
          <div className="grid gap-3">
            {activeJobs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">No active issues.</div>
            ) : (
              activeJobs.map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-l-orange-500 flex justify-between items-center group hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide mb-1"><MapPin className="w-3 h-3" /> {job.room_id}</div>
                    <h3 className="text-lg font-bold text-slate-800">{job.issue}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 bg-slate-100 inline-block px-2 py-1 rounded">{formatDate(job.created_at)}</p>
                  </div>
                  <button onClick={() => markAsDone(job.id)} className="bg-slate-100 hover:bg-green-500 hover:text-white text-slate-600 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Done</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2"><CheckCircle className="text-green-500 w-5 h-5" /> History Log</h2>
            {isHistoryOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
          </button>
          {isHistoryOpen && (
            <div className="p-5 border-t border-slate-200 animate-in slide-in-from-top-2">
              <div className="relative mb-6"><Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" /></div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {filteredHistory.map((job) => (
                  <div key={job.id} onClick={() => setSelectedJob(job)} className="p-4 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group">
                    <div><span className="font-bold text-slate-700">{job.room_id}</span><span className="text-slate-400 mx-2">•</span><span className="text-slate-600">{job.issue}</span></div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">View</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg text-white ${color} shadow-lg shadow-${color}/30`}>{icon}</div>
      <div><p className="text-slate-400 text-xs font-bold uppercase">{title}</p><p className="text-2xl font-black text-slate-800">{value}</p></div>
    </div>
  )
}