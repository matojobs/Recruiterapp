import { NextRequest, NextResponse } from 'next/server'
import { getApplications, createApplication } from '@/lib/queries'
import { withApiHandler } from '@/lib/api-handler'
import { parseApplicationFilters } from '@/lib/parse-query-filters'

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const filters = parseApplicationFilters(request.nextUrl.searchParams)
    const applications = await getApplications(filters)
    return NextResponse.json(applications)
  })
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const body = await request.json()
    const application = await createApplication(body)
    return NextResponse.json(application, { status: 201 })
  })
}
