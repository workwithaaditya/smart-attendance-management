import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * ONE-TIME MIGRATION ENDPOINT
 * Visit /api/migrate-counts to reset all attendance counts to 1
 * DELETE THIS FILE after running the migration!
 */
export async function GET() {
  try {
    // Update all records to count=1
    const result = await prisma.attendanceRecord.updateMany({
      data: {
        count: 1
      }
    })

    return NextResponse.json({
      success: true,
      message: `Migration complete: Updated ${result.count} records to count=1`,
      recordsUpdated: result.count
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      },
      { status: 500 }
    )
  }
}
