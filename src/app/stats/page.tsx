import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
  title: 'Archive Statistics | The Beatles Archive',
  description: 'Complete statistics and insights into The Beatles Archive collection',
};

export default async function StatsPage() {
  // Get comprehensive statistics
  const [
    totalWorks,
    totalVersions,
    worksByType,
    worksByArtist,
    versionsByCountry,
    versionsByFormat,
    coverageStats,
  ] = await Promise.all([
    prisma.work.count(),
    prisma.version.count(),
    prisma.work.groupBy({
      by: ['type'],
      _count: true,
      orderBy: { _count: { type: 'desc' } },
    }),
    prisma.work.groupBy({
      by: ['artistId'],
      _count: true,
    }).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (r) => {
          const artist = await prisma.artist.findUnique({
            where: { id: r.artistId },
            select: { name: true },
          });
          return { name: artist?.name || 'Unknown', count: r._count };
        })
      );
      return withNames.sort((a, b) => b.count - a.count);
    }),
    prisma.version.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    }),
    prisma.$queryRaw<Array<{ format: string; count: bigint }>>`
      SELECT 
        json_extract(value, '$.format') as format,
        COUNT(*) as count
      FROM Version,
      json_each(Version.formatJson)
      WHERE json_extract(value, '$.format') IS NOT NULL
      GROUP BY format
      ORDER BY count DESC
      LIMIT 10
    `.then(results => results.map(r => ({ format: r.format, count: Number(r.count) }))),
    Promise.all([
      prisma.work.count({ where: { primaryImageUrl: { not: null } } }),
      prisma.work.count({ where: { discogsMainId: { not: null } } }),
      prisma.work.count({ where: { tracklistJson: { not: null } } }),
    ]).then(([withImages, withDiscogs, withTracklists]) => ({
      withImages,
      withDiscogs,
      withTracklists,
    })),
  ]);

  // Calculate total tracks from JSON tracklists
  const worksWithTracklists = await prisma.work.findMany({
    where: {
      tracklistJson: { not: null }
    },
    select: {
      tracklistJson: true
    }
  });

  const totalTracks = worksWithTracklists.reduce((sum, work) => {
    try {
      const tracklist = JSON.parse(work.tracklistJson || '[]');
      return sum + tracklist.length;
    } catch {
      return sum;
    }
  }, 0);

  // Calculate percentages
  const imagePercentage = ((coverageStats.withImages / totalWorks) * 100).toFixed(1);
  const discogsPercentage = ((coverageStats.withDiscogs / totalWorks) * 100).toFixed(1);
  const tracklistPercentage = ((coverageStats.withTracklists / totalWorks) * 100).toFixed(1);

  // Get era distribution
  const worksByEra = await prisma.$queryRaw<Array<{ decade: string; count: bigint }>>`
    SELECT 
      CAST(substr(firstReleaseDate, 1, 3) || '0s' AS TEXT) as decade,
      COUNT(*) as count
    FROM Work
    WHERE firstReleaseDate IS NOT NULL
    GROUP BY decade
    ORDER BY decade
  `.then(results => results.map(r => ({ decade: r.decade, count: Number(r.count) })));

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="editorial-container py-12">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-12 text-metadata">
          <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="opacity-60">Statistics</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-display mb-3">Archive Statistics</h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light">
            Complete insights into The Beatles Archive collection
          </p>
        </header>

        {/* Key Metrics */}
        <section className="section-spacing">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {totalWorks.toLocaleString()}
              </div>
              <div className="text-metadata">Total Works</div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {totalVersions.toLocaleString()}
              </div>
              <div className="text-metadata">Versions</div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {totalTracks.toLocaleString()}
              </div>
              <div className="text-metadata">Total Tracks</div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {((totalVersions / totalWorks) || 0).toFixed(1)}
              </div>
              <div className="text-metadata">Avg Versions/Work</div>
            </div>
          </div>
        </section>

        {/* Coverage Statistics */}
        <section className="section-spacing">
          <h2 className="mb-6">Data Coverage</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-metadata">Cover Art</span>
                <span className="font-medium">{imagePercentage}%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-400 transition-all"
                  style={{ width: `${imagePercentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-metadata">Discogs Links</span>
                <span className="font-medium">{discogsPercentage}%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-400 transition-all"
                  style={{ width: `${discogsPercentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-metadata">Tracklists</span>
                <span className="font-medium">{tracklistPercentage}%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-400 transition-all"
                  style={{ width: `${tracklistPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Works by Type */}
          <section>
            <h2 className="mb-6">By Type</h2>
            <div className="space-y-3">
              {worksByType.map((item) => (
                <div
                  key={item.type}
                  className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800"
                >
                  <span className="font-medium">{item.type}</span>
                  <span className="text-metadata">{item._count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Works by Artist */}
          <section>
            <h2 className="mb-6">By Artist</h2>
            <div className="space-y-3">
              {worksByArtist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-metadata">{item.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Versions by Country */}
          <section>
            <h2 className="mb-6">Top Countries</h2>
            <div className="space-y-3">
              {versionsByCountry.map((item) => (
                <div
                  key={item.country}
                  className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800"
                >
                  <span className="font-medium">{item.country || 'International'}</span>
                  <span className="text-metadata">{item._count} versions</span>
                </div>
              ))}
            </div>
          </section>

          {/* Versions by Format */}
          <section>
            <h2 className="mb-6">Top Formats</h2>
            <div className="space-y-3">
              {versionsByFormat.map((item) => (
                <div
                  key={item.format}
                  className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800"
                >
                  <span className="font-medium">{item.format}</span>
                  <span className="text-metadata">{item.count} releases</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Works by Era/Decade */}
        <section className="section-spacing">
          <h2 className="mb-6">By Decade</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {worksByEra.map((item) => (
              <div
                key={item.decade}
                className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg text-center"
              >
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {item.count}
                </div>
                <div className="text-metadata">{item.decade}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Last Updated */}
        <footer className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-metadata text-center">
          <p>Statistics updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </footer>
      </div>
    </div>
  );
}
