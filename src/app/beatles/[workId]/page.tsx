import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReadingModeToggle from '@/components/ReadingModeToggle';
import CopyButton from '@/components/CopyButton';
import { getEraLabel } from '@/lib/era';

type Props = {
  params: Promise<{ workId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { workId } = await params;
  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: { artist: true }
  });

  if (!work) return { title: 'Work Not Found' };

  return {
    title: `${work.title} - ${work.artist.name} | The Beatles Archive`,
    description: `All versions and pressings of ${work.title} by ${work.artist.name}`,
  };
}

export default async function WorkPage({ params }: Props) {
  const { workId } = await params;
  
  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      artist: true,
      versions: {
        orderBy: { releaseDate: 'asc' }
      }
    }
  });

  if (!work) notFound();

  const tracklist = work.tracklistJson ? JSON.parse(work.tracklistJson) : null;
  const year = work.firstReleaseDate?.split('-')[0] || 'Unknown';
  const era = getEraLabel(work.firstReleaseDate, work.artist.slug);

  // Group versions by country
  const versionsByCountry = work.versions.reduce((acc, version) => {
    const country = version.country || 'International';
    if (!acc[country]) acc[country] = [];
    acc[country].push(version);
    return acc;
  }, {} as Record<string, typeof work.versions>);

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-neutral-900 text-black dark:text-white">
        <div className="album-container px-6 py-12">
          {/* Breadcrumb */}
          <nav className="breadcrumb mb-12 text-metadata">
            <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <Link 
              href={`/${work.artist.slug === 'the-beatles' ? '' : 'solo/' + work.artist.slug}`} 
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {work.artist.name}
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="opacity-60">{work.title}</span>
          </nav>

          {/* Work Header - Editorial Layout */}
          <header className="section-spacing">
            <div className="grid md:grid-cols-[280px_1fr] gap-12 items-start">
              {/* Cover Art */}
              <div className="flex flex-col gap-4">
                {work.primaryImageUrl ? (
                  <Image
                    src={work.primaryImageUrl}
                    alt={`${work.title} cover art`}
                    width={280}
                    height={280}
                    className="w-full shadow-soft"
                    priority
                  />
                ) : (
                  <div className="w-full aspect-square bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-sm">
                    No Cover Art
                  </div>
                )}
                
                {/* Quick Actions */}
                <div className="flex flex-col gap-2">
                  {work.discogsMainId && (
                    <CopyButton 
                      text={`https://www.discogs.com/master/${work.discogsMainId}`}
                      label="Discogs Link"
                    />
                  )}
                  <CopyButton 
                    text={work.mbReleaseGroupId}
                    label="MusicBrainz ID"
                  />
                </div>
              </div>

              {/* Title & Metadata */}
              <div>
                <h1 className="text-display mb-3">
                  {work.title}
                </h1>
                
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-6 font-light">
                  {work.artist.name}
                </p>

                {/* Key Facts - Clean, Minimal */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium">
                    {work.type}
                  </span>
                  <span className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-sm">
                    {year}
                  </span>
                  {era && (
                    <span className="era-badge">
                      {era}
                    </span>
                  )}
                  <span className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-sm">
                    {work.versions.length} {work.versions.length === 1 ? 'version' : 'versions'}
                  </span>
                </div>

                {/* External References - Subtle but Accessible */}
                <div className="space-y-2">
                  <p className="text-small font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    External Sources:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://musicbrainz.org/release-group/${work.mbReleaseGroupId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-badge hover:border-purple-600 dark:hover:border-purple-400 transition-colors"
                    >
                      MusicBrainz →
                    </a>
                    {work.discogsMainId && (
                      <>
                        <a
                          href={`https://www.discogs.com/master/${work.discogsMainId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-badge hover:border-purple-600 dark:hover:border-purple-400 transition-colors"
                        >
                          Discogs →
                        </a>
                        <a
                          href={`https://www.discogs.com/sell/list?master_id=${work.discogsMainId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-badge hover:border-purple-600 dark:hover:border-purple-400 transition-colors font-semibold"
                        >
                          Marketplace →
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Tracklist - Primary Focus, Clean Typography */}
          {tracklist && tracklist.length > 0 && (
            <section className="section-spacing">
              <h2 className="mb-6">Tracklist</h2>
              
              <div className="reading-container">
                <div className="space-y-1">
                  {tracklist.map((track: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-baseline gap-4">
                        <span className="track-number">
                          {track.position}
                        </span>
                        <span className="text-base">
                          {track.title}
                        </span>
                      </div>
                      {track.length && (
                        <span className="text-metadata tabular-nums">
                          {Math.floor(track.length / 60000)}:{String(Math.floor((track.length % 60000) / 1000)).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Versions - From Table to Tool */}
          <section className="section-spacing">
            <div className="mb-6">
              <h2 className="mb-2">
                All Versions ({work.versions.length})
              </h2>
              <p className="text-metadata">
                Different pressings, editions, and releases organized by country
              </p>
            </div>

            {Object.entries(versionsByCountry).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(versionsByCountry).map(([country, versions]) => (
                  <div key={country}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>{country}</span>
                      <span className="text-metadata font-normal">
                        ({versions.length})
                      </span>
                    </h3>
                    
                    <div className="space-y-3">
                      {versions.map((version) => {
                        const formats = version.formatJson ? JSON.parse(version.formatJson) : [];
                        const labels = version.labelsJson ? JSON.parse(version.labelsJson) : [];
                        const hasMultipleFormats = formats.length > 1;
                        const isPurpleWorthy = hasMultipleFormats || version.notes;

                        return (
                          <Link
                            key={version.id}
                            href={`/${work.artist.slug === 'the-beatles' ? 'beatles' : 'solo/' + work.artist.slug}/${work.id}/version/${version.id}`}
                            className={`block border border-neutral-200 dark:border-neutral-700 p-4 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors ${isPurpleWorthy ? 'hover:border-purple-600 dark:hover:border-purple-400' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="font-medium mb-2 text-sm">
                                  {version.releaseDate || 'Date Unknown'}
                                </div>
                                
                                <div className="text-metadata space-y-1">
                                  {formats.length > 0 && (
                                    <div>
                                      <span className="font-medium text-xs uppercase tracking-wide opacity-60">Format:</span>
                                      <span className="ml-2">
                                        {formats.map((f: any) => f.format).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  {labels.length > 0 && (
                                    <div>
                                      <span className="font-medium text-xs uppercase tracking-wide opacity-60">Label:</span>
                                      <span className="ml-2">
                                        {labels.map((l: any) => l.name).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {version.notes && (
                                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 italic">
                                    {version.notes}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-neutral-400 text-sm">→</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-metadata text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-700">
                No versions archived yet
              </div>
            )}
          </section>

          {/* Trust Signal Footer */}
          <footer className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-metadata space-y-2">
              <p className="font-medium">About this archive:</p>
              <p>
                Data sourced from <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600">MusicBrainz</a> and <a href="https://discogs.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600">Discogs</a>. 
                Marketplace listings are from third-party sellers.
              </p>
              <p className="text-xs opacity-60">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </footer>
        </div>
      </div>
      
      <ReadingModeToggle />
    </>
  );
}
