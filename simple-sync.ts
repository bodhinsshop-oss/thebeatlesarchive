// Simple sync: Add all works to database WITHOUT versions/Discogs  
// This gets the catalog populated quickly, detailed data can come later

import { prisma } from './src/lib/prisma';

const ARTISTS = [
  { slug: 'the-beatles', mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d', name: 'The Beatles' },
  { slug: 'john-lennon', mbid: '4d5447d7-c61c-4120-ba1b-d7f471d385b9', name: 'John Lennon' },
  { slug: 'paul-mccartney', mbid: 'ba550d0e-adac-4864-b88b-407cab5e76af', name: 'Paul McCartney' },
  { slug: 'george-harrison', mbid: '42a8f507-8412-4611-854f-926571049fa0', name: 'George Harrison' },
  { slug: 'ringo-starr', mbid: '300c4c73-33ac-4255-9d57-4e32627f5e13', name: 'Ringo Starr' },
];

async function simpleSync() {
  console.log('\n🚀 SIMPLE SYNC - Works only, no versions\n');
  
  for (const artist of ARTISTS) {
    console.log(`\n=== ${artist.name} ===`);
    
    const artistRecord = await prisma.artist.findUnique({
      where: { slug: artist.slug }
    });
    
    if (!artistRecord) {
      console.log('Artist not in database, skipping');
      continue;
    }
    
    // Fetch all release groups from MusicBrainz
    const url = `https://musicbrainz.org/ws/2/release-group?artist=${artist.mbid}&limit=100&offset=0&fmt=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TheBeatlesArchive/1.0.0' }
    });
    const data = await response.json();
    const releaseGroups = data['release-groups'] || [];
    
    console.log(`Found ${releaseGroups.length} release groups`);
    
    let added = 0;
    for (const rg of releaseGroups) {
      try {
        // Check if already exists
        const exists = await prisma.work.findUnique({
          where: { mbReleaseGroupId: rg.id }
        });
        
        if (exists) continue;
        
        // Create minimal work entry
        await prisma.work.create({
          data: {
            mbReleaseGroupId: rg.id,
            title: rg.title,
            type: rg['primary-type'] || 'Album',
            firstReleaseDate: rg['first-release-date'] || null,
            artistId: artistRecord.id,
            lastSyncedAt: new Date(),
          }
        });
        
        added++;
        if (added % 10 === 0) {
          console.log(`  ${added} works added...`);
        }
        
        await new Promise(r => setTimeout(r, 1100)); // Respect rate limit
      } catch (e) {
        console.log(`  Error on ${rg.title}: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }
    
    console.log(`✅ Added ${added} new works for ${artist.name}`);
  }
  
  const total = await prisma.work.count();
  console.log(`\n🎉 Total works in database: ${total}\n`);
}

simpleSync()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
