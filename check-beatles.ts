import { prisma } from './src/lib/prisma';

async function main() {
  const beatlesWorks = await prisma.work.count({
    where: {
      artist: { slug: 'the-beatles' }
    }
  });
  
  console.log(`\nBeatles works in database: ${beatlesWorks}\n`);
  
  if (beatlesWorks > 0) {
    const samples = await prisma.work.findMany({
      where: {
        artist: { slug: 'the-beatles' }
      },
      take: 5,
      include: {
        _count: { select: { versions: true } }
      }
    });
    
    console.log('Sample Beatles works:');
    samples.forEach(w => {
      console.log(`  ${w.title} (${w.type}) - ${w._count.versions} versions`);
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
