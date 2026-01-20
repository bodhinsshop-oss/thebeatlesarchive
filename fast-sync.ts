#!/usr/bin/env tsx
// ULTRA-SIMPLE SYNC - Just create works, no versions, no Discogs, no images
import { prisma } from './src/lib/prisma';

const ARTISTS = {
  'the-beatles': { id: 'the-beatles', mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d', name: 'The Beatles' },
  'john-lennon': { id: 'john-lennon', mbid: '4d5447d7-c61c-4120-ba1b-d7f471d385b9', name: 'John Lennon' },
  'paul-mccartney': { id: 'paul-mccartney', mbid: 'ba550d0e-adac-4864-b88b-407cab5e76af', name: 'Paul McCartney' },
  'george-harrison': { id: 'george-harrison', mbid: '42a8f507-8412-4611-854f-926571049fa0', name: 'George Harrison' },
  'ringo-starr': { id: 'ringo-starr', mbid: '300c4c73-33ac-4255-9d57-4e32627f5e13', name: 'Ringo Starr' },
};

async function fastSync(artistSlug: string) {
  const artist = ARTISTS[artistSlug as keyof typeof ARTISTS];
  if (!artist) {
    console.log('Artist not found');
    return;
  }

  console.log(`\n=== ${artist.name} ===\n`);

  // Get artist from DB
  const artistRecord = await prisma.artist.findUnique({
    where: { slug: artistSlug }
  });

  if (!artistRecord) {
    console.log('Artist not in database');
    return;
  }

  // Fetch ALL release groups with pagination
  let offset = 0;
  let allReleaseGroups: any[] = [];

  while (true) {
    const url = `https://musicbrainz.org/ws/2/release-group?artist=${artist.mbid}&limit=100&offset=${offset}&fmt=json`;
    console.log(`Fetching offset ${offset}...`);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'TheBeatlesArchive/1.0.0' }
      });

      if (!response.ok) {
        console.log(`Error: ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const releaseGroups = data['release-groups'] || [];

      if (releaseGroups.length === 0) break;

      allReleaseGroups.push(...releaseGroups);
      offset += 100;

      await new Promise(r => setTimeout(r, 1100)); // Rate limit
    } catch (e) {
      console.log(`Fetch error: ${e}`);
      break;
    }
  }

  console.log(`\nFound ${allReleaseGroups.length} release groups total`);

  let added = 0;
  let skipped = 0;

  for (const rg of allReleaseGroups) {
    try {
      // Check if exists
      const exists = await prisma.work.findUnique({
        where: { mbReleaseGroupId: rg.id }
      });

      if (exists) {
        skipped++;
        continue;
      }

      // Create work
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

      await new Promise(r => setTimeout(r, 100)); // Small delay

    } catch (e) {
      console.log(`  Error on "${rg.title}": ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  }

  console.log(`\n✅ Done: ${added} added, ${skipped} already existed\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const artistArg = args.find(arg => arg.startsWith('--artist='));
  const allFlag = args.includes('--all');

  if (allFlag) {
    for (const slug of Object.keys(ARTISTS)) {
      await fastSync(slug);
    }
  } else if (artistArg) {
    const slug = artistArg.split('=')[1];
    await fastSync(slug);
  } else {
    console.log('Usage: npm run fast-sync -- --artist=the-beatles');
    console.log('   or: npm run fast-sync -- --all');
  }

  const total = await prisma.work.count();
  console.log(`📊 Total works in database: ${total}\n`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Fatal error:', e);
  prisma.$disconnect();
  process.exit(1);
});
