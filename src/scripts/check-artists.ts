#!/usr/bin/env tsx
import { prisma } from '../lib/prisma';
import { ARTISTS } from '../lib/artists';

async function ensureArtists() {
  console.log('Ensuring all artists exist...\n');
  
  for (const [slug, artistConfig] of Object.entries(ARTISTS)) {
    const existing = await prisma.artist.findUnique({
      where: { id: artistConfig.id }
    });

    if (!existing) {
      console.log(`Creating artist: ${artistConfig.name}`);
      await prisma.artist.create({
        data: {
          id: artistConfig.id,
          name: artistConfig.name,
          slug: artistConfig.slug,
          musicbrainzArtistId: artistConfig.musicbrainzArtistId,
          type: artistConfig.type,
        }
      });
    } else {
      console.log(`✓ Artist exists: ${artistConfig.name}`);
    }
  }

  // Count albums per artist
  console.log('\nAlbum counts:');
  for (const [slug, artistConfig] of Object.entries(ARTISTS)) {
    const count = await prisma.album.count({
      where: { artistId: artistConfig.id }
    });
    console.log(`  ${artistConfig.name}: ${count} albums`);
  }

  await prisma.$disconnect();
}

ensureArtists();
