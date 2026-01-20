import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  params: Promise<{ slug: string; workId: string }>;
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

export default async function SoloWorkPage({ params }: Props) {
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

  // Check if Two Virgins for content filtering
  const isTwoVirgins = (title: string) => 
    title.toLowerCase().includes('two virgins') || title.toLowerCase().includes('unfinished music');

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          {' / '}
          <Link href={`/solo/${work.artist.slug}`} className="hover:underline">
            {work.artist.name}
          </Link>
          {' / '}
          <span className="text-gray-600">{work.title}</span>
        </div>

        {/* Work Header */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          <div className="relative">
            {work.primaryImageUrl ? (
              <>
                <Image
                  src={work.primaryImageUrl}
                  alt={work.title}
                  width={300}
                  height={300}
                  className="w-full border border-gray-300"
                />
                {isTwoVirgins(work.title) && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-2">🚫</div>
                      <div className="font-bold">CENSORED</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-square bg-gray-100 border border-gray-300 flex items-center justify-center">
                <span className="text-gray-400">No Cover Art</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-2">{work.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{work.artist.name}</p>
            <div className="flex gap-4 text-sm mb-6">
              <span className="px-3 py-1 bg-black text-white">{work.type}</span>
              <span className="px-3 py-1 border border-black">{year}</span>
              <span className="px-3 py-1 border border-black">{work.versions.length} versions</span>
            </div>

            {/* External Links */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-bold">External Links:</p>
              <a
                href={`https://musicbrainz.org/release-group/${work.mbReleaseGroupId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm hover:underline mr-4"
              >
                View on MusicBrainz →
              </a>
              {work.discogsMainId && (
                <>
                  <a
                    href={`https://www.discogs.com/master/${work.discogsMainId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm hover:underline mr-4"
                  >
                    View on Discogs →
                  </a>
                  <a
                    href={`https://www.discogs.com/sell/list?master_id=${work.discogsMainId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-bold hover:underline"
                  >
                    Buy on Discogs Marketplace →
                  </a>
                </>
              )}
            </div>

            {isTwoVirgins(work.title) && (
              <div className="bg-red-100 border-2 border-red-500 p-4 text-sm">
                <p className="font-bold text-red-900 mb-1">⚠️ CONTENT WARNING</p>
                <p className="text-red-800">
                  This album contains explicit nudity. Cover art has been censored.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tracklist */}
        {tracklist && tracklist.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Tracklist</h2>
            <div className="border border-gray-300">
              {tracklist.map((track: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between px-4 py-2 border-b border-gray-200 last:border-b-0"
                >
                  <span>
                    <span className="text-gray-500 mr-3">{track.position}</span>
                    {track.title}
                  </span>
                  {track.length && (
                    <span className="text-gray-500">
                      {Math.floor(track.length / 60000)}:{String(Math.floor((track.length % 60000) / 1000)).padStart(2, '0')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Versions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            All Versions ({work.versions.length})
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Different pressings, editions, and releases of this work
          </p>

          <div className="space-y-4">
            {work.versions.map((version) => {
              const formats = version.formatJson ? JSON.parse(version.formatJson) : [];
              const labels = version.labelsJson ? JSON.parse(version.labelsJson) : [];

              return (
                <Link
                  key={version.id}
                  href={`/solo/${work.artist.slug}/${work.id}/version/${version.id}`}
                  className="block border border-gray-300 p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold mb-1">
                        {version.country || 'International'} · {version.releaseDate || 'Date Unknown'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formats.length > 0 && (
                          <span className="mr-4">
                            {formats.map((f: any) => f.format).join(', ')}
                          </span>
                        )}
                        {labels.length > 0 && (
                          <span>
                            {labels.map((l: any) => l.name).join(', ')}
                          </span>
                        )}
                      </div>
                      {version.notes && (
                        <div className="text-xs text-gray-500 mt-1">{version.notes}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-500">
          <p>
            External links to MusicBrainz and Discogs are provided for reference only. 
            Marketplace listings on Discogs are from third-party sellers and are not affiliated with this archive.
          </p>
        </div>
      </div>
    </div>
  );
}
