"use client"

import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { Printer, MapPin, Monitor, Armchair, Link as LinkIcon } from "lucide-react"

export default function QRGenerator() {
  const [roomId, setRoomId] = useState("CE-F1")
  const [type, setType] = useState<"class" | "lab">("lab") 
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const targetUrl = type === "lab" 
    ? `${baseUrl}/lab?room=${roomId}` 
    : `${baseUrl}/?room=${roomId}`

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans flex flex-col items-center justify-center">
      
      {/* --- CONTROLS --- */}
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
            className={`p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === "class" ? "bg-blue-600 text-white ring-2 ring-blue-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            <Armchair className="w-4 h-4" /> Classroom
          </button>
          <button 
            onClick={() => setType("lab")}
            className={`p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === "lab" ? "bg-indigo-600 text-white ring-2 ring-indigo-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            <Monitor className="w-4 h-4" /> Lab
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 break-all">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Encoded URL:</p>
          <div className="text-xs font-mono text-blue-600 flex gap-2 items-center">
             <LinkIcon className="w-3 h-3 flex-shrink-0" />
             {targetUrl}
          </div>
        </div>

        <button onClick={() => window.print()} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
          <Printer className="w-5 h-5" /> Print Sticker
        </button>
      </div>

      {/* --- PRINT PREVIEW --- */}
      <div className="print-container">
        <div className={`sticker-card relative w-[300px] h-[420px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 flex flex-col items-center text-center p-8 print:shadow-none ${type === 'lab' ? 'border-indigo-600' : 'border-blue-600'}`}>
          
          <div className="mb-6">
            <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-2 ${type === 'lab' ? 'text-indigo-600' : 'text-blue-600'}`}>
              Scan To<br/>Report
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Maintenance Request</p>
          </div>

          <div className="bg-white p-2 rounded-xl mb-auto">
            <QRCode 
              key={targetUrl} 
              value={targetUrl} 
              size={160} 
              fgColor={type === 'lab' ? '#4f46e5' : '#2563eb'} 
            />
          </div>

          <div className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-2xl print-color-force ${type === 'lab' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
            <MapPin className="w-6 h-6" /> {roomId}
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          /* 1. RESET PAGE MARGINS (The Critical Fix) */
          @page {
            size: auto;
            margin: 0mm;
          }

          /* 2. Hide Non-Print Stuff */
          body { background: white; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }

          /* 3. Center the Card Perfectly */
          .print-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            z-index: 9999;
          }

          /* 4. Prevent Splitting & Force Colors */
          .sticker-card {
            page-break-inside: avoid;
            break-inside: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: scale(1); /* Ensure no weird zoom */
          }
          .print-color-force {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}