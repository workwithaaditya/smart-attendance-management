import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample subjects
  const subjects = [
    { name: 'Mathematics', color: '#3B82F6' },
    { name: 'Physics', color: '#EF4444' },
    { name: 'Chemistry', color: '#10B981' },
    { name: 'Biology', color: '#F59E0B' },
    { name: 'English', color: '#8B5CF6' },
    { name: 'Computer Science', color: '#06B6D4' }
  ]

  console.log('Creating subjects...')
  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: {},
      create: {
        name: subject.name,
        color: subject.color,
        totalClasses: Math.floor(Math.random() * 50) + 30, // Random 30-80 classes
        attendedClasses: Math.floor(Math.random() * 40) + 25 // Random 25-65 attended
      }
    })
  }

  // Create sample timetable slots
  const timetableSlots = [
    { dayOfWeek: 'monday', periodStart: 1, periodEnd: 1, subjectName: 'Mathematics' },
    { dayOfWeek: 'monday', periodStart: 2, periodEnd: 3, subjectName: 'Physics', merged: true },
    { dayOfWeek: 'monday', periodStart: 4, periodEnd: 4, subjectName: 'English' },
    
    { dayOfWeek: 'tuesday', periodStart: 1, periodEnd: 1, subjectName: 'Chemistry' },
    { dayOfWeek: 'tuesday', periodStart: 2, periodEnd: 2, subjectName: 'Biology' },
    { dayOfWeek: 'tuesday', periodStart: 3, periodEnd: 4, subjectName: 'Computer Science', merged: true },
    
    { dayOfWeek: 'wednesday', periodStart: 1, periodEnd: 2, subjectName: 'Mathematics', merged: true },
    { dayOfWeek: 'wednesday', periodStart: 3, periodEnd: 3, subjectName: 'Physics' },
    
    { dayOfWeek: 'thursday', periodStart: 1, periodEnd: 1, subjectName: 'English' },
    { dayOfWeek: 'thursday', periodStart: 2, periodEnd: 2, subjectName: 'Chemistry' },
    { dayOfWeek: 'thursday', periodStart: 4, periodEnd: 4, subjectName: 'Biology' },
    
    { dayOfWeek: 'friday', periodStart: 1, periodEnd: 1, subjectName: 'Computer Science' },
    { dayOfWeek: 'friday', periodStart: 2, periodEnd: 3, subjectName: 'Mathematics', merged: true },
    { dayOfWeek: 'friday', periodStart: 4, periodEnd: 4, subjectName: 'Physics' },
  ]

  console.log('Creating timetable slots...')
  for (const slot of timetableSlots) {
    const subject = await prisma.subject.findUnique({
      where: { name: slot.subjectName }
    })
    
    if (subject) {
      await prisma.timetableSlot.create({
        data: {
          dayOfWeek: slot.dayOfWeek,
          periodStart: slot.periodStart,
          periodEnd: slot.periodEnd,
          merged: slot.merged || false,
          subjectId: subject.id
        }
      })
    }
  }

  console.log('Seed data created successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })