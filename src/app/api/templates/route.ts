import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/session';

// GET - Browse all public templates or user's own templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const batch = searchParams.get('batch');
    const search = searchParams.get('search');
    const myTemplates = searchParams.get('myTemplates') === 'true';

    let whereClause: any = {};

    // If viewing own templates, require authentication
    if (myTemplates) {
      try {
        const userId = await getUserId();
        whereClause.userId = userId;
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // Public templates only
      whereClause.isPublic = true;
    }

    // Apply filters
    if (semester) whereClause.semester = { contains: semester, mode: 'insensitive' };
    if (section) whereClause.section = { contains: section, mode: 'insensitive' };
    if (batch) whereClause.batch = { contains: batch, mode: 'insensitive' };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.template.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        templateSubjects: {
          include: {
            timetableSlots: true,
          },
        },
        _count: {
          select: {
            templateSubjects: true,
            templateTimetable: true,
          },
        },
      },
      orderBy: {
        importCount: 'desc', // Most popular first
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create new template from user's current subjects and timetable
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    const body = await request.json();
    const { name, description, semester, section, batch, isPublic = true } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    // Check template limit (max 5 templates per user)
    const existingTemplatesCount = await prisma.template.count({
      where: {
        userId,
      },
    });

    if (existingTemplatesCount >= 5) {
      return NextResponse.json(
        { error: 'You have reached the maximum limit of 5 templates. Please delete some templates before creating new ones.' },
        { status: 400 }
      );
    }

    // Get user's subjects with timetable
    const subjects = await prisma.subject.findMany({
      where: {
        userId,
      },
      include: {
        timetableSlots: true,
      },
    });

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: 'No subjects found. Please add subjects first.' },
        { status: 400 }
      );
    }

    // Create template with subjects and timetable
    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        semester: semester?.trim() || null,
        section: section?.trim() || null,
        batch: batch?.trim() || null,
        isPublic,
        userId,
        templateSubjects: {
          create: subjects.map((subject: any) => ({
            name: subject.name,
            code: null, // Can be enhanced to ask for subject codes
            color: subject.color || '#3B82F6',
            timetableSlots: {
              create: subject.timetableSlots.map((slot: any) => ({
                dayOfWeek: slot.dayOfWeek,
                periodStart: slot.periodStart,
                periodEnd: slot.periodEnd,
                merged: slot.merged,
                templateId: 0, // Will be set by Prisma
              })),
            },
          })),
        },
      },
      include: {
        templateSubjects: {
          include: {
            timetableSlots: true,
          },
        },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete own template
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();

    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own templates' },
        { status: 403 }
      );
    }

    await prisma.template.delete({
      where: { id: parseInt(templateId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
