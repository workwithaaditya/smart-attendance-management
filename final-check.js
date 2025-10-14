const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalCheck() {
  const spmPresent = await prisma.attendanceRecord.findMany({
    where: {
      subject: { name: 'SPM' },
      status: 'present'
    },
    include: { subject: true }
  });

  const totalCount = spmPresent.reduce((sum, r) => sum + (r.count || 1), 0);
  const badCounts = spmPresent.filter(r => (r.count || 1) > 1);

  console.log('\n✅ FINAL VERIFICATION:\n');
  console.log(`SPM Present Records: ${spmPresent.length}`);
  console.log(`Total COUNT Sum: ${totalCount}`);
  console.log(`Records with count > 1: ${badCounts.length}`);
  
  if (badCounts.length === 0 && totalCount === spmPresent.length) {
    console.log('\n🎉 SUCCESS - Graph will show correct count!');
    console.log(`\nGRAPH WILL SHOW: ${totalCount} Present\n`);
  } else {
    console.log('\n❌ STILL ISSUES!');
    if (badCounts.length > 0) {
      console.log('\nRecords with count > 1:');
      badCounts.forEach(r => {
        console.log(`  - ${r.date.toISOString().split('T')[0]}: count=${r.count}`);
      });
    }
  }

  await prisma.$disconnect();
}

finalCheck().catch(console.error);
