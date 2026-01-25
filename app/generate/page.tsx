"use client"

import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { Printer, MapPin, Monitor, Armchair } from "lucide-react"

export default function QRGenerator() {
  const [roomId, setRoomId] = useState("Class-101")
  const [type, setType] = useState<"class" | "lab">("class")
  const [baseUrl, setBaseUrl] = useState("")

  // Get the actual domain (localhost or vercel app)
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  // Construct the correct URL based on selection
  const targetUrl = type === "lab" 
    ? `${baseUrl}/lab?room=${roomId}` 
    : `${baseUrl}/?room=${roomId}`

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans flex flex-col items-center">
      
      {/* --- CONTROLS (Hidden when printing) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md mb-10 print:hidden space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center">QR Sticker Maker</h1>
        
        {/* Room Input */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Room Number</label>
          <input 
            type="text" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Type Toggle */}
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

        {/* Print Button */}
        <button onClick={() => window.print()} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
          <Printer className="w-5 h-5" /> Print Sticker
        </button>
      </div>

      {/* --- THE STICKER (This is what gets printed) --- */}
      <div className="print:absolute print:top-0 print:left-0 print:w-full print:h-full print:flex print:items-center print:justify-center">
        
        <div className={`relative w-[300px] h-[400px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 flex flex-col items-center text-center p-8 print:shadow-none print:border-4 ${type === 'lab' ? 'border-indigo-600' : 'border-blue-600'}`}>
          
          {/* Header */}
          <div className="mb-6">
            <h2 className={`text-3xl font-black uppercase tracking-tighter ${type === 'lab' ? 'text-indigo-600' : 'text-blue-600'}`}>
              Something<br/>Broken?
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Scan to Report</p>
          </div>

          {/* QR Code Area */}
          <div className="bg-white p-2 rounded-2xl">
            <QRCode 
              value={targetUrl} 
              size={180} 
              fgColor={type === 'lab' ? '#4f46e5' : '#2563eb'} // Indigo or Blue QR
            />
          </div>

          {/* Footer Room ID */}
          <div className={`mt-auto w-full py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xl ${type === 'lab' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
            <MapPin className="w-6 h-6" /> {roomId}
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:absolute, .print\\:absolute * { visibility: visible; }
          .print\\:absolute { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
          .print\\:hidden { display: none; }
          body { background: white; }
        }
      `}</style>

    </div>
  )
}