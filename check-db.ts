import { prisma } from './src/lib/prisma';

async function check() {
  const total = await prisma.work.count();
  const beatles = await prisma.work.count({ where: { artist: { slug: 'the-beatles' } } });
  const john = await prisma.work.count({ where: { artist: { slug: 'john-lennon' } } });
  const paul = await prisma.work.count({ where: { artist: { slug: 'paul-mccartney' } } });
  const george = await prisma.work.count({ where: { artist: { slug: 'george-harrison' } } });
  const ringo = await prisma.work.count({ where: { artist: { slug: 'ringo-starr' } } });
  
  console.log('\n📊 DATABASE STATUS\n');
  console.log(`Total Works: ${total} / 1640 (${Math.round(total/1640*100)}%)\n`);
  console.log(`The Beatles: ${beatles}`);
  console.log(`John Lennon: ${john}`);
  console.log(`Paul McCartney: ${paul}`);
  console.log(`George Harrison: ${george}`);
  console.log(`Ringo Starr: ${ringo}\n`);
}

check().then(() => prisma.$disconnect());
