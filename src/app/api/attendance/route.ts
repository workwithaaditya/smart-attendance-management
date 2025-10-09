import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    
    if (subjectId) {
      // Get attendance records for a specific subject
      const records = await prisma.attendanceRecord.findMany({
        where: { subjectId: parseInt(subjectId) },
        include: { subject: true },
        orderBy: { date: 'asc' }
      })
      return NextResponse.json(records)
    } else {
      // Get all attendance records
      const records = await prisma.attendanceRecord.findMany({
        include: { subject: true },
        orderBy: [{ subjectId: 'asc' }, { date: 'asc' }]
      })
      return NextResponse.json(records)
    }
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subjectId, date, status, replaceWith } = body

    // Get the day of week from the date
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // Count how many periods this subject has on this day
    const periodsCount = await prisma.timetableSlot.count({
      where: {
        subjectId: parseInt(subjectId),
        dayOfWeek: dayOfWeek
      }
    })

    // If replaceWith is provided, use that count exactly (for bulk import with duplicates)
    // Otherwise use periodsCount from timetable
    const finalCount = replaceWith !== undefined ? replaceWith : (periodsCount > 0 ? periodsCount : 1);

    const record = await prisma.attendanceRecord.upsert({
      where: {
        subjectId_date: {
          subjectId: parseInt(subjectId),
          date: new Date(date)
        }
      },
      update: { 
        status,
        count: finalCount
      },
      create: {
        subjectId: parseInt(subjectId),
        date: new Date(date),
        status,
        count: finalCount
      },
      include: { subject: true }
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance record:', error)
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status') as 'present' | 'absent' | 'holiday' | 'all' | null
    
    // If both subjectId and status are provided, do bulk delete
    if (subjectId && status) {
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
    const body = await request.json()
    const { subjectId: bodySubjectId, date } = body

    await prisma.attendanceRecord.delete({
      where: {
        subjectId_date: {
          subjectId: parseInt(bodySubjectId),
          date: new Date(date)
        }
      }
    })

    return NextResponse.json({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting attendance record:', error)
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}