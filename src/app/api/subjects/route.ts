import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/session'

export async function GET() {
  try {
    const userId = await getUserId();
    
    const subjects = await prisma.subject.findMany({
      where: {
        userId
      },
      include: {
        timetableSlots: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Error fetching subjects:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json()
    const { name, color, totalClasses, attendedClasses } = body

    // Check if subject with same name already exists for this user
    const existingSubject = await prisma.subject.findFirst({
      where: { 
        name: name,
        userId
      }
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: 'A subject with this name already exists' },
        { status: 409 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        color: color || '#3B82F6',
        totalClasses: totalClasses || 0,
        attendedClasses: attendedClasses || 0,
        userId
      }
    })

    return NextResponse.json(subject, { status: 201 })
  } catch (error: any) {
    console.error('Error creating subject:', error)
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A subject with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json()
    const { id, name, color, totalClasses, attendedClasses } = body

    // Verify subject belongs to user
    const existingSubject = await prisma.subject.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    const subject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(totalClasses !== undefined && { totalClasses }),
        ...(attendedClasses !== undefined && { attendedClasses })
      }
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.error('Error updating subject:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      )
    }

    // Verify subject belongs to user before deleting
    const existingSubject = await prisma.subject.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Cascade delete will handle related timetable slots and attendance records
    await prisma.subject.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Subject deleted successfully' })
  } catch (error) {
    console.error('Error deleting subject:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}