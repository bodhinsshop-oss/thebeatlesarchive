import { prisma } from './src/lib/prisma';

async function main() {
  console.log('\n=== Clearing Bad Discogs Mappings ===\n');
  
  // Clear the White Album mappings (79241)
  const clearedWorks = await prisma.work.updateMany({
    where: {
      discogsMainId: '79241'
    },
    data: {
      discogsMainId: null
    }
  });
  
  console.log(`Cleared ${clearedWorks.count} works with White Album mapping (79241)`);
  
  // Clear all bad mapping audits
  const clearedAudits = await prisma.mappingAudit.deleteMany({
    where: {
      discogsId: '79241'
    }
  });
  
  console.log(`Deleted ${clearedAudits.count} bad mapping audit records`);
  
  console.log('\n✓ Bad mappings cleared. Re-run sync to get correct Discogs matches.\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
