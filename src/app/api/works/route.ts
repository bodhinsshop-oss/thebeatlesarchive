import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artist = searchParams.get('artist');

  if (!artist) {
    return NextResponse.json({ error: 'Artist parameter required' }, { status: 400 });
  }

  try {
    const works = await prisma.work.findMany({
      where: {
        artist: {
          slug: artist
        }
      },
      include: {
        artist: {
          select: {
            slug: true,
            name: true,
          }
        },
        _count: {
          select: {
            versions: true
          }
        }
      },
      orderBy: {
        firstReleaseDate: 'asc'
      }
    });

    return NextResponse.json(works);
  } catch (error) {
    console.error('Error fetching works:', error);
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}
