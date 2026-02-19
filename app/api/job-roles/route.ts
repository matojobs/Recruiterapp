import { NextRequest, NextResponse } from 'next/server'
import { createJobRole, getJobRoles } from '@/lib/queries'
import { withApiHandler } from '@/lib/api-handler'

export async function GET() {
  return withApiHandler(async () => {
    const jobRoles = await getJobRoles()
    return NextResponse.json(jobRoles)
  })
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const body = await request.json()
    const jobRole = await createJobRole(body)
    return NextResponse.json(jobRole, { status: 201 })
  })
}
