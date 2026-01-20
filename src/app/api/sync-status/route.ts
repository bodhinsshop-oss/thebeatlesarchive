import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalWorks = await prisma.work.count();
    const totalVersions = await prisma.version.count();
    const totalMappings = await prisma.mappingAudit.count();

    const worksByArtist = await prisma.work.groupBy({
      by: ['artistId'],
      _count: true,
    });

    const artistStats = await Promise.all(
      worksByArtist.map(async (group) => {
        const artist = await prisma.artist.findUnique({
          where: { id: group.artistId }
        });
        const versionCount = await prisma.version.count({
          where: {
            work: { artistId: group.artistId }
          }
        });
        return {
          name: artist?.name || 'Unknown',
          slug: artist?.slug || 'unknown',
          works: group._count,
          versions: versionCount,
        };
      })
    );

    return NextResponse.json({
      totalWorks,
      totalVersions,
      totalMappings,
      artistStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
