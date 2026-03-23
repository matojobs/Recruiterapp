'use client'

import type { PipelineFlow } from '@/types/database'
import { calculatePercentage } from '@/lib/utils'

interface PipelineFlowProps {
  flow: PipelineFlow
}

const stages = [
  { key: 'sourced' as const,               label: 'Sourced',                  color: 'bg-slate-500',  light: 'bg-slate-50 text-slate-700',   dot: 'bg-slate-500',  pending: false },
  { key: 'callDone' as const,              label: 'Call Done',                color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500',   pending: false },
  { key: 'connected' as const,             label: 'Connected',                color: 'bg-cyan-500',   light: 'bg-cyan-50 text-cyan-700',     dot: 'bg-cyan-500',   pending: false },
  { key: 'interestPending' as const,       label: 'Interest Not Updated',     color: 'bg-slate-300',  light: 'bg-slate-50 text-slate-500',   dot: 'bg-slate-300',  pending: true  },
  { key: 'interested' as const,            label: 'Interested',               color: 'bg-emerald-500',light: 'bg-emerald-50 text-emerald-700',dot: 'bg-emerald-500',pending: false },
  { key: 'callBackLater' as const,         label: 'Call Back Later',          color: 'bg-yellow-400', light: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-400', pending: false },
  { key: 'notInterested' as const,         label: 'Not Interested',           color: 'bg-red-400',    light: 'bg-red-50 text-red-600',       dot: 'bg-red-400',    pending: false },
  { key: 'interviewScheduled' as const,    label: 'Interview Scheduled',      color: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500',  pending: false },
  { key: 'interviewResultPending' as const,label: 'Interview Result Pending', color: 'bg-slate-300',  light: 'bg-slate-50 text-slate-500',   dot: 'bg-slate-300',  pending: true  },
  { key: 'interviewDone' as const,         label: 'Interview Done',           color: 'bg-orange-500', light: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', pending: false },
  { key: 'selectionPending' as const,      label: 'Selection Pending',        color: 'bg-slate-300',  light: 'bg-slate-50 text-slate-500',   dot: 'bg-slate-300',  pending: true  },
  { key: 'selected' as const,              label: 'Selected',                 color: 'bg-violet-600', light: 'bg-violet-50 text-violet-700', dot: 'bg-violet-600', pending: false },
  { key: 'notSelected' as const,           label: 'Not Selected',             color: 'bg-rose-500',   light: 'bg-rose-50 text-rose-700',     dot: 'bg-rose-500',   pending: false },
  { key: 'joined' as const,                label: 'Joined',                   color: 'bg-pink-500',   light: 'bg-pink-50 text-pink-700',     dot: 'bg-pink-500',   pending: false },
  { key: 'notJoined' as const,             label: 'Not Joined',               color: 'bg-gray-400',   light: 'bg-gray-50 text-gray-600',     dot: 'bg-gray-400',   pending: false },
  { key: 'backedOut' as const,             label: 'Backed Out',               color: 'bg-orange-600', light: 'bg-orange-50 text-orange-700', dot: 'bg-orange-600', pending: false },
  { key: 'pendingJoining' as const,        label: 'Pending Joining',          color: 'bg-indigo-400', light: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-400', pending: true  },
]

export default function PipelineFlow({ flow }: PipelineFlowProps) {
  const maxValue = Math.max(...stages.map(s => flow[s.key]), 1)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">Pipeline Flow</h3>
        {flow.sourced > 0 && (
          <span className="text-xs bg-pink-50 text-pink-700 font-semibold px-2.5 py-1 rounded-full">
            {calculatePercentage(flow.joined, flow.sourced)}% overall joining rate
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {stages.map((stage, index) => {
          const value = flow[stage.key]
          const prev = index > 0 ? flow[stages[index - 1].key] : null
          const barWidth = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 3 : 0) : 0
          const conversion = prev !== null && prev > 0 ? calculatePercentage(value, prev) : null

          return (
            <div key={stage.key} className={`flex items-center gap-3 group ${stage.pending ? 'opacity-70' : ''}`}>
              {/* Label */}
              <div className="flex items-center gap-2 w-40 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.dot}`} />
                <span className={`text-xs truncate ${stage.pending ? 'italic text-gray-400' : 'font-medium text-gray-600'}`}>{stage.label}</span>
              </div>

              {/* Bar */}
              <div className={`flex-1 h-7 rounded-lg overflow-hidden ${stage.pending ? 'bg-gray-50 border border-dashed border-gray-300' : 'bg-gray-100'}`}>
                <div
                  className={`${stage.color} h-full rounded-lg flex items-center px-2.5 transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                >
                  {value > 0 && (
                    <span className={`text-xs font-bold whitespace-nowrap ${stage.pending ? 'text-gray-500' : 'text-white'}`}>{value}</span>
                  )}
                </div>
              </div>

              {/* Conversion rate */}
              <div className="w-16 text-right flex-shrink-0">
                {conversion !== null ? (
                  <span
                    className={`text-xs font-semibold ${
                      stage.pending ? 'text-gray-400' :
                      conversion >= 60 ? 'text-emerald-600' :
                      conversion >= 35 ? 'text-amber-600' :
                      'text-red-500'
                    }`}
                  >
                    ↓ {conversion}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">base</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {flow.sourced === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No pipeline data yet</p>
      )}
    </div>
  )
}
