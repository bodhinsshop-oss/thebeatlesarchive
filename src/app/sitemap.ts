import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://thebeatlesarchive.com'

  // Get all albums
  const albums = await prisma.album.findMany({
    select: {
      mbid: true,
      updatedAt: true,
    },
  })

  const albumUrls = albums.map((album) => ({
    url: `${baseUrl}/album/${album.mbid}`,
    lastModified: album.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...albumUrls,
  ]
}
