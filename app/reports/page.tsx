'use client'

import { useEffect, useState } from 'react'
import { getApplications, getRecruiters, getCompanies } from '@/lib/data'
import type { Application, Recruiter, Company, PipelineFlow } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'
import { calculatePercentage, computePipelineFlowFromApplications } from '@/lib/utils'
import Button from '@/components/ui/Button'
import * as XLSX from 'xlsx'

export default function ReportsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [flow, setFlow] = useState<PipelineFlow>(EMPTY_PIPELINE_FLOW)
  // Removed recruiter performance for local mode
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<'pipeline' | 'recruiter' | 'company'>('pipeline')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [apps, recs, comps] = await Promise.all([
        getApplications(),
        getRecruiters(),
        getCompanies(),
      ])
      setApplications(apps)
      setRecruiters(recs)
      setCompanies(comps)
      setFlow(computePipelineFlowFromApplications(apps))
    } catch (error) {
      console.error('Error loading data:', error)
      setFlow(EMPTY_PIPELINE_FLOW)
    } finally {
      setLoading(false)
    }
  }

  function getCompanyStats() {
    const companyMap = new Map<string, {
      name: string
      total: number
      selected: number
      joined: number
    }>()

    applications.forEach((app) => {
      const companyName = app.job_role?.company?.company_name || 'Unknown'
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          name: companyName,
          total: 0,
          selected: 0,
          joined: 0,
        })
      }
      const stats = companyMap.get(companyName)!
      stats.total++
      if (app.selection_status === 'Selected') stats.selected++
      if (app.joining_status === 'Joined') stats.joined++
    })

    return Array.from(companyMap.values())
  }

  function handleExportPipeline() {
    const exportData = [
      { Stage: 'Sourced', Count: flow.sourced, Conversion: '100%' },
      { Stage: 'Call Done', Count: flow.callDone, Conversion: `${calculatePercentage(flow.callDone, flow.sourced)}%` },
      { Stage: 'Connected', Count: flow.connected, Conversion: `${calculatePercentage(flow.connected, flow.callDone)}%` },
      { Stage: 'Interested', Count: flow.interested, Conversion: `${calculatePercentage(flow.interested, flow.connected)}%` },
      { Stage: 'Not Interested', Count: flow.notInterested, Conversion: `${calculatePercentage(flow.notInterested, flow.connected)}%` },
      { Stage: 'Interview Scheduled', Count: flow.interviewScheduled, Conversion: `${calculatePercentage(flow.interviewScheduled, flow.interested)}%` },
      { Stage: 'Interview Done', Count: flow.interviewDone, Conversion: `${calculatePercentage(flow.interviewDone, flow.interviewScheduled)}%` },
      { Stage: 'Selected', Count: flow.selected, Conversion: `${calculatePercentage(flow.selected, flow.interviewDone)}%` },
      { Stage: 'Joined', Count: flow.joined, Conversion: `${calculatePercentage(flow.joined, flow.selected)}%` },
    ]

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pipeline Flow')
    XLSX.writeFile(wb, `pipeline_report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }


  function handleExportCompany() {
    const companyStats = getCompanyStats()
    const ws = XLSX.utils.json_to_sheet(companyStats)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Company Stats')
    XLSX.writeFile(wb, `company_report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const companyStats = getCompanyStats()
  const overallConversion = flow.sourced > 0 ? calculatePercentage(flow.joined, flow.sourced) : 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-2">
          {selectedReport === 'pipeline' && (
            <Button onClick={handleExportPipeline}>Export Pipeline Report</Button>
          )}
          {selectedReport === 'company' && (
            <Button onClick={handleExportCompany}>Export Company Report</Button>
          )}
        </div>
      </div>

      <div className="flex space-x-2 mb-6">
        <Button
          variant={selectedReport === 'pipeline' ? 'primary' : 'outline'}
          onClick={() => setSelectedReport('pipeline')}
        >
          Pipeline Flow
        </Button>
        <Button
          variant={selectedReport === 'recruiter' ? 'primary' : 'outline'}
          onClick={() => setSelectedReport('recruiter')}
        >
          Recruiter Performance
        </Button>
        <Button
          variant={selectedReport === 'company' ? 'primary' : 'outline'}
          onClick={() => setSelectedReport('company')}
        >
          Company-wise
        </Button>
      </div>

      {selectedReport === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pipeline Flow Report</h2>
            <div className="mb-4">
              <div className="text-3xl font-bold text-primary-600">{overallConversion}%</div>
              <div className="text-sm text-gray-600">Overall Conversion Rate (Sourced → Joined)</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sourced</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.sourced}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">100%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Call Done</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.callDone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.callDone, flow.sourced)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Connected</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.connected}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.connected, flow.callDone)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Interested</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.interested}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.interested, flow.connected)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Not Interested</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.notInterested}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.notInterested, flow.connected)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Interview Scheduled</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.interviewScheduled}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.interviewScheduled, flow.interested)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Interview Done</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.interviewDone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.interviewDone, flow.interviewScheduled)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Selected</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.selected}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.selected, flow.interviewDone)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Joined</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{flow.joined}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {calculatePercentage(flow.joined, flow.selected)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'recruiter' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recruiter Performance Report</h2>
          <p className="text-gray-500">Recruiter performance report is not available in local mode.</p>
        </div>
      )}

      {selectedReport === 'company' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company-wise Report</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Applications</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Selected</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Selection Rate</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Joining Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companyStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{stat.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{stat.selected}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {calculatePercentage(stat.selected, stat.total)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{stat.joined}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {calculatePercentage(stat.joined, stat.selected)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
