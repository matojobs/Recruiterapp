'use client'

import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

function normalizePhone(raw = ''): string {
  const d = raw.replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

interface CallButtonProps {
  phone: string | null | undefined
  /** 'inline' = small phone link + QR toggle (tables); 'block' = full panel (modals) */
  variant?: 'inline' | 'block'
}

/**
 * Click-to-call phone with a QR that opens the dialpad on a phone — same UX as
 * the intern portal, so recruiters can call quickly from desktop.
 */
export default function CallButton({ phone, variant = 'inline' }: CallButtonProps) {
  const [showQr, setShowQr] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const digits = normalizePhone(phone || '')

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowQr(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  if (!digits) return <span className="text-gray-400">—</span>

  const tel = `tel:+91${digits}`
  const qrData = `tel:+91${digits}`

  if (variant === 'block') {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="rounded-lg bg-white border border-gray-200 p-1 shrink-0">
          <QRCodeSVG value={qrData} size={56} fgColor="#4f46e5" bgColor="#ffffff" level="M" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">📱 Scan to call</p>
          <a href={tel} className="text-base font-bold text-indigo-700 hover:underline">+91 {digits}</a>
          <p className="text-[10px] text-gray-400 mt-0.5">Opens dialpad on your phone</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1.5">
      <a href={tel} className="font-mono text-xs text-indigo-600 hover:underline" title="Call">{digits}</a>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowQr(s => !s) }}
        className="text-gray-400 hover:text-indigo-600"
        title="Show QR to call from phone"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6m-3-6v.01M20 14v6" />
        </svg>
      </button>
      {showQr && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <QRCodeSVG value={qrData} size={96} fgColor="#4f46e5" bgColor="#ffffff" level="M" />
          <p className="text-[10px] text-center text-gray-500 mt-1">Scan to call</p>
        </div>
      )}
    </div>
  )
}
