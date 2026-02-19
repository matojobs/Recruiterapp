import { NextRequest, NextResponse } from 'next/server'
import { getApplication, updateApplication, deleteApplication } from '@/lib/queries'
import { withApiHandler } from '@/lib/api-handler'

// Next.js 15: params may be a Promise; use: const { id } = await params
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiHandler(async () => {
    const application = await getApplication(params.id)
    return NextResponse.json(application)
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiHandler(async () => {
    const body = await request.json()
    const application = await updateApplication(params.id, body)
    return NextResponse.json(application)
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiHandler(async () => {
    await deleteApplication(params.id)
    return NextResponse.json({ success: true })
  })
}
