'use client'

import type { PipelineFlow } from '@/types/database'
import { calculatePercentage } from '@/lib/utils'

interface PipelineFlowProps {
  flow: PipelineFlow
}

const stages = [
  { key: 'sourced' as const,           label: 'Sourced',             color: 'bg-slate-500',   dot: 'bg-slate-500' },
  { key: 'callDone' as const,          label: 'Call Done',           color: 'bg-blue-500',    dot: 'bg-blue-500' },
  { key: 'connected' as const,         label: 'Connected',           color: 'bg-cyan-500',    dot: 'bg-cyan-500' },
  { key: 'interested' as const,        label: 'Interested',          color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'callBackLater' as const,     label: 'Call Back Later',     color: 'bg-yellow-400',  dot: 'bg-yellow-400' },
  { key: 'notInterested' as const,     label: 'Not Interested',      color: 'bg-red-400',     dot: 'bg-red-400' },
  { key: 'interviewScheduled' as const,label: 'Interview Scheduled', color: 'bg-amber-500',   dot: 'bg-amber-500' },
  { key: 'interviewDone' as const,     label: 'Interview Done',      color: 'bg-orange-500',  dot: 'bg-orange-500' },
  { key: 'selected' as const,          label: 'Selected',            color: 'bg-violet-600',  dot: 'bg-violet-600' },
  { key: 'notSelected' as const,       label: 'Not Selected',        color: 'bg-rose-500',    dot: 'bg-rose-500' },
  { key: 'joined' as const,            label: 'Joined',              color: 'bg-pink-500',    dot: 'bg-pink-500' },
  { key: 'notJoined' as const,         label: 'Not Joined',          color: 'bg-gray-400',    dot: 'bg-gray-400' },
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
        {stages
          .filter((stage, index) => index === 0 || flow[stage.key] > 0)
          .map((stage, index, visible) => {
            const value = flow[stage.key]
            const prev = index > 0 ? flow[visible[index - 1].key] : null
            const barWidth = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 3 : 0) : 0
            const conversion = prev !== null && prev > 0 ? calculatePercentage(value, prev) : null

            return (
              <div key={stage.key} className="flex items-center gap-3">
                {/* Label */}
                <div className="flex items-center gap-2 w-40 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.dot}`} />
                  <span className="text-xs font-medium text-gray-600 truncate">{stage.label}</span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`${stage.color} h-full rounded-lg flex items-center px-2.5 transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  >
                    {value > 0 && (
                      <span className="text-xs font-bold text-white whitespace-nowrap">{value}</span>
                    )}
                  </div>
                </div>

                {/* Conversion rate */}
                <div className="w-16 text-right flex-shrink-0">
                  {conversion !== null ? (
                    <span
                      className={`text-xs font-semibold ${
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
