import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/session'

export async function GET() {
  try {
    const userId = await getUserId();
    
    const timetableSlots = await prisma.timetableSlot.findMany({
      where: {
        subject: {
          userId
        }
      },
      include: {
        subject: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { periodStart: 'asc' }
      ]
    })
    
    return NextResponse.json(timetableSlots)
  } catch (error) {
    console.error('Error fetching timetable:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch timetable' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json()
    const { dayOfWeek, periodStart, periodEnd, subjectId, merged } = body

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

    // Check for overlapping slots for this user's subjects
    const existingSlots = await prisma.timetableSlot.findMany({
      where: {
        dayOfWeek,
        subject: {
          userId
        },
        OR: [
          {
            AND: [
              { periodStart: { lte: periodStart } },
              { periodEnd: { gte: periodStart } }
            ]
          },
          {
            AND: [
              { periodStart: { lte: periodEnd } },
              { periodEnd: { gte: periodEnd } }
            ]
          },
          {
            AND: [
              { periodStart: { gte: periodStart } },
              { periodEnd: { lte: periodEnd } }
            ]
          }
        ]
      }
    })

    // Delete existing overlapping slots
    if (existingSlots.length > 0) {
      await prisma.timetableSlot.deleteMany({
        where: {
          id: {
            in: existingSlots.map((slot: any) => slot.id)
          }
        }
      })
    }

    const timetableSlot = await prisma.timetableSlot.create({
      data: {
        dayOfWeek,
        periodStart,
        periodEnd: periodEnd || periodStart,
        subjectId: parseInt(subjectId),
        merged: merged || false
      },
      include: {
        subject: true
      }
    })

    return NextResponse.json(timetableSlot, { status: 201 })
  } catch (error) {
    console.error('Error creating timetable slot:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create timetable slot' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json()
    const { id, dayOfWeek, periodStart, periodEnd, subjectId, merged } = body

    // Verify ownership before update
    const existing = await prisma.timetableSlot.findFirst({
      where: {
        id: parseInt(id),
        subject: {
          userId
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Timetable slot not found' },
        { status: 404 }
      )
    }

    // If updating subjectId, verify new subject belongs to user
    if (subjectId) {
      const newSubject = await prisma.subject.findUnique({
        where: { id: parseInt(subjectId) },
        select: { userId: true }
      });
      if (!newSubject || newSubject.userId !== userId) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        )
      }
    }

    const timetableSlot = await prisma.timetableSlot.update({
      where: { id: parseInt(id) },
      data: {
        ...(dayOfWeek && { dayOfWeek }),
        ...(periodStart !== undefined && { periodStart }),
        ...(periodEnd !== undefined && { periodEnd }),
        ...(subjectId && { subjectId: parseInt(subjectId) }),
        ...(merged !== undefined && { merged })
      },
      include: {
        subject: true
      }
    })

    return NextResponse.json(timetableSlot)
  } catch (error) {
    console.error('Error updating timetable slot:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update timetable slot' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const dayOfWeek = searchParams.get('dayOfWeek')
    const period = searchParams.get('period')

    if (id) {
      // Verify ownership before delete
      const existing = await prisma.timetableSlot.findFirst({
        where: {
          id: parseInt(id),
          subject: {
            userId
          }
        }
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Timetable slot not found' },
          { status: 404 }
        )
      }

      // Delete by ID
      await prisma.timetableSlot.delete({
        where: { id: parseInt(id) }
      })
    } else if (dayOfWeek && period) {
      // Delete by day and period (only user's slots)
      await prisma.timetableSlot.deleteMany({
        where: {
          dayOfWeek,
          periodStart: { lte: parseInt(period) },
          periodEnd: { gte: parseInt(period) },
          subject: {
            userId
          }
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Either ID or dayOfWeek and period are required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Timetable slot deleted successfully' })
  } catch (error) {
    console.error('Error deleting timetable slot:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete timetable slot' },
      { status: 500 }
    )
  }
}