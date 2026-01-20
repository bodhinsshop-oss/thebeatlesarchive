#!/usr/bin/env tsx
import { prisma } from '../lib/prisma';

const ALBUMS_TO_REMOVE = [
  'Unfinished Music No. 1: Two Virgins',
  'Two Virgins',
  'Unfinished Music No.1: Two Virgins',
];

async function removeAlbums() {
  console.log('Removing excluded albums...\n');
  
  for (const title of ALBUMS_TO_REMOVE) {
    const deleted = await prisma.album.deleteMany({
      where: {
        title: {
          contains: title
        }
      }
    });
    
    if (deleted.count > 0) {
      console.log(`✓ Removed: ${title} (${deleted.count} entries)`);
    }
  }
  
  console.log('\nDone!');
  await prisma.$disconnect();
}

removeAlbums();
