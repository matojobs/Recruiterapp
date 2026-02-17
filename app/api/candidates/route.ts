import { NextRequest, NextResponse } from 'next/server'
import { createCandidate, getCandidates } from '@/lib/queries'

export async function GET() {
  try {
    const candidates = await getCandidates()
    return NextResponse.json(candidates)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const candidate = await createCandidate(body)
    return NextResponse.json(candidate, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
