import { prisma } from './src/lib/prisma';

async function main() {
  const allArtists = await prisma.artist.findMany();
  
  console.log('\n📊 SINGLES COUNT BY ARTIST:\n');
  
  for (const artist of allArtists) {
    const singles = await prisma.album.count({ 
      where: { artistId: artist.id, primaryType: 'Single' } 
    });
    const total = await prisma.album.count({ 
      where: { artistId: artist.id } 
    });
    console.log(`${artist.name}: ${singles} singles out of ${total} total releases`);
  }
  
  await prisma.$disconnect();
}

main();
