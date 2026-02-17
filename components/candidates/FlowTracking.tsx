'use client'

import type { PipelineFlow } from '@/types/database'

interface FlowTrackingProps {
  flow: PipelineFlow
}

export default function FlowTracking({ flow }: FlowTrackingProps) {
  const stages = [
    { label: 'Sourced', value: flow.sourced, color: 'text-gray-600' },
    { label: 'Call Done', value: flow.callDone, color: 'text-blue-600' },
    { label: 'Connected', value: flow.connected, color: 'text-green-600' },
    { label: 'Interested', value: flow.interested, color: 'text-emerald-600' },
    { label: 'Not Interested', value: flow.notInterested, color: 'text-red-600' },
    { label: 'Interview Scheduled', value: flow.interviewScheduled, color: 'text-yellow-600' },
    { label: 'Interview Done', value: flow.interviewDone, color: 'text-orange-600' },
    { label: 'Selected', value: flow.selected, color: 'text-purple-600' },
    { label: 'Joined', value: flow.joined, color: 'text-pink-600' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Flow Tracking</h3>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {stages.map((stage) => (
          <div key={stage.label} className="text-center">
            <div className={`text-2xl font-bold ${stage.color}`}>{stage.value}</div>
            <div className="text-xs text-gray-600 mt-1">{stage.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
