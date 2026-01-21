"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Fan, Snowflake, Lightbulb, Plug, Projector, CheckCircle, Loader2, AlertCircle, X, Bell, Clock, History, PenTool, Calendar, ChevronRight } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabase = createClient(supabaseUrl, supabaseKey)

// TYPES
type Report = {
  id: number
  issue: string
  created_at: string
  solved_at: string
  status: string
}

function HomeContent() {
  const searchParams = useSearchParams()
  const roomName = searchParams.get("room") || "Unknown Area"
  
  // STATE
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [customText, setCustomText] = useState("") 
  const [status, setStatus] = useState("idle") 
  const [liveUpdate, setLiveUpdate] = useState<string | null>(null)
  
  // DATA
  const [pendingIssues, setPendingIssues] = useState<string[]>([]) 
  const [recentHistory, setRecentHistory] = useState<Report[]>([]) // Last 24h
  const [fullHistory, setFullHistory] = useState<Report[]>([])     // Everything else
  
  // MODALS
  const [isHistoryOpen, setIsHistoryOpen] = useState(false) // Toggle full history view
  const [viewJob, setViewJob] = useState<Report | null>(null) // The specific job clicked

  // 1. ON LOAD
  useEffect(() => {
    fetchRoomData()
    const channel = supabase
      .channel('room-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `room_id=eq.${roomName}` }, (payload) => {
        handleRealtimeEvent(payload)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomName])

  const fetchRoomData = async () => {
    if (roomName === "Unknown Area") return
    
    // 1. Pending
    const { data: pending } = await supabase.from('reports').select('issue').eq('room_id', roomName).eq('status', 'Pending')
    if (pending) setPendingIssues(pending.map(p => p.issue))

    // 2. All History
    const { data: history } = await supabase.from('reports').select('*').eq('room_id', roomName).eq('status', 'Completed').order('solved_at', { ascending: false })
    
    if (history) {
      // Split into "Recent (24h)" and "Older"
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      setRecentHistory(history.filter(h => h.solved_at > oneDayAgo))
      setFullHistory(history)
    }
  }

  const handleRealtimeEvent = (payload: any) => {
    fetchRoomData()
    if (payload.eventType === 'UPDATE' && payload.new.status === 'Completed') {
      const cleanIssue = payload.new.issue.startsWith("Other: ") ? "Issue" : payload.new.issue
      setLiveUpdate(cleanIssue)
      setTimeout(() => setLiveUpdate(null), 6000)
    }
  }

  const handleSubmit = async () => {
    if (!selectedIssue) return
    if (selectedIssue === "Other" && customText.trim() === "") { alert("Please describe the issue."); return }

    setStatus("submitting")
    const finalIssue = selectedIssue === "Other" ? `Other: ${customText}` : selectedIssue

    try {
      const { error } = await supabase.from('reports').insert([{ room_id: roomName, issue: finalIssue, status: 'Pending' }])
      if (error) throw error
      setStatus("success")
      setPendingIssues([...pendingIssues, finalIssue]) 
      setSelectedIssue(null) 
      setCustomText("")
      setTimeout(() => setStatus("idle"), 4000) 
    } catch (error) {
      console.error("Error reporting:", error)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  // Helper for cleaner dates
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
    })
  }

  const isDuplicate = selectedIssue !== "Other" && selectedIssue && pendingIssues.includes(selectedIssue)

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-48 relative">
      
      {/* --- MODAL: JOB DETAILS --- */}
      {viewJob && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-slate-900 p-6 flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Repair Details</p>
                <h2 className="text-white text-xl font-bold">{viewJob.issue.replace("Other: ", "")}</h2>
              </div>
              <button onClick={() => setViewJob(null)} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Timeline */}
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 py-2">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Reported On</label>
                  <p className="text-slate-800 font-semibold">{formatDateTime(viewJob.created_at)}</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg shadow-green-200"></div>
                  <label className="text-xs font-bold text-green-600 uppercase">Fixed On</label>
                  <p className="text-slate-800 font-semibold">{formatDateTime(viewJob.solved_at)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button onClick={() => setViewJob(null)} className="text-slate-500 font-semibold text-sm hover:text-slate-800">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: FULL HISTORY LIST --- */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[50] bg-gray-50 flex flex-col animate-in slide-in-from-bottom-10">
          <div className="bg-white px-6 py-6 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0">
            <h2 className="text-xl font-bold text-slate-800">Repair History</h2>
            <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-6 h-6 text-gray-600" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {fullHistory.length === 0 ? <p className="text-center text-gray-400 mt-10">No records found.</p> : fullHistory.map(job => (
              <div key={job.id} onClick={() => setViewJob(job)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-95 transition-transform">
                <div>
                  <p className="font-semibold text-slate-700">{job.issue.replace("Other: ", "")}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(job.solved_at).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOASTS & ALERTS */}
      {status === "success" && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-green-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm bg-opacity-95">
            <CheckCircle className="w-6 h-6 text-white" />
            <div className="flex-1"><h3 className="font-bold text-lg">Sent!</h3><p className="text-green-100 text-sm">Report submitted.</p></div>
            <button onClick={() => setStatus("idle")}><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}
      {liveUpdate && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-white text-slate-800 border-l-4 border-blue-600 p-4 rounded-xl shadow-2xl flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600 animate-pulse" />
            <div className="flex-1"><h3 className="font-bold text-lg">Just Fixed!</h3><p className="text-slate-500 text-sm">Technician fixed the <strong>{liveUpdate}</strong>.</p></div>
            <button onClick={() => setLiveUpdate(null)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-blue-600 px-6 py-10 pb-20 rounded-b-[2.5rem] shadow-lg relative overflow-hidden z-10">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Location</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{roomName}</h1>
          </div>
          {/* HISTORY BUTTON */}
          <button onClick={() => setIsHistoryOpen(true)} className="bg-blue-500/50 p-3 rounded-xl hover:bg-blue-500 text-white transition-colors backdrop-blur-md border border-blue-400/30">
            <History className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-14 relative z-20 space-y-6">
        
        {/* RECENT UPDATES (Last 24h) */}
        {recentHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Updates (24h)
            </h2>
            <div className="space-y-3">
              {recentHistory.map((job) => (
                <div key={job.id} onClick={() => setViewJob(job)} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                    <span className="font-bold text-slate-700">{job.issue.replace("Other: ", "")}</span>
                  </div>
                  <span className="text-xs text-blue-400 font-medium">View</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ISSUE GRID */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-gray-800 font-bold text-lg mb-6 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-500" /> What is broken?</h2>
          <div className="grid grid-cols-2 gap-4">
            <IssueButton icon={<Fan />} label="Fan" isSelected={selectedIssue === "Fan"} onClick={() => setSelectedIssue("Fan")} />
            <IssueButton icon={<Snowflake />} label="AC" isSelected={selectedIssue === "AC"} onClick={() => setSelectedIssue("AC")} />
            <IssueButton icon={<Lightbulb />} label="Light" isSelected={selectedIssue === "Light"} onClick={() => setSelectedIssue("Light")} />
            <IssueButton icon={<Plug />} label="Socket" isSelected={selectedIssue === "Socket"} onClick={() => setSelectedIssue("Socket")} />
            <IssueButton icon={<Projector />} label="Projector" isSelected={selectedIssue === "Projector"} onClick={() => setSelectedIssue("Projector")} />
            <IssueButton icon={<PenTool />} label="Other" isSelected={selectedIssue === "Other"} onClick={() => setSelectedIssue("Other")} />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      {selectedIssue && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-4 z-40">
          {selectedIssue === "Other" && (
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Describe the issue</label>
              <input autoFocus type="text" placeholder="e.g. Broken window handle..." value={customText} onChange={(e) => setCustomText(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 font-medium" />
            </div>
          )}
          {isDuplicate ? (
            <div className="w-full bg-orange-100 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-center justify-center gap-3 shadow-sm">
              <Loader2 className="animate-spin text-orange-600" />
              <div className="text-left"><p className="font-bold text-sm">Work in Progress</p><p className="text-xs opacity-80">Already reported.</p></div>
            </div>
          ) : (
            <button onClick={handleSubmit} disabled={status === "submitting" || (selectedIssue === "Other" && customText.length < 3)} className="w-full bg-blue-600 disabled:bg-gray-300 text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              {status === "submitting" ? <Loader2 className="animate-spin" /> : "Submit Report"}
            </button>
          )}
        </div>
      )}
    </main>
  )
}

function IssueButton({ icon, label, isSelected, onClick }: { icon: any, label: string, isSelected: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 border ${isSelected ? "bg-blue-50 border-blue-500 shadow-inner scale-95 ring-2 ring-blue-500 ring-offset-2" : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md"}`}>
      <div className={`transition-colors [&>svg]:w-8 [&>svg]:h-8 ${isSelected ? "text-blue-600" : "text-gray-400"}`}>{icon}</div>
      <span className={`font-semibold ${isSelected ? "text-blue-700" : "text-gray-700"}`}>{label}</span>
    </button>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}