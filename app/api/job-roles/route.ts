import { NextRequest, NextResponse } from 'next/server'
import { createJobRole, getJobRoles } from '@/lib/queries'

export async function GET() {
  try {
    const jobRoles = await getJobRoles()
    return NextResponse.json(jobRoles)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobRole = await createJobRole(body)
    return NextResponse.json(jobRole, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
