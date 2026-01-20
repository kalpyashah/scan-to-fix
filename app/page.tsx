"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Fan, Snowflake, Lightbulb, Plug, Projector, CheckCircle, Loader2, AlertCircle, X } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabase = createClient(supabaseUrl, supabaseKey)

function HomeContent() {
  const searchParams = useSearchParams()
  const roomName = searchParams.get("room") || "Unknown Area"
  
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [status, setStatus] = useState("idle") // idle | submitting | success | error

  const handleSubmit = async () => {
    if (!selectedIssue) return
    setStatus("submitting")

    try {
      const { error } = await supabase
        .from('reports')
        .insert([{ room_id: roomName, issue: selectedIssue, status: 'Pending' }])

      if (error) throw error
      
      // Show success state
      setStatus("success")
      setSelectedIssue(null) // Reset selection
      
      // Auto-hide the success message after 4 seconds
      setTimeout(() => setStatus("idle"), 4000)
      
    } catch (error) {
      console.error("Error reporting:", error)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-32">
      
      {/* TOAST NOTIFICATION (Pop-up) */}
      {status === "success" && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="bg-green-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm bg-opacity-95">
            <div className="bg-white/20 p-2 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Report Sent!</h3>
              <p className="text-green-100 text-sm">Maintenance has been notified.</p>
            </div>
            <button onClick={() => setStatus("idle")} className="p-1 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 px-6 py-10 pb-16 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Current Location</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{roomName}</h1>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-gray-800 font-bold text-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            What is broken?
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <IssueButton icon={<Fan />} label="Fan" isSelected={selectedIssue === "Fan"} onClick={() => setSelectedIssue("Fan")} />
            <IssueButton icon={<Snowflake />} label="AC" isSelected={selectedIssue === "AC"} onClick={() => setSelectedIssue("AC")} />
            <IssueButton icon={<Lightbulb />} label="Light" isSelected={selectedIssue === "Light"} onClick={() => setSelectedIssue("Light")} />
            <IssueButton icon={<Plug />} label="Socket" isSelected={selectedIssue === "Socket"} onClick={() => setSelectedIssue("Socket")} />
            <IssueButton icon={<Projector />} label="Projector" isSelected={selectedIssue === "Projector"} onClick={() => setSelectedIssue("Projector")} />
            <IssueButton icon={<Loader2 />} label="Other" isSelected={selectedIssue === "Other"} onClick={() => setSelectedIssue("Other")} />
          </div>
        </div>
      </div>

      {/* STICKY SUBMIT BUTTON */}
      {selectedIssue && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-4 z-40">
          <button
            onClick={handleSubmit}
            disabled={status === "submitting"}
            className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {status === "submitting" ? <Loader2 className="animate-spin" /> : "Submit Report"}
          </button>
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
        ${isSelected 
          ? "bg-blue-50 border-blue-500 shadow-inner scale-95 ring-2 ring-blue-500 ring-offset-2" 
          : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md"}`}
    >
      <div className={`transition-colors [&>svg]:w-8 [&>svg]:h-8 ${isSelected ? "text-blue-600" : "text-gray-400"}`}>
        {icon}
      </div>
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