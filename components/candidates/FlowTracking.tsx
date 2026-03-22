'use client'

import type { PipelineFlow } from '@/types/database'

interface FlowTrackingProps {
  flow: PipelineFlow
}

function Pill({ value, label, color, urgent }: { value: number; label: string; color: string; urgent?: boolean }) {
  if (value === 0) return null
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${color} ${urgent ? 'ring-1 ring-current ring-opacity-30' : ''}`}>
      <span className="text-sm font-bold leading-none">{value}</span>
      <span className="text-xs opacity-80 font-medium">{label}</span>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />
}

export default function FlowTracking({ flow }: FlowTrackingProps) {
  const hasActionItems = flow.followupsDue > 0 || flow.interviewScheduled > 0
  const hasCoreMetrics = flow.callDone > 0 || flow.connected > 0 || flow.interested > 0 || flow.selected > 0

  if (!hasCoreMetrics && !hasActionItems) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5 mb-4">
      <div className="flex items-center gap-2 flex-wrap">

        {/* Label */}
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-0.5">Today</span>

        {/* Core call metrics */}
        {(flow.callDone > 0 || flow.connected > 0) && (
          <>
            <Pill value={flow.callDone} label="Calls Made" color="bg-blue-100 text-blue-700" />
            {flow.connected > 0 && (
              <span className="text-gray-300 text-xs font-medium">
                → {Math.round((flow.connected / flow.callDone) * 100)}% connected
              </span>
            )}
            <Pill value={flow.connected} label="Connected" color="bg-cyan-100 text-cyan-700" />
          </>
        )}

        {flow.interested > 0 && <Pill value={flow.interested} label="Interested" color="bg-emerald-100 text-emerald-700" />}
        {flow.notInterested > 0 && <Pill value={flow.notInterested} label="Not Interested" color="bg-red-50 text-red-500" />}
        {flow.selected > 0 && <Pill value={flow.selected} label="Selected" color="bg-violet-100 text-violet-700" />}
        {flow.joined > 0 && <Pill value={flow.joined} label="Joined" color="bg-pink-100 text-pink-700" />}

        {/* Divider before action items */}
        {hasCoreMetrics && hasActionItems && <Divider />}

        {/* Action items — what needs attention */}
        {flow.followupsDue > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold">{flow.followupsDue}</span>
            <span className="text-xs opacity-80 font-medium">Follow-ups Due</span>
          </div>
        )}

        {flow.interviewScheduled > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-bold">{flow.interviewScheduled}</span>
            <span className="text-xs opacity-80 font-medium">Interviews Today</span>
          </div>
        )}

      </div>
    </div>
  )
}
