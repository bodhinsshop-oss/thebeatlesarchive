import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const works = await prisma.work.findMany({
      where: {
        title: {
          contains: query,
        },
      },
      include: {
        artist: {
          select: {
            slug: true,
          },
        },
      },
      take: 20,
      orderBy: {
        firstReleaseDate: 'asc',
      },
    });

    // Get version counts separately
    const versionCounts = await Promise.all(
      works.map(work => 
        prisma.version.count({
          where: { workId: work.id }
        })
      )
    );

    const results = works.map((work, idx) => ({
      id: work.id,
      title: work.title,
      type: work.type,
      year: work.firstReleaseDate?.split('-')[0] || 'Unknown',
      imageUrl: work.primaryImageUrl,
      artistSlug: work.artist.slug,
      versions: versionCounts[idx],
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
