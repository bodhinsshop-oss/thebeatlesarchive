import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Release {
  id: string;
  title: string;
  date?: string;
  country?: string;
  barcode?: string;
  'label-info'?: Array<{
    label?: { name?: string };
    'catalog-number'?: string;
  }>;
  media?: Array<{
    format?: string;
  }>;
}

interface ReleaseResponse {
  releases: Release[];
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Global rate limiter to keep MusicBrainz happy
let lastRequestAt = 0;
async function rateLimit(minSpacingMs = 1000) {
  const now = Date.now();
  const wait = minSpacingMs - (now - lastRequestAt);
  if (wait > 0) {
    await sleep(wait);
  }
  lastRequestAt = Date.now();
}

async function getMusicBrainzReleases(releaseGroupId: string): Promise<Release[]> {
  const url = `https://musicbrainz.org/ws/2/release?release-group=${releaseGroupId}&fmt=json`;

  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await rateLimit();

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TheBeatlesArchive/1.0 (educational)'
      }
    });

    if (response.ok) {
      const data: ReleaseResponse = await response.json();
      return data.releases || [];
    }

    if (response.status === 503) {
      const backoff = 800 * attempt;
      console.log(`  ⚠ MusicBrainz 503, retrying in ${backoff}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(backoff);
      continue;
    }

    console.log(`  ⚠ MusicBrainz error: ${response.status}`);
    return [];
  }

  console.log('  ⚠ MusicBrainz 503 persisted; skipping this work');
  return [];
}

async function main() {
  const args = process.argv.slice(2);
  const artistArg = args.find(a => a.startsWith('--artist='));

  if (!artistArg) {
    console.error('Usage: npm run sync:versions -- --artist=<slug>');
    process.exit(1);
  }

  const artistSlug = artistArg.split('=')[1];

  const artist = await prisma.artist.findUnique({
    where: { slug: artistSlug }
  });

  if (!artist) {
    console.error(`Artist not found: ${artistSlug}`);
    process.exit(1);
  }

  const existingVersionIds = new Set(
    (
      await prisma.version.findMany({
        where: { work: { artistId: artist.id } },
        select: { mbReleaseId: true }
      })
    ).map(v => v.mbReleaseId)
  );

  const works = await prisma.work.findMany({
    where: { artistId: artist.id },
    orderBy: { title: 'asc' }
  });

  let totalVersionsCreated = 0;
  let worksProcessed = 0;
  const startTime = Date.now();

  const concurrency = 5;
  const queue = [...works];

  async function processWork(work: typeof works[number]) {
    const releases = await getMusicBrainzReleases(work.mbReleaseGroupId);

    const versionsToCreate = releases
      .filter(release => !existingVersionIds.has(release.id))
      .map(release => {
        const formats = release.media?.map(m => m.format).filter(Boolean) || [];

        const labels = release['label-info']?.map(li => ({
          name: li.label?.name || null,
          catalogNumber: li['catalog-number'] || null
        })).filter(l => l.name) || [];

        const identifiers = [] as { type: string; value: string }[];
        if (release.barcode) {
          identifiers.push({ type: 'barcode', value: release.barcode });
        }

        return {
          mbReleaseId: release.id,
          workId: work.id,
          country: release.country || null,
          releaseDate: release.date || null,
          formatJson: formats.length > 0 ? JSON.stringify(formats) : null,
          labelsJson: labels.length > 0 ? JSON.stringify(labels) : null,
          identifiersJson: identifiers.length > 0 ? JSON.stringify(identifiers) : null,
          imageUrlsJson: null
        };
      });

    if (versionsToCreate.length === 0) return 0;

    try {
      await prisma.version.createMany({
        data: versionsToCreate
      });

      versionsToCreate.forEach(v => existingVersionIds.add(v.mbReleaseId));
      return versionsToCreate.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ❌ Error creating versions for ${work.title}: ${message}`);
      return 0;
    }
  }

  async function worker() {
    while (queue.length > 0) {
      const work = queue.pop();
      if (!work) break;

      const created = await processWork(work);
      totalVersionsCreated += created;
      worksProcessed++;

      if (worksProcessed % 10 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = worksProcessed / Math.max(elapsed, 0.001);
        const remaining = works.length - worksProcessed;
        const etaSeconds = remaining / Math.max(rate, 0.001);
        const etaMinutes = Math.floor(etaSeconds / 60);
        console.log(`[${worksProcessed}/${works.length}] ${Math.round((worksProcessed / works.length) * 100)}% | ${totalVersionsCreated} versions | ETA: ${etaMinutes}min`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const duration = Math.floor((Date.now() - startTime) / 1000 / 60);

  console.log(`\n✅ COMPLETE!`);
  console.log(`   Works processed: ${worksProcessed}`);
  console.log(`   Versions created: ${totalVersionsCreated}`);
  console.log(`   Duration: ${duration} minutes`);
  console.log(`\n💡 Run "npm run sync:images" later to fetch cover art\n`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
