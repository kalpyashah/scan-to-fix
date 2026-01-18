"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation" 
import { Fan, Snowflake, Lightbulb, Plug, Projector, CheckCircle, Loader2 } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// --- SETUP SUPABASE ---
// (We initialize this outside the component to avoid recreating it on every render)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabase = createClient(supabaseUrl, supabaseKey)
// --- PART 1: THE REAL CONTENT ---
// This component reads the URL, so it MUST be wrapped in Suspense later.
function ReportForm() {
  const searchParams = useSearchParams()
  const roomID = searchParams.get("room") || "Scan a QR Code"
  
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const issues = [
    { id: "fan", label: "Fan Issue", icon: Fan },
    { id: "ac", label: "AC / Cooling", icon: Snowflake },
    { id: "light", label: "Lights / Tubelight", icon: Lightbulb },
    { id: "socket", label: "Socket / Plug", icon: Plug },
    { id: "projector", label: "Projector", icon: Projector },
  ]

  const handleSubmit = async () => {
    if (!selectedIssue) return alert("Please select an issue first.")
    
    setIsSubmitting(true)

    try {
      // Send data to Supabase
      const { error } = await supabase
        .from('reports')
        .insert([
          { 
            room_id: roomID, 
            issue: selectedIssue, 
            status: 'Pending' 
            // created_at is auto-handled by Supabase usually
          },
        ])

      if (error) throw error

      setIsSuccess(true)
    } catch (err) {
      console.error("Error submitting:", err)
      alert("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-6 rounded-full shadow-lg mb-6">
           <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Report Sent!</h1>
        <p className="text-gray-600 max-w-xs mx-auto">
          Maintenance has been notified about the <strong>{selectedIssue}</strong> in <strong>{roomID}</strong>.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3 bg-green-600 text-white rounded-full font-bold shadow-md hover:bg-green-700 transition-colors"
        >
          Report Another Issue
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-blue-600 p-8 pt-12 text-white rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Campus Maintenance</p>
        <h1 className="text-4xl font-extrabold tracking-tight">{roomID}</h1>
        <p className="text-blue-100 mt-2 text-sm opacity-90">What needs fixing today?</p>
      </div>

      {/* Grid of Options */}
      <div className="flex-1 p-6 -mt-2">
        <div className="grid grid-cols-2 gap-4">
          {issues.map((item) => {
            const Icon = item.icon
            const isSelected = selectedIssue === item.label
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIssue(item.label)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-200 shadow-sm group
                  ${isSelected 
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200 scale-[1.02]" 
                    : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:shadow-md"
                  }`}
              >
                <div className={`p-3 rounded-full mb-3 transition-colors ${isSelected ? "bg-blue-200" : "bg-gray-100 group-hover:bg-blue-50"}`}>
                   <Icon className={`w-8 h-8 ${isSelected ? "text-blue-700" : "text-gray-500 group-hover:text-blue-600"}`} />
                </div>
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-6 bg-white border-t border-gray-100 safe-area-pb">
        <button
          onClick={handleSubmit}
          disabled={!selectedIssue || isSubmitting}
          className={`w-full py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
            ${!selectedIssue 
              ? "bg-gray-300 cursor-not-allowed" 
              : isSubmitting 
                ? "bg-blue-400 cursor-wait" 
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            "Submit Report"
          )}
        </button>
      </div>
    </div>
  )
}

// --- PART 2: THE MAIN PAGE WRAPPER ---
// This handles the "Loading..." state while checking the URL
export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    }>
      <ReportForm />
    </Suspense>
  )
}