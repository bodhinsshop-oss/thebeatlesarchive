import { prisma } from './src/lib/prisma';

async function main() {
  const workCount = await prisma.work.count();
  console.log(`\nTotal works in database: ${workCount}\n`);
  
  if (workCount > 0) {
    const sampleWorks = await prisma.work.findMany({
      take: 5,
      include: {
        artist: true,
        _count: {
          select: { versions: true }
        }
      }
    });
    
    console.log('Sample works:');
    sampleWorks.forEach(w => {
      console.log(`  ${w.id}: ${w.title} (${w.artist.name}) - ${w._count.versions} versions`);
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
