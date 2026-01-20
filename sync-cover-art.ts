import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DELAY_MS = 1100; // 1.1 seconds between requests
const BATCH_SIZE = 50;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCoverArt(mbReleaseGroupId: string): Promise<string | null> {
  try {
    const url = `https://coverartarchive.org/release-group/${mbReleaseGroupId}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TheBeatlesArchive/1.0 (educational project)' }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Find the front cover
    const frontCover = data.images?.find((img: any) => 
      img.front === true || img.types?.includes('Front')
    );
    
    return frontCover?.image || data.images?.[0]?.image || null;
  } catch (error) {
    // Silently fail for individual works
    return null;
  }
}

async function main() {
  const worksWithoutImages = await prisma.work.findMany({
    where: { primaryImageUrl: null },
    select: {
      id: true,
      mbReleaseGroupId: true,
      title: true,
      artist: { select: { name: true } }
    }
  });

  console.log(`\n🎨 Found ${worksWithoutImages.length} works without cover art`);
  console.log('Starting sync with 1.1s delay between requests...\n');

  let updated = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < worksWithoutImages.length; i++) {
    const work = worksWithoutImages[i];
    
    // Progress indicator
    if (i % 10 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = i / elapsed;
      const remaining = worksWithoutImages.length - i;
      const eta = remaining / rate;
      console.log(`[${i}/${worksWithoutImages.length}] ${Math.round(i/worksWithoutImages.length*100)}% - ETA: ${Math.round(eta/60)}min`);
    }

    const imageUrl = await fetchCoverArt(work.mbReleaseGroupId);
    
    if (imageUrl) {
      await prisma.work.update({
        where: { id: work.id },
        data: { primaryImageUrl: imageUrl }
      });
      updated++;
      console.log(`  ✅ ${work.artist.name} - ${work.title}`);
    } else {
      failed++;
    }

    // Rate limit
    await delay(DELAY_MS);
  }

  const duration = Math.round((Date.now() - startTime) / 1000 / 60);
  
  console.log(`\n✅ Complete! ${updated} images added, ${failed} not found (${duration}min)`);
  console.log(`📊 Total works with images: ${await prisma.work.count({ where: { primaryImageUrl: { not: null } } })}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error('Error:', err);
    prisma.$disconnect();
  });
