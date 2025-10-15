import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple admin authentication - you can replace this with a proper admin check
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-secret-key-here';

export async function GET(request: Request) {
  try {
    // Simple admin authentication via header
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total users
    const totalUsers = await prisma.user.count();

    // Users registered in last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newUsersThisWeek = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastWeek,
        },
      },
    });

    // Users registered in last 30 days
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonth,
        },
      },
    });

    // Total subjects created
    const totalSubjects = await prisma.subject.count();

    // Total attendance records
    const totalAttendanceRecords = await prisma.attendanceRecord.count();

    // Total templates shared
    const totalTemplates = await prisma.template.count();

    // Public templates
    const publicTemplates = await prisma.template.count({
      where: {
        isPublic: true,
      },
    });

    // Most popular templates (top 5)
    const popularTemplates = await prisma.template.findMany({
      take: 5,
      orderBy: {
        importCount: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            templateSubjects: true,
          },
        },
      },
    });

    // Recent users (last 10)
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            subjects: true,
            templates: true,
          },
        },
      },
    });

    // Active users (users who have subjects or templates)
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          {
            subjects: {
              some: {},
            },
          },
          {
            templates: {
              some: {},
            },
          },
        ],
      },
    });

    // User growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const usersByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*)::bigint as count
      FROM users
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        newUsersThisWeek,
        newUsersThisMonth,
        totalSubjects,
        totalAttendanceRecords,
        totalTemplates,
        publicTemplates,
      },
      popularTemplates: popularTemplates.map(t => ({
        id: t.id,
        name: t.name,
        importCount: t.importCount,
        subjectCount: t._count.templateSubjects,
        creator: t.user.name || t.user.email,
        semester: t.semester,
        section: t.section,
        batch: t.batch,
      })),
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        name: u.name || 'Anonymous',
        email: u.email,
        joinedAt: u.createdAt,
        subjects: u._count.subjects,
        templates: u._count.templates,
      })),
      userGrowth: usersByMonth.map(m => ({
        month: m.month,
        count: Number(m.count),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
