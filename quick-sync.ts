import { prisma } from './src/lib/prisma';
import { MusicBrainzClient } from './src/lib/musicbrainz';
import { CoverArtClient } from './src/lib/coverart';
import { discogsClient } from './src/lib/discogs';

const musicbrainzClient = new MusicBrainzClient();
const coverArtClient = new CoverArtClient();

const ARTIST_CONFIGS = [
  { id: 'the-beatles', mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d', name: 'The Beatles' },
  { id: 'john-lennon', mbid: '4d5447d7-c61c-4120-ba1b-d7f471d385b9', name: 'John Lennon' },
  { id: 'paul-mccartney', mbid: 'ba550d0e-adac-4864-b88b-407cab5e76af', name: 'Paul McCartney' },
  { id: 'george-harrison', mbid: '42a8f507-8412-4611-854f-926571049fa0', name: 'George Harrison' },
  { id: 'ringo-starr', mbid: '300c4c73-33ac-4255-9d57-4e32627f5e13', name: 'Ringo Starr' },
];

async function quickSync() {
  console.log('🚀 QUICK SYNC - Processing only NEW works\n');
  
  for (const artist of ARTIST_CONFIGS) {
    console.log(`\n=== ${artist.name} ===`);
    
    // Get all MusicBrainz IDs already in database
    const existingWorks = await prisma.work.findMany({
      where: { artist: { slug: artist.id } },
      select: { mbReleaseGroupId: true }
    });
    const existingIds = new Set(existingWorks.map(w => w.mbReleaseGroupId));
    console.log(`Already have: ${existingIds.size} works`);
    
    // Fetch from MusicBrainz
    const response = await musicbrainzClient.getReleaseGroups(artist.mbid);
    const allReleaseGroups = response['release-groups'] || [];
    const newWorks = allReleaseGroups.filter((rg: { id: string }) => !existingIds.has(rg.id));
    
    console.log(`Found ${newWorks.length} NEW works to process\n`);
    
    if (newWorks.length === 0) {
      console.log(`✅ ${artist.name} is up to date!\n`);
      continue;
    }
    
    // Process only first 50 new works per artist (to avoid timeout)
    const toProcess = newWorks.slice(0, 50);
    console.log(`Processing first ${toProcess.length} works...`);
    
    for (const rg of toProcess) {
      try {
        console.log(`  ${rg.title}...`);
        
        const artistRecord = await prisma.artist.findUnique({
          where: { slug: artist.id }
        });
        
        if (!artistRecord) continue;
        
        // Minimal work creation - just enough to display
        const work = await prisma.work.create({
          data: {
            mbReleaseGroupId: rg.id,
            title: rg.title,
            type: rg['primary-type'] || 'Album',
            firstReleaseDate: rg['first-release-date'] || null,
            artistId: artistRecord.id,
            lastSyncedAt: new Date(),
          }
        });
        
        console.log(`    ✓ Created`);
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`    ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
    
    console.log(`\n✅ ${artist.name} batch complete`);
  }
  
  const finalCount = await prisma.work.count();
  console.log(`\n🎉 Total works now: ${finalCount}`);
}

quickSync()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
