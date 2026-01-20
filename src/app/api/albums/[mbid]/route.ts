import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ mbid: string }> }
) {
  const { mbid } = await context.params;
  
  try {
    const album = await prisma.album.findUnique({
      where: { mbid },
      include: {
        artist: {
          select: {
            name: true,
            slug: true,
          }
        },
        tracks: {
          orderBy: {
            position: 'asc'
          }
        },
        releases: {
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}
