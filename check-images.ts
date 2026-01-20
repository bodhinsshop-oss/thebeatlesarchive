import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const works = await prisma.work.findMany({
    take: 10,
    select: {
      id: true,
      title: true,
      primaryImageUrl: true,
      artist: {
        select: { name: true }
      }
    }
  });

  console.log('\n📸 Checking cover art URLs:\n');
  
  works.forEach(work => {
    const hasImage = work.primaryImageUrl ? '✅' : '❌';
    console.log(`${hasImage} ${work.artist.name} - ${work.title}`);
    if (work.primaryImageUrl) {
      console.log(`   ${work.primaryImageUrl.substring(0, 80)}...`);
    }
  });
  
  const totalWorks = await prisma.work.count();
  const worksWithImages = await prisma.work.count({
    where: { primaryImageUrl: { not: null } }
  });
  
  console.log(`\n📊 Summary: ${worksWithImages} of ${totalWorks} works have cover art`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(console.error);
