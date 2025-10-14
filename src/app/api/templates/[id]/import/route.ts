import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Import template into user's subjects and timetable
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = parseInt(params.id);

    // Fetch template with subjects and timetable
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        templateSubjects: {
          include: {
            timetableSlots: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if template is public or belongs to user
    if (!template.isPublic && template.userId !== session.user.email) {
      return NextResponse.json(
        { error: 'This template is private' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clearExisting = false } = body;

    // If clearExisting is true, delete user's current subjects and timetable
    if (clearExisting) {
      await prisma.subject.deleteMany({
        where: {
          userId: session.user.email,
        },
      });
    }

    // Create subjects and timetable from template
    const createdSubjects = [];
    for (const templateSubject of template.templateSubjects) {
      // Check if subject already exists (by name)
      const existingSubject = await prisma.subject.findFirst({
        where: {
          userId: session.user.email,
          name: templateSubject.name,
        },
      });

      let subject;
      if (existingSubject) {
        // Update existing subject
        subject = await prisma.subject.update({
          where: { id: existingSubject.id },
          data: {
            color: templateSubject.color,
          },
        });
      } else {
        // Create new subject
        subject = await prisma.subject.create({
          data: {
            name: templateSubject.name,
            color: templateSubject.color,
            userId: session.user.email,
          },
        });
      }

      // Delete existing timetable slots for this subject
      await prisma.timetableSlot.deleteMany({
        where: {
          subjectId: subject.id,
        },
      });

      // Create timetable slots
      for (const slot of templateSubject.timetableSlots) {
        await prisma.timetableSlot.create({
          data: {
            dayOfWeek: slot.dayOfWeek,
            periodStart: slot.periodStart,
            periodEnd: slot.periodEnd,
            merged: slot.merged,
            subjectId: subject.id,
          },
        });
      }

      createdSubjects.push(subject);
    }

    // Increment import count
    await prisma.template.update({
      where: { id: templateId },
      data: {
        importCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      subjectsCreated: createdSubjects.length,
      message: 'Template imported successfully',
    });
  } catch (error) {
    console.error('Error importing template:', error);
    return NextResponse.json(
      { error: 'Failed to import template' },
      { status: 500 }
    );
  }
}
