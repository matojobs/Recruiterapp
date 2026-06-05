'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
 * Click-to-call phone with a QR that opens the dialpad on a phone.
 * The inline QR renders in a portal (fixed-positioned) so it escapes the table's
 * sticky cells / overflow and never gets clipped or painted behind other rows.
 */
export default function CallButton({ phone, variant = 'inline' }: CallButtonProps) {
  const [showQr, setShowQr] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const digits = normalizePhone(phone || '')

  useEffect(() => {
    if (!showQr) return
    function close() { setShowQr(false) }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('mousedown', onDocClick)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('mousedown', onDocClick)
    }
    function onDocClick(e: MouseEvent) {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      setShowQr(false)
    }
  }, [showQr])

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

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (showQr) { setShowQr(false); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 140) })
    setShowQr(true)
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <a href={tel} className="font-mono text-xs text-indigo-600 hover:underline" title="Call">{digits}</a>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="text-gray-400 hover:text-indigo-600"
        title="Show QR to call from phone"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6m-3-6v.01M20 14v6" />
        </svg>
      </button>
      {showQr && pos && typeof document !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-lg shadow-2xl p-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <QRCodeSVG value={qrData} size={112} fgColor="#4f46e5" bgColor="#ffffff" level="M" />
          <p className="text-[10px] text-center text-gray-500 mt-1">Scan to call +91 {digits}</p>
        </div>,
        document.body,
      )}
    </span>
  )
}
