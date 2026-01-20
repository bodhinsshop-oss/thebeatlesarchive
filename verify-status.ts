import { prisma } from './src/lib/prisma';

async function main() {
  const totalWorks = await prisma.work.count();
  const totalVersions = await prisma.version.count();
  const totalMappings = await prisma.work.count({ where: { discogsMainId: { not: null } } });
  
  const beatlesWorks = await prisma.work.count({ where: { artist: { slug: 'the-beatles' } } });
  const johnWorks = await prisma.work.count({ where: { artist: { slug: 'john-lennon' } } });
  const paulWorks = await prisma.work.count({ where: { artist: { slug: 'paul-mccartney' } } });
  const georgeWorks = await prisma.work.count({ where: { artist: { slug: 'george-harrison' } } });
  const ringoWorks = await prisma.work.count({ where: { artist: { slug: 'ringo-starr' } } });
  
  console.log('\n=== DATABASE STATUS ===');
  console.log(`Total Works: ${totalWorks} / 1640 (${Math.round(totalWorks/1640*100)}%)`);
  console.log(`Total Versions: ${totalVersions}`);
  console.log(`Discogs Mappings: ${totalMappings}`);
  console.log('\n=== BY ARTIST ===');
  console.log(`The Beatles: ${beatlesWorks} / 1000`);
  console.log(`John Lennon: ${johnWorks} / 250`);
  console.log(`Paul McCartney: ${paulWorks} / 180`);
  console.log(`George Harrison: ${georgeWorks} / 130`);
  console.log(`Ringo Starr: ${ringoWorks} / 80`);
  
  // Check for bad White Album mappings
  const whiteAlbumMappings = await prisma.work.count({
    where: {
      discogsMainId: '79241',
      artist: { slug: { not: 'the-beatles' } }
    }
  });
  
  if (whiteAlbumMappings > 0) {
    console.log(`\n⚠️  WARNING: ${whiteAlbumMappings} non-Beatles albums still mapped to White Album!`);
  }
  
  // Sample recent Beatles works
  const recentBeatles = await prisma.work.findMany({
    where: { artist: { slug: 'the-beatles' } },
    orderBy: { lastSyncedAt: 'desc' },
    take: 5,
    select: {
      title: true,
      discogsMainId: true,
      lastSyncedAt: true
    }
  });
  
  console.log('\n=== RECENT BEATLES WORKS ===');
  recentBeatles.forEach(w => {
    console.log(`${w.title} - Discogs: ${w.discogsMainId || 'none'} - ${w.lastSyncedAt?.toLocaleTimeString()}`);
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
