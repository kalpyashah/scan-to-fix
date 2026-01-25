"use client"

import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { Printer, MapPin, Monitor, Armchair } from "lucide-react"

export default function QRGenerator() {
  const [roomId, setRoomId] = useState("Class-101")
  const [type, setType] = useState<"class" | "lab">("class")
  const [baseUrl, setBaseUrl] = useState("")

  // Get the actual domain
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const targetUrl = type === "lab" 
    ? `${baseUrl}/lab?room=${roomId}` 
    : `${baseUrl}/?room=${roomId}`

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans flex flex-col items-center justify-center">
      
      {/* --- NO-PRINT AREA: CONTROLS --- */}
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md mb-10 print:hidden space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center">QR Sticker Maker</h1>
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Room Number</label>
          <input 
            type="text" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setType("class")}
            className={`p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === "class" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            <Armchair className="w-4 h-4" /> Classroom
          </button>
          <button 
            onClick={() => setType("lab")}
            className={`p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === "lab" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            <Monitor className="w-4 h-4" /> Lab
          </button>
        </div>

        <button onClick={() => window.print()} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
          <Printer className="w-5 h-5" /> Print Sticker
        </button>
        
        <p className="text-xs text-center text-slate-400">
          Note: Make sure "Background Graphics" is checked in your print settings if colors are missing.
        </p>
      </div>

      {/* --- PRINT AREA: THE STICKER --- */}
      {/* We center it on screen for preview, but control it via CSS for printing */}
      <div className="print-container">
        <div className={`sticker-card relative w-[300px] h-[420px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 flex flex-col items-center text-center p-8 print:shadow-none ${type === 'lab' ? 'border-indigo-600' : 'border-blue-600'}`}>
          
          {/* Header */}
          <div className="mb-6">
            <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-2 ${type === 'lab' ? 'text-indigo-600' : 'text-blue-600'}`}>
              Scan To<br/>Report
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Maintenance Request</p>
          </div>

          {/* QR Code Area */}
          <div className="bg-white p-2 rounded-xl mb-auto">
            <QRCode 
              value={targetUrl} 
              size={160} 
              fgColor={type === 'lab' ? '#4f46e5' : '#2563eb'} 
            />
          </div>

          {/* Footer Room ID */}
          <div className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-2xl print-color-force ${type === 'lab' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
            <MapPin className="w-6 h-6" /> {roomId}
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          /* 1. Hide the Next.js wrapper and body padding */
          body {
            background: white;
            padding: 0;
            margin: 0;
          }
          
          /* 2. Hide all non-print elements explicitly */
          .print\\:hidden {
            display: none !important;
          }

          /* 3. Center the sticker on the paper */
          .print-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* 4. FORCE BACKGROUND COLORS (The Magic Fix) */
          .sticker-card, .print-color-force {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

    </div>
  )
}