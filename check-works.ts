import { prisma } from './src/lib/prisma';

async function main() {
  const works = await prisma.work.count();
  const versions = await prisma.version.count();
  const mappings = await prisma.mappingAudit.count();

  const worksByArtist = await prisma.work.groupBy({
    by: ['artistId'],
    _count: true,
  });

  console.log('\n📊 Work/Version Architecture Stats:');
  console.log('=====================================');
  console.log(`Total Works: ${works}`);
  console.log(`Total Versions: ${versions}`);
  console.log(`Discogs Mappings: ${mappings}\n`);

  for (const group of worksByArtist) {
    const artist = await prisma.artist.findUnique({
      where: { id: group.artistId }
    });
    const versionCount = await prisma.version.count({
      where: {
        work: { artistId: group.artistId }
      }
    });
    console.log(`${artist?.name}: ${group._count} works, ${versionCount} versions`);
  }

  // Sample work with versions
  const sampleWork = await prisma.work.findFirst({
    include: {
      versions: true,
    }
  });

  if (sampleWork) {
    console.log(`\n📀 Sample Work: "${sampleWork.title}"`);
    console.log(`   Type: ${sampleWork.type}`);
    console.log(`   MusicBrainz: ${sampleWork.mbReleaseGroupId}`);
    console.log(`   Discogs Master: ${sampleWork.discogsMainId || 'Not matched'}`);
    console.log(`   Versions: ${sampleWork.versions.length}`);
    
    if (sampleWork.versions[0]) {
      const v = sampleWork.versions[0];
      console.log(`\n   📦 Example Version:`);
      console.log(`      Country: ${v.country || 'Unknown'}`);
      console.log(`      Date: ${v.releaseDate || 'Unknown'}`);
      console.log(`      Discogs: ${v.discogsUrl || 'Not linked'}`);
      console.log(`      Marketplace: ${v.discogsMarketplaceUrl || 'N/A'}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
