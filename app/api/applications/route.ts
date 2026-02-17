import { NextRequest, NextResponse } from 'next/server'
import { getApplications, createApplication } from '@/lib/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: any = {}
    
    if (searchParams.get('recruiter_id')) filters.recruiter_id = searchParams.get('recruiter_id')
    if (searchParams.get('company_id')) filters.company_id = searchParams.get('company_id')
    if (searchParams.get('job_role_id')) filters.job_role_id = searchParams.get('job_role_id')
    if (searchParams.get('portal')) filters.portal = searchParams.get('portal')
    if (searchParams.get('call_status')) filters.call_status = searchParams.get('call_status')
    if (searchParams.get('interested_status')) filters.interested_status = searchParams.get('interested_status')
    if (searchParams.get('interview_status')) filters.interview_status = searchParams.get('interview_status')
    if (searchParams.get('selection_status')) filters.selection_status = searchParams.get('selection_status')
    if (searchParams.get('joining_status')) filters.joining_status = searchParams.get('joining_status')
    if (searchParams.get('date_from')) filters.date_from = searchParams.get('date_from')
    if (searchParams.get('date_to')) filters.date_to = searchParams.get('date_to')

    const applications = await getApplications(filters)
    return NextResponse.json(applications)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const application = await createApplication(body)
    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
