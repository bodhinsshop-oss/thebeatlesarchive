#!/usr/bin/env tsx
import { prisma } from '../lib/prisma';
import { musicbrainzClient } from '../lib/musicbrainz';
import { coverArtClient } from '../lib/coverart';
import { ARTISTS, ArtistConfig } from '../lib/artists';

// Types to include - including ALL types now to capture everything
const ALLOWED_PRIMARY_TYPES = ['Album', 'EP', 'Live', 'Soundtrack', 'Single', 'Broadcast', 'Other'];
const ALLOWED_SECONDARY_TYPES = ['Compilation', 'Live', 'Soundtrack', 'Remix', 'DJ-mix', 'Mixtape/Street', 'Demo', 'Audiobook', 'Audio drama', 'Spokenword', 'Interview'];

interface ReleaseGroup {
  id: string;
  title: string;
  'first-release-date'?: string;
  'primary-type'?: string;
  'secondary-types'?: string[];
  'artist-credit'?: Array<{ name: string }>;
}

async function ensureArtistExists(artistConfig: ArtistConfig) {
  const existing = await prisma.artist.findUnique({
    where: { id: artistConfig.id }
  });

  if (!existing) {
    await prisma.artist.create({
      data: {
        id: artistConfig.id,
        name: artistConfig.name,
        slug: artistConfig.slug,
        musicbrainzArtistId: artistConfig.musicbrainzArtistId,
        type: artistConfig.type,
      }
    });
  }
}

async function syncArtist(artistConfig: ArtistConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎵 Syncing ${artistConfig.name}...`);
  console.log(`${'='.repeat(60)}\n`);

  await ensureArtistExists(artistConfig);

  try {
    // Fetch all release groups for the artist
    let offset = 0;
    const limit = 100;
    let allReleaseGroups: ReleaseGroup[] = [];
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching release groups (offset: ${offset})...`);
      const data = await musicbrainzClient.getReleaseGroups(artistConfig.musicbrainzArtistId, limit, offset);
      
      if (data['release-groups'] && data['release-groups'].length > 0) {
        allReleaseGroups = allReleaseGroups.concat(data['release-groups']);
        offset += limit;
        
        const totalCount = data['release-group-count'] || 0;
        hasMore = offset < totalCount;
      } else {
        hasMore = false;
      }
    }

    console.log(`\nFound ${allReleaseGroups.length} total release groups`);

    // Filter release groups - now including all Singles
    const filteredReleaseGroups = allReleaseGroups.filter(rg => {
      if (rg['primary-type'] && !ALLOWED_PRIMARY_TYPES.includes(rg['primary-type'])) {
        return false;
      }

      return true;
    });

    console.log(`Filtered to ${filteredReleaseGroups.length} relevant albums\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const rg of filteredReleaseGroups) {
      try {
        console.log(`Processing: ${rg.title}...`);

        const existing = await prisma.album.findUnique({
          where: { mbid: rg.id }
        });

        const coverArt = await coverArtClient.getReleaseGroupArt(rg.id);
        const frontCover = coverArt?.images?.find((img: any) => img.front);
        const backCover = coverArt?.images?.find((img: any) => img.back);

        const albumData = {
          mbid: rg.id,
          title: rg.title,
          artistId: artistConfig.id,
          artistCredit: rg['artist-credit']?.map(ac => ac.name).join(', ') || artistConfig.name,
          firstReleaseDate: rg['first-release-date'] || null,
          primaryType: rg['primary-type'] || null,
          secondaryTypes: rg['secondary-types'] ? JSON.stringify(rg['secondary-types']) : null,
          coverArtUrl: frontCover?.thumbnails?.large || frontCover?.image || null,
          backCoverArtUrl: backCover?.thumbnails?.large || backCover?.image || null,
        };

        if (existing) {
          await prisma.album.update({
            where: { mbid: rg.id },
            data: albumData
          });
        } else {
          await prisma.album.create({
            data: albumData
          });
        }

        // Fetch detailed release information
        const rgDetails = await musicbrainzClient.getReleaseGroupDetails(rg.id);
        
        if (rgDetails.releases && rgDetails.releases.length > 0) {
          for (const release of rgDetails.releases.slice(0, 5)) {
            const existingRelease = await prisma.release.findUnique({
              where: { mbid: release.id }
            });

            const album = await prisma.album.findUnique({ where: { mbid: rg.id } });
            if (!album) continue;

            const releaseData = {
              albumId: album.id,
              mbid: release.id,
              title: release.title,
              date: release.date || null,
              country: release.country || null,
              label: null,
              catalogNum: null,
              format: null,
            };

            if (existingRelease) {
              await prisma.release.update({
                where: { mbid: release.id },
                data: releaseData
              });
            } else {
              await prisma.release.create({
                data: releaseData
              });
            }
          }

          // Get tracks from first release
          const firstRelease = rgDetails.releases[0];
          if (firstRelease) {
            const releaseDetails = await musicbrainzClient.getRelease(firstRelease.id);
            const album = await prisma.album.findUnique({ where: { mbid: rg.id } });
            
            if (releaseDetails.media && releaseDetails.media.length > 0 && album) {
              await prisma.track.deleteMany({
                where: { albumId: album.id }
              });

              let position = 1;
              for (const media of releaseDetails.media) {
                if (media.tracks) {
                  for (const track of media.tracks) {
                    await prisma.track.create({
                      data: {
                        albumId: album.id,
                        position: position++,
                        title: track.title || track.recording?.title || 'Unknown',
                        length: track.length || track.recording?.length || null,
                      }
                    });
                  }
                }
              }
            }
          }
        }

        successCount++;
        console.log(`✓ ${rg.title} - Success\n`);
      } catch (error) {
        errorCount++;
        console.error(`✗ ${rg.title} - Error:`, error);
        console.log('');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`${artistConfig.name} sync complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error(`Fatal error during ${artistConfig.name} sync:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const artistArg = args.find(arg => arg.startsWith('--artist='));
  const allFlag = args.includes('--all');

  try {
    if (allFlag) {
      console.log('🎵 Syncing all artists...\n');
      for (const artistSlug of Object.keys(ARTISTS)) {
        await syncArtist(ARTISTS[artistSlug]);
      }
    } else if (artistArg) {
      const artistSlug = artistArg.split('=')[1];
      const artist = ARTISTS[artistSlug];
      
      if (!artist) {
        console.error(`❌ Artist '${artistSlug}' not found.`);
        console.log('Available artists:', Object.keys(ARTISTS).join(', '));
        process.exit(1);
      }
      
      await syncArtist(artist);
    } else {
      // Default: sync The Beatles
      console.log('ℹ️  No artist specified, syncing The Beatles (use --artist=<slug> or --all)');
      await syncArtist(ARTISTS['the-beatles']);
    }

    console.log('\n✅ All sync operations completed!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
