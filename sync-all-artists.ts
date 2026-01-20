import { execSync } from 'child_process';

const artists = [
  'the-beatles',
  'john-lennon',
  'paul-mccartney',
  'george-harrison',
  'ringo-starr',
];

async function syncAll() {
  console.log('🎵 Starting full archive sync queue...\n');
  
  for (const artist of artists) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`⏳ Syncing: ${artist.toUpperCase()}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      execSync(`npm run sync:versions -- --artist=${artist}`, {
        stdio: 'inherit',
      });
      console.log(`\n✅ ${artist} completed!\n`);
    } catch (error) {
      console.error(`\n❌ Error syncing ${artist}:`, error);
      console.log('Continuing with next artist...\n');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ FULL SYNC COMPLETE!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('  → npm run sync:images  (fetch cover art)');
  console.log('  → npm run sync:discogs (optional: Discogs metadata)\n');
}

syncAll().catch(console.error);
