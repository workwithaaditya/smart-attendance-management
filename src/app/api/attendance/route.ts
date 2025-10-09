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
    const { subjectId, date, status } = body

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

    const record = await prisma.attendanceRecord.upsert({
      where: {
        subjectId_date: {
          subjectId: parseInt(subjectId),
          date: new Date(date)
        }
      },
      update: { 
        status,
        count: periodsCount > 0 ? periodsCount : 1 // Default to 1 if no timetable
      },
      create: {
        subjectId: parseInt(subjectId),
        date: new Date(date),
        status,
        count: periodsCount > 0 ? periodsCount : 1
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
    const body = await request.json()
    const { subjectId, date } = body

    await prisma.attendanceRecord.delete({
      where: {
        subjectId_date: {
          subjectId: parseInt(subjectId),
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