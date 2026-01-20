import { prisma } from './src/lib/prisma';

async function main() {
  console.log('\n=== Checking Discogs URLs ===\n');
  
  // Check Works with Discogs main IDs
  const worksWithDiscogs = await prisma.work.findMany({
    where: {
      discogsMainId: { not: null }
    },
    select: {
      title: true,
      discogsMainId: true,
      artist: { select: { name: true } }
    },
    take: 10
  });
  
  console.log('Works with Discogs Main IDs:');
  worksWithDiscogs.forEach(w => {
    console.log(`  ${w.artist.name} - ${w.title}: ${w.discogsMainId}`);
  });
  
  // Check Versions with Discogs URLs
  const versionsWithDiscogs = await prisma.version.findMany({
    where: {
      discogsUrl: { not: null }
    },
    select: {
      country: true,
      releaseDate: true,
      discogsReleaseId: true,
      discogsUrl: true,
      discogsMarketplaceUrl: true,
      work: {
        select: {
          title: true,
          artist: { select: { name: true } }
        }
      }
    },
    take: 15
  });
  
  console.log('\n\nVersions with Discogs URLs:');
  versionsWithDiscogs.forEach(v => {
    console.log(`\n  ${v.work.artist.name} - ${v.work.title}`);
    console.log(`    Country: ${v.country}, Date: ${v.releaseDate}`);
    console.log(`    Discogs ID: ${v.discogsReleaseId}`);
    console.log(`    URL: ${v.discogsUrl}`);
    console.log(`    Marketplace: ${v.discogsMarketplaceUrl}`);
  });
  
  // Count unique Discogs IDs
  const uniqueMainIds = await prisma.work.findMany({
    where: { discogsMainId: { not: null } },
    select: { discogsMainId: true },
    distinct: ['discogsMainId']
  });
  
  const uniqueReleaseIds = await prisma.version.findMany({
    where: { discogsReleaseId: { not: null } },
    select: { discogsReleaseId: true },
    distinct: ['discogsReleaseId']
  });
  
  console.log(`\n\nUnique Discogs Master IDs: ${uniqueMainIds.length}`);
  console.log(`Unique Discogs Release IDs: ${uniqueReleaseIds.length}`);
  
  if (uniqueMainIds.length === 1) {
    console.log(`\n⚠️  WARNING: All works mapped to single Discogs master: ${uniqueMainIds[0].discogsMainId}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
