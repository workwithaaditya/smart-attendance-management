import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    
    if (subjectId) {
      // Verify subject belongs to user
      const subject = await prisma.subject.findFirst({
        where: { id: parseInt(subjectId), userId }
      });

      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        )
      }

      // Get attendance records for a specific subject
      const records = await prisma.attendanceRecord.findMany({
        where: { subjectId: parseInt(subjectId) },
        include: { subject: true },
        orderBy: { date: 'asc' }
      })
      return NextResponse.json(records)
    } else {
      // Get all attendance records for user's subjects
      const records = await prisma.attendanceRecord.findMany({
        where: {
          subject: {
            userId
          }
        },
        include: { subject: true },
        orderBy: [{ subjectId: 'asc' }, { date: 'asc' }]
      })
      return NextResponse.json(records)
    }
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json()
    const { subjectId, date, status, periodStart, periodEnd, forceBulkCreate } = body

    // Verify subject belongs to user
    const subject = await prisma.subject.findFirst({
      where: { id: parseInt(subjectId), userId }
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // PRIORITY #1: BULK UPLOAD MODE
    // If forceBulkCreate flag is set, ALWAYS create new record
    // This ensures every upload creates exactly one record for accurate counting
    if (forceBulkCreate) {
      const record = await prisma.attendanceRecord.create({
        data: {
          subjectId: parseInt(subjectId),
          date: new Date(date),
          periodStart: periodStart ?? null,
          periodEnd: periodEnd ?? null,
          status,
          count: 1
        },
        include: { subject: true }
      })
      return NextResponse.json(record, { status: 201 })
    }

    // Get the day of week from the date
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // Get all timetable slots for this subject on this day
    const timetableSlots = await prisma.timetableSlot.findMany({
      where: {
        subjectId: parseInt(subjectId),
        dayOfWeek: dayOfWeek
      },
      orderBy: [
        { periodStart: 'asc' }
      ]
    })

    let targetPeriodStart: number | null = null
    let targetPeriodEnd: number | null = null

    // If period specified, use it directly
    if (periodStart !== undefined && periodEnd !== undefined) {
      targetPeriodStart = periodStart
      targetPeriodEnd = periodEnd
    } 
    // Auto-match: Find next unmarked period
    else if (timetableSlots.length > 0) {
      // Check which periods already have attendance
      const existingRecords = await prisma.attendanceRecord.findMany({
        where: {
          subjectId: parseInt(subjectId),
          date: new Date(date)
        }
      })

      // Find first unmarked slot
      for (const slot of timetableSlots) {
        const alreadyMarked = existingRecords.some(
          record => record.periodStart === slot.periodStart && record.periodEnd === slot.periodEnd
        )
        
        if (!alreadyMarked) {
          targetPeriodStart = slot.periodStart
          targetPeriodEnd = slot.periodEnd
          break
        }
      }

      // If all slots marked, create new record without specific period
      // This allows unlimited records per date (for manual/bulk uploads)
      if (targetPeriodStart === null) {
        const record = await prisma.attendanceRecord.create({
          data: {
            subjectId: parseInt(subjectId),
            date: new Date(date),
            periodStart: null,
            periodEnd: null,
            status,
            count: 1
          },
          include: { subject: true }
        })
        return NextResponse.json(record, { status: 201 })
      }
    }

    // NO TIMETABLE: Always create new record for each upload
    // This allows multiple records per date when user doesn't have timetable configured
    if (timetableSlots.length === 0) {
      const record = await prisma.attendanceRecord.create({
        data: {
          subjectId: parseInt(subjectId),
          date: new Date(date),
          periodStart: null,
          periodEnd: null,
          status,
          count: 1
        },
        include: { subject: true }
      })
      return NextResponse.json(record, { status: 201 })
    }

    // WITH TIMETABLE: Use upsert to update if period already marked
    const record = await prisma.attendanceRecord.upsert({
      where: {
        subjectId_date_periodStart_periodEnd: {
          subjectId: parseInt(subjectId),
          date: new Date(date),
          periodStart: targetPeriodStart,
          periodEnd: targetPeriodEnd
        }
      },
      update: { 
        status
      },
      create: {
        subjectId: parseInt(subjectId),
        date: new Date(date),
        periodStart: targetPeriodStart,
        periodEnd: targetPeriodEnd,
        status,
        count: 1
      },
      include: { subject: true }
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance record:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status') as 'present' | 'absent' | 'holiday' | 'all' | null
    
    // If both subjectId and status are provided, do bulk delete
    if (subjectId && status) {
      // Verify subject belongs to user
      const subject = await prisma.subject.findFirst({
        where: { id: parseInt(subjectId), userId }
      });

      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        )
      }

      const whereCondition = status === 'all' 
        ? { subjectId: parseInt(subjectId) }
        : { subjectId: parseInt(subjectId), status };
      
      const result = await prisma.attendanceRecord.deleteMany({
        where: whereCondition
      });

      // Reset Subject totalClasses and attendedClasses to 0 when clearing records
      // This prevents stale cumulative data from interfering with fresh imports
      if (status === 'all' || status === 'present') {
        await prisma.subject.update({
          where: { id: parseInt(subjectId) },
          data: {
            totalClasses: 0,
            attendedClasses: 0
          }
        });
      }
      
      return NextResponse.json({ 
        message: `Successfully deleted ${result.count} record(s)`,
        count: result.count 
      });
    }
    
    // Otherwise, expect body with single record delete (old behavior)
    try {
      const body = await request.json()
      const { subjectId: bodySubjectId, date } = body

      // Verify subject belongs to user
      const subject = await prisma.subject.findFirst({
        where: { id: parseInt(bodySubjectId), userId }
      });

      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        )
      }

      await prisma.attendanceRecord.delete({
        where: {
          subjectId_date: {
            subjectId: parseInt(bodySubjectId),
            date: new Date(date)
          }
        }
      })

      return NextResponse.json({ message: 'Attendance record deleted successfully' })
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid request: provide query params (subjectId & status) for bulk delete or body (subjectId & date) for single delete' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting attendance record:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}