#!/usr/bin/env tsx
import { prisma } from '../lib/prisma';
import { musicbrainzClient } from '../lib/musicbrainz';
import { coverArtClient } from '../lib/coverart';
import { discogsClient } from '../lib/discogs';
import { ARTISTS, ArtistConfig } from '../lib/artists';

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

async function syncArtistWorks(artistConfig: ArtistConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎵 Syncing ${artistConfig.name} works...`);
  console.log(`${'='.repeat(60)}\n`);

  await ensureArtistExists(artistConfig);

  try {
    // Fetch all release groups (Works)
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

    // Filter release groups
    const filteredReleaseGroups = allReleaseGroups.filter(rg => {
      if (rg['primary-type'] && !ALLOWED_PRIMARY_TYPES.includes(rg['primary-type'])) {
        return false;
      }
      return true;
    });

    console.log(`Filtered to ${filteredReleaseGroups.length} relevant works\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const rg of filteredReleaseGroups) {
      try {
        console.log(`Processing work: ${rg.title}...`);

        // Get cover art
        const coverArt = await coverArtClient.getReleaseGroupArt(rg.id);
        const frontCover = coverArt?.images?.find((img: any) => img.front);

        // Try to match with Discogs master release
        let discogsMainId: string | null = null;
        let matchConfidence: number | null = null;
        
        try {
          const artistName = rg['artist-credit']?.map(ac => ac.name).join(', ') || artistConfig.name;
          // FIX: Combine artist and title into single search query
          const searchQuery = `${artistName} ${rg.title}`;
          const searchResults = await discogsClient.searchReleases(searchQuery);
          
          if (searchResults && searchResults.length > 0) {
            // Prefer master releases and match title
            const titleLower = rg.title.toLowerCase();
            const masterResult = searchResults.find(r => 
              r.type === 'master' && r.title.toLowerCase().includes(titleLower)
            );
            
            if (masterResult) {
              discogsMainId = masterResult.id.toString();
              matchConfidence = masterResult.title.toLowerCase() === titleLower ? 1.0 : 0.7;
              
              // Store mapping audit
              await prisma.mappingAudit.create({
                data: {
                  entityType: 'work',
                  mbid: rg.id,
                  discogsId: discogsMainId,
                  matchConfidence: matchConfidence,
                  matchMethod: 'api_search',
                }
              });
              
              console.log(`  ✓ Matched to Discogs master: ${discogsMainId} (${masterResult.title})`);
            } else {
              console.log(`  ℹ No matching master found in Discogs search results`);
            }
          }
        } catch (discogsError) {
          console.log(`  ! Could not match to Discogs:`, discogsError instanceof Error ? discogsError.message : 'Unknown error');
        }

        // Get tracklist from first release
        let tracklistJson: string | null = null;
        const rgDetails = await musicbrainzClient.getReleaseGroupDetails(rg.id);
        
        if (rgDetails.releases && rgDetails.releases.length > 0) {
          const firstRelease = rgDetails.releases[0];
          const releaseDetails = await musicbrainzClient.getRelease(firstRelease.id);
          
          if (releaseDetails.media && releaseDetails.media.length > 0) {
            const tracks = [];
            for (const media of releaseDetails.media) {
              if (media.tracks) {
                for (const track of media.tracks) {
                  tracks.push({
                    position: track.position || tracks.length + 1,
                    title: track.title || track.recording?.title || 'Unknown',
                    length: track.length || track.recording?.length || null,
                  });
                }
              }
            }
            tracklistJson = JSON.stringify(tracks);
          }
        }

        // Create or update Work
        const workData = {
          mbReleaseGroupId: rg.id,
          discogsMainId: discogsMainId,
          title: rg.title,
          type: rg['primary-type'] || 'Album',
          firstReleaseDate: rg['first-release-date'] || null,
          artistId: artistConfig.id,
          primaryImageUrl: frontCover?.thumbnails?.large || frontCover?.image || null,
          tracklistJson: tracklistJson,
          lastSyncedAt: new Date(),
        };

        const existingWork = await prisma.work.findUnique({
          where: { mbReleaseGroupId: rg.id }
        });

        let work;
        try {
          if (existingWork) {
            work = await prisma.work.update({
              where: { mbReleaseGroupId: rg.id },
              data: workData
            });
          } else {
            work = await prisma.work.create({
              data: workData
            });
          }
        } catch (dbError) {
          console.log(`  ! Database error for work:`, dbError instanceof Error ? dbError.message : 'Unknown');
          // If update/create fails, use existing or skip
          if (existingWork) {
            work = existingWork;
          } else {
            throw dbError;
          }
        }

        // Sync versions (releases)
        if (rgDetails.releases && rgDetails.releases.length > 0) {
          console.log(`  Processing ${rgDetails.releases.length} versions...`);
          
          for (const release of rgDetails.releases.slice(0, 20)) {
            try {
              const releaseDetails = await musicbrainzClient.getRelease(release.id);
              
              // Try to match with Discogs release
              let discogsReleaseId: string | null = null;
              let discogsUrl: string | null = null;
              let discogsMarketplaceUrl: string | null = null;
              
              // Check if MusicBrainz has Discogs URL
              if (releaseDetails.relations) {
                const discogsRelation = releaseDetails.relations.find((rel: any) => 
                  rel.type === 'discogs' && rel.url?.resource
                );
                if (discogsRelation) {
                  const url = discogsRelation.url.resource;
                  const match = url.match(/discogs\.com\/(?:master|release)\/(\d+)/);
                  if (match) {
                    discogsReleaseId = match[1];
                    discogsUrl = url;
                    discogsMarketplaceUrl = url.includes('/master/') 
                      ? `https://www.discogs.com/sell/list?master_id=${discogsReleaseId}`
                      : `https://www.discogs.com/sell/release/${discogsReleaseId}`;
                  }
                }
              }

              // Get format info
              let formatJson: string | null = null;
              if (releaseDetails.media && releaseDetails.media.length > 0) {
                const formats = releaseDetails.media.map((m: any) => ({
                  format: m.format || 'Unknown',
                  trackCount: m['track-count'] || 0,
                }));
                formatJson = JSON.stringify(formats);
              }

              // Get label info
              let labelsJson: string | null = null;
              if (releaseDetails['label-info'] && releaseDetails['label-info'].length > 0) {
                const labels = releaseDetails['label-info'].map((li: any) => ({
                  name: li.label?.name || 'Unknown',
                  catalogNumber: li['catalog-number'] || null,
                }));
                labelsJson = JSON.stringify(labels);
              }

              // Get identifiers (barcodes, etc)
              let identifiersJson: string | null = null;
              if (releaseDetails.barcode) {
                identifiersJson = JSON.stringify({ barcode: releaseDetails.barcode });
              }

              // Get cover images
              let imageUrlsJson: string | null = null;
              try {
                const releaseCoverArt = await coverArtClient.getReleaseArt(release.id);
                if (releaseCoverArt?.images && releaseCoverArt.images.length > 0) {
                  const imageUrls = releaseCoverArt.images.map((img: any) => img.image);
                  imageUrlsJson = JSON.stringify(imageUrls);
                }
              } catch (coverArtError) {
                // Cover art fetch failed, continue without images
              }

              const versionData = {
                mbReleaseId: release.id,
                workId: work.id,
                discogsReleaseId: discogsReleaseId,
                discogsUrl: discogsUrl,
                discogsMarketplaceUrl: discogsMarketplaceUrl,
                country: release.country || null,
                releaseDate: release.date || null,
                formatJson: formatJson,
                labelsJson: labelsJson,
                identifiersJson: identifiersJson,
                notes: releaseDetails.disambiguation || null,
                imageUrlsJson: imageUrlsJson,
                lastSyncedAt: new Date(),
              };

              try {
                const existingVersion = await prisma.version.findUnique({
                  where: { mbReleaseId: release.id }
                });

                if (existingVersion) {
                  await prisma.version.update({
                    where: { mbReleaseId: release.id },
                    data: versionData
                  });
                } else {
                  await prisma.version.create({
                    data: versionData
                  });
                }
              } catch (versionDbError) {
                console.log(`      ! Database error for version:`, versionDbError instanceof Error ? versionDbError.message : 'Unknown');
                // Continue with other versions
              }
            } catch (versionError) {
              console.log(`    ! Error processing version ${release.id}:`, versionError instanceof Error ? versionError.message : 'Unknown');
            }
          }
        }

        successCount++;
        console.log(`✓ ${rg.title} - Complete\n`);
      } catch (error) {
        errorCount++;
        console.error(`✗ ${rg.title} - Error:`, error instanceof Error ? error.message : String(error));
        console.log('');
        // Add delay after error to avoid rate limit issues
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Small delay between works to be extra safe
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n' + '='.repeat(60));
    console.log(`${artistConfig.name} sync complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error(`Fatal error during ${artistConfig.name} sync:`, error instanceof Error ? error.message : String(error));
    // Don't throw - continue to next artist
  }
}

// Add process handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - continue running
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - continue running
});

async function main() {
  const args = process.argv.slice(2);
  const artistArg = args.find(arg => arg.startsWith('--artist='));
  const allFlag = args.includes('--all');

  try {
    if (allFlag) {
      console.log('🎵 Syncing all artists...\n');
      for (const artistSlug of Object.keys(ARTISTS)) {
        await syncArtistWorks(ARTISTS[artistSlug]);
      }
    } else if (artistArg) {
      const artistSlug = artistArg.split('=')[1];
      const artist = ARTISTS[artistSlug];
      
      if (!artist) {
        console.error(`❌ Artist '${artistSlug}' not found.`);
        console.log('Available artists:', Object.keys(ARTISTS).join(', '));
        process.exit(1);
      }
      
      await syncArtistWorks(artist);
    } else {
      console.log('ℹ️  No artist specified, syncing The Beatles (use --artist=<slug> or --all)');
      await syncArtistWorks(ARTISTS['the-beatles']);
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
