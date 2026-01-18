"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Fan, Snowflake, Lightbulb, Plug, Projector, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabase = createClient(supabaseUrl, supabaseKey)

function HomeContent() {
  const searchParams = useSearchParams()
  // If no room is in the QR code, default to "Unknown Area"
  const roomName = searchParams.get("room") || "Select Area"
  
  const [status, setStatus] = useState("idle") // idle | submitting | success | error
  const [recentFix, setRecentFix] = useState<string | null>(null)

  // 1. On Load: Check if anything was recently fixed in this room
  useEffect(() => {
    checkRecentFixes()
  }, [roomName])

  const checkRecentFixes = async () => {
    if (roomName === "Select Area") return

    // Look for reports in this room, marked 'Completed' in the last 24 hours
    const { data } = await supabase
      .from('reports')
      .select('issue, created_at')
      .eq('room_id', roomName)
      .eq('status', 'Completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      setRecentFix(data[0].issue)
    }
  }

  const handleReport = async (issue: string) => {
    setStatus("submitting")

    try {
      const { error } = await supabase
        .from('reports')
        .insert([
          { 
            room_id: roomName, 
            issue: issue,
            status: 'Pending' 
          }
        ])

      if (error) throw error
      setStatus("success")
      
    } catch (error) {
      console.error("Error reporting:", error)
      setStatus("error")
    }
  }

  // --- SUCCESS SCREEN ---
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6 text-center animate-in zoom-in-95">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Report Sent!</h1>
        <p className="text-gray-600 mb-8">Maintenance has been notified about the {roomName}.</p>
        <button 
          onClick={() => setStatus("idle")}
          className="bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
        >
          Report Another Issue
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header */}
      <div className="bg-blue-600 px-6 py-8 pb-12 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Current Location</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{roomName}</h1>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-20 pb-10">
        
        {/* NOTIFICATION: If something was just fixed */}
        {recentFix && (
          <div className="bg-green-100 border border-green-200 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-4">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-800">Recently Repaired!</h3>
              <p className="text-sm text-green-700">Technicians marked the <strong>{recentFix}</strong> in this room as fixed.</p>
            </div>
          </div>
        )}

        {/* Action Grid */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-gray-800 font-bold text-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            What is broken?
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <IssueButton icon={<Fan />} label="Fan" onClick={() => handleReport("Fan")} disabled={status === "submitting"} />
            <IssueButton icon={<Snowflake />} label="AC" onClick={() => handleReport("AC")} disabled={status === "submitting"} />
            <IssueButton icon={<Lightbulb />} label="Light" onClick={() => handleReport("Light")} disabled={status === "submitting"} />
            <IssueButton icon={<Plug />} label="Socket" onClick={() => handleReport("Socket")} disabled={status === "submitting"} />
            <IssueButton icon={<Projector />} label="Projector" onClick={() => handleReport("Projector")} disabled={status === "submitting"} />
            <IssueButton icon={<Loader2 className="animate-spin" />} label="Other" onClick={() => handleReport("Other")} disabled={status === "submitting"} />
          </div>
        </div>
      </div>
    </main>
  )
}

// Reusable Button Component
function IssueButton({ icon, label, onClick, disabled }: { icon: any, label: string, onClick: () => void, disabled: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-blue-50 active:scale-95 border border-gray-100 hover:border-blue-200 p-6 rounded-2xl transition-all duration-200 group"
    >
      <div className="text-gray-400 group-hover:text-blue-500 transition-colors [&>svg]:w-8 [&>svg]:h-8">
        {icon}
      </div>
      <span className="font-semibold text-gray-700 group-hover:text-blue-700">{label}</span>
    </button>
  )
}

// Loading Fallback (Required for Next.js Suspense)
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}