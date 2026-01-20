import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if Album table still exists
  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table'
  ` as Array<{ name: string }>;
  
  console.log('\n📋 Database tables:', tables.map(t => t.name).join(', '));
  
  if (tables.some(t => t.name === 'Album')) {
    console.log('\n✅ Album table still exists!');
    const albumCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Album` as Array<{ count: number }>;
    console.log(`   Found ${albumCount[0]?.count || 0} albums`);
    
    const samplesAlbums = await prisma.$queryRaw`
      SELECT id, title, coverArtUrl FROM Album LIMIT 5
    ` as Array<{ id: string, title: string, coverArtUrl: string | null }>;
    
    console.log('\n📸 Sample albums:');
    samplesAlbums.forEach(a => {
      const hasImage = a.coverArtUrl ? '✅' : '❌';
      console.log(`${hasImage} ${a.title}`);
    });
  } else {
    console.log('\n❌ Album table no longer exists (was migrated to Work/Version)');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(console.error);
