import { NextResponse } from 'next/server'

/**
 * Wraps an API route handler with try/catch and returns 500 with error message on throw.
 * Use for consistent error handling across API routes.
 */
export async function withApiHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | { error: string }>> {
  try {
    return await handler()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
