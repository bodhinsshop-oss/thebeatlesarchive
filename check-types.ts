import { prisma } from './src/lib/prisma';

async function main() {
  const allArtists = await prisma.artist.findMany();
  
  console.log('\n📊 RELEASE TYPES BY ARTIST:\n');
  
  for (const artist of allArtists) {
    console.log(`\n${artist.name}:`);
    
    const types = await prisma.album.groupBy({
      by: ['primaryType'],
      where: { artistId: artist.id },
      _count: true,
    });
    
    types.forEach(type => {
      console.log(`  ${type.primaryType || 'NULL'}: ${type._count}`);
    });
    
    const total = await prisma.album.count({ where: { artistId: artist.id } });
    console.log(`  TOTAL: ${total}`);
  }
  
  await prisma.$disconnect();
}

main();
