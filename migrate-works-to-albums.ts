import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔄 Migrating Works to Albums...\n');

  const works = await prisma.work.findMany({
    include: {
      artist: true,
      versions: true
    }
  });

  let created = 0;
  
  for (const work of works) {
    // Check if album already exists
    const existing = await prisma.album.findUnique({
      where: { mbid: work.mbReleaseGroupId }
    });
    
    if (existing) {
      continue;
    }

    // Create album from work
    await prisma.album.create({
      data: {
        mbid: work.mbReleaseGroupId,
        title: work.title,
        artistId: work.artistId,
        artistCredit: work.artist.name,
        firstReleaseDate: work.firstReleaseDate,
        primaryType: work.type,
        secondaryTypes: null,
        coverArtUrl: work.primaryImageUrl,
        backCoverArtUrl: null
      }
    });
    
    created++;
    
    if (created % 100 === 0) {
      console.log(`✅ Created ${created} albums...`);
    }
  }

  console.log(`\n✅ Complete! Created ${created} albums from works`);
  
  const totalAlbums = await prisma.album.count();
  console.log(`📊 Total albums in database: ${totalAlbums}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error('Error:', err);
    prisma.$disconnect();
  });
