import { prisma } from './src/lib/prisma';

async function main() {
  const stats = await prisma.$queryRaw<any[]>`
    SELECT 
      a.name as artist,
      COUNT(*) as total_albums,
      SUM(CASE WHEN al.primaryType = 'Single' THEN 1 ELSE 0 END) as singles,
      SUM(CASE WHEN al.primaryType = 'Album' THEN 1 ELSE 0 END) as albums
    FROM Artist a
    LEFT JOIN Album al ON al.artistId = a.id
    GROUP BY a.name
    ORDER BY a.name;
  `;
  
  console.log('\n📊 SYNC PROGRESS:\n');
  stats.forEach(stat => {
    console.log(`${stat.artist}:`);
    console.log(`  Total: ${stat.total_albums}`);
    console.log(`  Albums: ${stat.albums}`);
    console.log(`  Singles: ${stat.singles}\n`);
  });
  
  await prisma.$disconnect();
}

main();
