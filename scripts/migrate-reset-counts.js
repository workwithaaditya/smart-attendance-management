/**
 * ONE-TIME MIGRATION SCRIPT
 * Reset all attendance record counts to 1 for period-wise tracking
 * Run this once after deploying the new code
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🔧 Running count reset migration...\n');
  
  try {
    // Update all records to count=1
    const result = await prisma.attendanceRecord.updateMany({
      data: {
        count: 1
      }
    });

    console.log(`✅ Migration complete: Updated ${result.count} records to count=1\n`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
