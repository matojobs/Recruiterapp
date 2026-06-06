'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'

interface WhatsAppButtonProps {
  /** Full wa.me URL (with pre-filled text) or null if no phone. */
  url: string | null
  /** Short preview of the message shown under the QR. */
  preview?: string
}

/**
 * "WhatsApp" button that opens the chat with a pre-written message, plus a QR
 * that encodes the same wa.me link so it can be scanned to open on a phone.
 * QR renders in a fixed portal so it never gets clipped by table/overflow.
 */
export default function WhatsAppButton({ url, preview }: WhatsAppButtonProps) {
  const [showQr, setShowQr] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showQr) return
    const close = () => setShowQr(false)
    function onDocClick(e: MouseEvent) {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      setShowQr(false)
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('mousedown', onDocClick)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [showQr])

  if (!url) return null

  function toggleQr(e: React.MouseEvent) {
    e.stopPropagation()
    if (showQr) { setShowQr(false); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 200) })
    setShowQr(true)
  }

  return (
    <span className="inline-flex items-center gap-1">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold transition-colors"
        title="Open WhatsApp with a pre-written message"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.49-1.012zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        WhatsApp
      </a>
      <button ref={btnRef} type="button" onClick={toggleQr} className="text-gray-400 hover:text-green-600" title="Scan to open on phone">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6m-3-6v.01M20 14v6" />
        </svg>
      </button>
      {showQr && pos && typeof document !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, maxWidth: 200 }}
          className="bg-white border border-gray-200 rounded-lg shadow-2xl p-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <QRCodeSVG value={url} size={128} fgColor="#16a34a" bgColor="#ffffff" level="M" />
          <p className="text-[10px] text-center text-gray-500 mt-1">Scan to open WhatsApp</p>
          {preview && <p className="text-[10px] text-gray-400 mt-1 line-clamp-3">{preview}</p>}
        </div>,
        document.body,
      )}
    </span>
  )
}
