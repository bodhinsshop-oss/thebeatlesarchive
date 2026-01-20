import { prisma } from './src/lib/prisma';

async function seedSoloArtists() {
  const artists = [
    {
      slug: 'john-lennon',
      name: 'John Lennon',
      musicbrainzArtistId: '4d5447d7-c61c-4120-ba1b-d7f471d385b9',
      type: 'solo',
    },
    {
      slug: 'paul-mccartney',
      name: 'Paul McCartney',
      musicbrainzArtistId: 'ba550d0e-adac-4864-b88b-407cab5e76af',
      type: 'solo',
    },
    {
      slug: 'george-harrison',
      name: 'George Harrison',
      musicbrainzArtistId: '42a8f507-8412-4611-854f-926571049fa0',
      type: 'solo',
    },
  ];

  console.log('\n➕ Adding solo artists to database...\n');

  for (const artist of artists) {
    const existing = await prisma.artist.findUnique({ where: { slug: artist.slug } });
    
    if (existing) {
      console.log(`✓ ${artist.name} already exists`);
    } else {
      await prisma.artist.create({ data: artist });
      console.log(`✓ Added ${artist.name}`);
    }
  }

  console.log('\n✅ Solo artists ready!\n');
}

seedSoloArtists()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
