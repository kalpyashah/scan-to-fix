"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Fan, Snowflake, Lightbulb, Plug, Projector, CheckCircle, Loader2, AlertCircle, X, Bell, Clock, ChevronDown, ChevronUp, History, PenTool } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabase = createClient(supabaseUrl, supabaseKey)

function HomeContent() {
  const searchParams = useSearchParams()
  const roomName = searchParams.get("room") || "Unknown Area"
  
  // STATE
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [customText, setCustomText] = useState("") // <--- NEW: For "Other" text
  const [status, setStatus] = useState("idle") 
  const [liveUpdate, setLiveUpdate] = useState<string | null>(null)
  
  // DATA LISTS
  const [pendingIssues, setPendingIssues] = useState<string[]>([]) 
  const [solvedHistory, setSolvedHistory] = useState<any[]>([])   
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

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
    const { data: pending } = await supabase.from('reports').select('issue').eq('room_id', roomName).eq('status', 'Pending')
    if (pending) setPendingIssues(pending.map(p => p.issue))

    const { data: history } = await supabase.from('reports').select('*').eq('room_id', roomName).eq('status', 'Completed').order('solved_at', { ascending: false })
    if (history) setSolvedHistory(history)
  }

  const handleRealtimeEvent = (payload: any) => {
    fetchRoomData()
    if (payload.eventType === 'UPDATE' && payload.new.status === 'Completed') {
      // If it was a custom issue, clean up the name for the alert
      const cleanIssue = payload.new.issue.startsWith("Other: ") ? "Issue" : payload.new.issue
      setLiveUpdate(cleanIssue)
      setTimeout(() => setLiveUpdate(null), 6000)
    }
  }

  const handleSubmit = async () => {
    if (!selectedIssue) return
    
    // Validate Custom Text
    if (selectedIssue === "Other" && customText.trim() === "") {
      alert("Please describe the issue.")
      return
    }

    setStatus("submitting")

    // Construct the Final Issue String
    // If "Other", save as "Other: Broken Chair". If "Fan", save as "Fan"
    const finalIssue = selectedIssue === "Other" ? `Other: ${customText}` : selectedIssue

    try {
      const { error } = await supabase
        .from('reports')
        .insert([{ room_id: roomName, issue: finalIssue, status: 'Pending' }])

      if (error) throw error
      
      setStatus("success")
      setPendingIssues([...pendingIssues, finalIssue]) 
      
      // Reset
      setSelectedIssue(null) 
      setCustomText("")
      setTimeout(() => setStatus("idle"), 4000) 
      
    } catch (error) {
      console.error("Error reporting:", error)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently"
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  // Duplicate Check Logic
  // We ONLY block duplicates for standard items (Fan, AC). 
  // We allow multiple "Other" reports because they might be different things.
  const isDuplicate = selectedIssue !== "Other" && selectedIssue && pendingIssues.includes(selectedIssue)

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-48"> {/* Increased padding for larger footer */}
      
      {/* TOAST */}
      {status === "success" && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-green-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm bg-opacity-95">
            <div className="bg-white/20 p-2 rounded-full"><CheckCircle className="w-6 h-6 text-white" /></div>
            <div className="flex-1"><h3 className="font-bold text-lg">Report Sent!</h3><p className="text-green-100 text-sm">Technicians have been notified.</p></div>
            <button onClick={() => setStatus("idle")} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* LIVE ALERT */}
      {liveUpdate && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-white text-slate-800 border-l-4 border-blue-600 p-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full"><Bell className="w-6 h-6 text-blue-600 animate-pulse" /></div>
            <div className="flex-1"><h3 className="font-bold text-lg">Good News!</h3><p className="text-slate-500 text-sm">Technician just fixed the <strong>{liveUpdate}</strong>.</p></div>
            <button onClick={() => setLiveUpdate(null)} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 px-6 py-10 pb-16 rounded-b-[2.5rem] shadow-lg relative overflow-hidden z-10">
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Current Location</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{roomName}</h1>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20">
        
        {/* HISTORY DROPDOWN */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 text-gray-700 font-bold"><History className="w-5 h-5 text-blue-500" /> Past Repairs</div>
            <div className="flex items-center gap-2"><span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">{solvedHistory.length}</span>{isHistoryOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</div>
          </button>
          {isHistoryOpen && (
            <div className="max-h-48 overflow-y-auto bg-gray-50 border-t border-gray-100">
              {solvedHistory.length === 0 ? <p className="p-4 text-center text-sm text-gray-400">No repair history yet.</p> : solvedHistory.map((job) => (
                <div key={job.id} className="p-3 border-b border-gray-100 flex justify-between items-center last:border-0">
                  <span className="text-gray-700 font-medium ml-2">{job.issue.replace("Other: ", "")}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200"><Clock className="w-3 h-3" /> {formatDate(job.solved_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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

      {/* 4. SMART STICKY FOOTER */}
      {selectedIssue && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-4 z-40">
          
          {/* TEXT INPUT (Only shows if 'Other' is selected) */}
          {selectedIssue === "Other" && (
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Describe the issue</label>
              <input 
                autoFocus
                type="text" 
                placeholder="e.g. Broken window handle..." 
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 font-medium"
              />
            </div>
          )}

          {isDuplicate ? (
            // DUPLICATE WARNING
            <div className="w-full bg-orange-100 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-center justify-center gap-3 shadow-sm">
              <Loader2 className="animate-spin text-orange-600" />
              <div className="text-left"><p className="font-bold text-sm">Work in Progress</p><p className="text-xs opacity-80">Someone already reported this issue.</p></div>
            </div>
          ) : (
            // SUBMIT BUTTON
            <button
              onClick={handleSubmit}
              disabled={status === "submitting" || (selectedIssue === "Other" && customText.length < 3)}
              className="w-full bg-blue-600 disabled:bg-gray-300 text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
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
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 border 
        ${isSelected ? "bg-blue-50 border-blue-500 shadow-inner scale-95 ring-2 ring-blue-500 ring-offset-2" : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md"}`}
    >
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