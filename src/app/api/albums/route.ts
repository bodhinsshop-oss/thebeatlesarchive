import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistSlug = searchParams.get('artist');

    const where = artistSlug
      ? {
          artist: {
            slug: artistSlug
          }
        }
      : {};

    const albums = await prisma.album.findMany({
      where,
      orderBy: {
        firstReleaseDate: 'asc'
      },
      select: {
        id: true,
        mbid: true,
        title: true,
        firstReleaseDate: true,
        primaryType: true,
        coverArtUrl: true,
        artist: {
          select: {
            slug: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}
