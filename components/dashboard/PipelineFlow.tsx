'use client'

import type { PipelineFlow } from '@/types/database'
import { calculatePercentage } from '@/lib/utils'

interface PipelineFlowProps {
  flow: PipelineFlow
}

export default function PipelineFlow({ flow }: PipelineFlowProps) {
  const stages = [
    { label: 'Sourced', value: flow.sourced, color: 'bg-gray-400' },
    { label: 'Call Done', value: flow.callDone, color: 'bg-blue-400' },
    { label: 'Connected', value: flow.connected, color: 'bg-green-400' },
    { label: 'Interested', value: flow.interested, color: 'bg-emerald-400' },
    { label: 'Not Interested', value: flow.notInterested, color: 'bg-red-400' },
    { label: 'Interview Scheduled', value: flow.interviewScheduled, color: 'bg-yellow-400' },
    { label: 'Interview Done', value: flow.interviewDone, color: 'bg-orange-400' },
    { label: 'Selected', value: flow.selected, color: 'bg-purple-400' },
    { label: 'Joined', value: flow.joined, color: 'bg-pink-400' },
  ]

  const maxValue = Math.max(...stages.map(s => s.value))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Pipeline Flow</h3>
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
          const conversionRate = index > 0 && stages[index - 1].value > 0
            ? calculatePercentage(stage.value, stages[index - 1].value)
            : null

          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 w-32">
                    {stage.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {stage.value}
                  </span>
                  {conversionRate !== null && (
                    <span className="text-xs text-gray-500">
                      ({conversionRate}% conversion)
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className={`${stage.color} h-full transition-all duration-300 flex items-center justify-end pr-2`}
                  style={{ width: `${percentage}%` }}
                >
                  {stage.value > 0 && (
                    <span className="text-xs font-medium text-white">
                      {stage.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
