import { NextRequest, NextResponse } from 'next/server'
import { createCandidate, getCandidates } from '@/lib/queries'
import { withApiHandler } from '@/lib/api-handler'

export async function GET() {
  return withApiHandler(async () => {
    const candidates = await getCandidates()
    return NextResponse.json(candidates)
  })
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const body = await request.json()
    const candidate = await createCandidate(body)
    return NextResponse.json(candidate, { status: 201 })
  })
}
