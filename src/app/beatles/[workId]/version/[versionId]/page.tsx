import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  params: Promise<{ workId: string; versionId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { versionId } = await params;
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    include: {
      work: {
        include: { artist: true }
      }
    }
  });

  if (!version) return { title: 'Version Not Found' };

  return {
    title: `${version.work.title} (${version.country} ${version.releaseDate}) - ${version.work.artist.name}`,
    description: `Details for ${version.country} release of ${version.work.title}`,
  };
}

export default async function VersionPage({ params }: Props) {
  const { versionId } = await params;
  
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    include: {
      work: {
        include: { artist: true }
      }
    }
  });

  if (!version) notFound();

  const formats = version.formatJson ? JSON.parse(version.formatJson) : [];
  const labels = version.labelsJson ? JSON.parse(version.labelsJson) : [];
  const identifiers = version.identifiersJson ? JSON.parse(version.identifiersJson) : null;
  const imageUrls = version.imageUrlsJson ? JSON.parse(version.imageUrlsJson) : [];
  const tracklist = version.work.tracklistJson ? JSON.parse(version.work.tracklistJson) : null;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          {' / '}
          <Link href={`/${version.work.artist.slug === 'the-beatles' ? '' : 'solo/' + version.work.artist.slug}`} className="hover:underline">
            {version.work.artist.name}
          </Link>
          {' / '}
          <Link
            href={`/${version.work.artist.slug === 'the-beatles' ? 'beatles' : 'solo/' + version.work.artist.slug}/${version.work.id}`}
            className="hover:underline"
          >
            {version.work.title}
          </Link>
          {' / '}
          <span className="text-gray-600">{version.country} {version.releaseDate}</span>
        </div>

        {/* Version Header */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          <div>
            {imageUrls.length > 0 ? (
              <Image
                src={imageUrls[0]}
                alt={`${version.work.title} - ${version.country}`}
                width={300}
                height={300}
                className="w-full border border-gray-300 mb-2"
              />
            ) : version.work.primaryImageUrl ? (
              <Image
                src={version.work.primaryImageUrl}
                alt={version.work.title}
                width={300}
                height={300}
                className="w-full border border-gray-300 mb-2"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 border border-gray-300 flex items-center justify-center mb-2">
                <span className="text-gray-400">No Cover Art</span>
              </div>
            )}
            
            {/* Additional Images */}
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.slice(1, 4).map((url: string, idx: number) => (
                  <Image
                    key={idx}
                    src={url}
                    alt={`Image ${idx + 2}`}
                    width={100}
                    height={100}
                    className="w-full border border-gray-300"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-2">{version.work.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{version.work.artist.name}</p>

            {/* Version Details */}
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-bold text-sm">Country:</span> {version.country || 'Unknown'}
              </div>
              <div>
                <span className="font-bold text-sm">Release Date:</span> {version.releaseDate || 'Unknown'}
              </div>
              {formats.length > 0 && (
                <div>
                  <span className="font-bold text-sm">Format:</span>{' '}
                  {formats.map((f: any) => `${f.format} (${f.trackCount} tracks)`).join(', ')}
                </div>
              )}
              {labels.length > 0 && (
                <div>
                  <span className="font-bold text-sm">Label:</span>{' '}
                  {labels.map((l: any) => 
                    l.catalogNumber ? `${l.name} (${l.catalogNumber})` : l.name
                  ).join(', ')}
                </div>
              )}
              {identifiers?.barcode && (
                <div>
                  <span className="font-bold text-sm">Barcode:</span> {identifiers.barcode}
                </div>
              )}
              {version.notes && (
                <div>
                  <span className="font-bold text-sm">Notes:</span> {version.notes}
                </div>
              )}
            </div>

            {/* External Links - PROMINENT */}
            <div className="border-2 border-black p-4 mb-6">
              <p className="font-bold mb-3">External Links:</p>
              <div className="space-y-2">
                <a
                  href={`https://musicbrainz.org/release/${version.mbReleaseId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm hover:underline"
                >
                  📖 View on MusicBrainz →
                </a>
                {version.discogsUrl && (
                  <>
                    <a
                      href={version.discogsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm hover:underline"
                    >
                      📀 View on Discogs →
                    </a>
                    <a
                      href={version.discogsMarketplaceUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-lg font-bold hover:underline"
                    >
                      🛒 BUY ON DISCOGS MARKETPLACE →
                    </a>
                  </>
                )}
              </div>
            </div>
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
