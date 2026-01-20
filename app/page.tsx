"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Fan, Snowflake, Lightbulb, Plug, Projector, CheckCircle, Loader2, AlertCircle } from "lucide-react"
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
      setStatus("success")
      
    } catch (error) {
      console.error("Error reporting:", error)
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6 text-center animate-in zoom-in-95">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Report Sent!</h1>
        <p className="text-gray-600 mb-8">Maintenance has been notified about the {roomName}.</p>
        <button 
          onClick={() => { setStatus("idle"); setSelectedIssue(null); }}
          className="bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
        >
          Report Another Issue
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-32"> {/* Added pb-32 for scroll space */}
      
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
            <IssueButton 
              icon={<Fan />} label="Fan" 
              isSelected={selectedIssue === "Fan"} 
              onClick={() => setSelectedIssue("Fan")} 
            />
            <IssueButton 
              icon={<Snowflake />} label="AC" 
              isSelected={selectedIssue === "AC"} 
              onClick={() => setSelectedIssue("AC")} 
            />
            <IssueButton 
              icon={<Lightbulb />} label="Light" 
              isSelected={selectedIssue === "Light"} 
              onClick={() => setSelectedIssue("Light")} 
            />
            <IssueButton 
              icon={<Plug />} label="Socket" 
              isSelected={selectedIssue === "Socket"} 
              onClick={() => setSelectedIssue("Socket")} 
            />
            <IssueButton 
              icon={<Projector />} label="Projector" 
              isSelected={selectedIssue === "Projector"} 
              onClick={() => setSelectedIssue("Projector")} 
            />
            <IssueButton 
              icon={<Loader2 />} label="Other" 
              isSelected={selectedIssue === "Other"} 
              onClick={() => setSelectedIssue("Other")} 
            />
          </div>
        </div>
      </div>

      {/* STICKY SUBMIT BUTTON */}
      {selectedIssue && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-2xl animate-in slide-in-from-bottom-4 z-50">
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