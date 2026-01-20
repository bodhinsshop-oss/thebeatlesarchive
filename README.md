# The Beatles Archive

A comprehensive, public-facing archive of The Beatles' musical legacy. This Next.js application automatically discovers and catalogs all Beatles albums from authoritative music databases, providing a clean, archival interface for exploring their discography.

**Website**: [thebeatlesarchive.com](https://thebeatlesarchive.com)

**Created by**: Bodhin Industries

## Features

- 🎵 **Automatic Discovery**: Fetches all Beatles release-groups from MusicBrainz API
- � **Solo Careers**: Individual pages for John Lennon, Paul McCartney, George Harrison, and Ringo Starr
- �🖼️ **Album Artwork**: High-quality cover images from Cover Art Archive
- 🔍 **Search & Filter**: Search by title, filter by type (Album/EP/Live/etc.)
- 📊 **Detailed Pages**: Individual album pages with tracklists and editions
- 📱 **Responsive Design**: Mobile-first, accessible interface
- 🌐 **SEO Optimized**: Sitemap, robots.txt, and metadata for all pages
- 🎨 **Archival Design**: Minimal black/white/gray aesthetic

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite (dev) / PostgreSQL (prod)
- **Data Sources**: 
  - [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)
  - [Cover Art Archive](https://coverartarchive.org/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/thebeatlesarchive.git
   cd thebeatlesarchive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Sync album data**
   
   Sync The Beatles albums (default):
   ```bash
   npm run sync
   ```
   
   Or sync a specific solo artist:
   ```bash
   npm run sync -- --artist=john-lennon
   npm run sync -- --artist=paul-mccartney
   npm run sync -- --artist=george-harrison
   npm run sync -- --artist=ringo-starr
   ```
   
   Or sync all artists at once:
   ```bash
   npm run sync -- --all
   ```
   
   This will fetch all Beatles albums from MusicBrainz and populate your database. The sync process:
   - Queries MusicBrainz for all Beatles release-groups
   - Filters by type (Album, EP, Compilation, Live, Soundtrack)
   - Deduplicates by release-group ID
   - Fetches cover art from Cover Art Archive
   - Downloads tracklists and release editions
   - Can take 10-15 minutes due to API rate limi (Artist, Album, Track, Release)
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── album/[mbid]/      # Beatles album pages
│   │   ├── solo/
│   │   │   └── [slug]/        # Solo artist pages
│   │   │       └── album/[mbid]/  # Solo album pages
│   │   ├── about/             # About page
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout with header/footer
│   │   ├── page.tsx           # Homepage (Beatles + solo links)
│   │   ├── sitemap.ts         # Dynamic sitemap generation
│   │   └── robots.ts          # Robots.txt generation
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── musicbrainz.ts     # MusicBrainz API client
│   │   ├── coverart.ts        # Cover Art Archive client
│   │   └── artists.ts         # Artist configuration (Beatles + solo)
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── album/[mbid]/      # Individual album pages
│   │   ├── about/             # About page
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout with header/footer
│   │   ├── page.tsx           # Homepage (album grid)
│   │   ├── sitemap.ts         # Dynamic sitemap generation
│   │   └── robots.ts          # Robots.txt generation
│   ├── lib/Beatles albums (default)
- `npm run sync -- --artist=<slug>` - Sync specific solo artist
- `npm run sync -- --all` - Sync all artists (Beatles + all solo)
│   │   ├── prisma.ts          # Prisma client
│   │   ├── musicbrainz.ts     # MusicBrainz API client
│   │   └── coverart.ts        # Cover Art Archive client
│   └── scripts/
│       └── sync-albums.ts     # Data sync script
├── .github/
│   └── copilot-instructions.md
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run sync` - Sync album data from MusicBrainz
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## DThe Beatles** (MBID: `b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d`)
- **John Lennon** (MBID: `4d5447d7-c61c-4120-ba1b-d7f471d385b9`)
- **Paul McCartney** (MBID: `ba550d0e-adac-4864-b88b-407cab5e76af`)
- **George Harrison** (MBID: `42a8f507-8412-4611-854f-926571049fa0`)
- **Ringo Starr** (MBID: `300c4c73-33ac-4255-9d57-4e32627f5e13`)

For each artist we fetch:

### MusicBrainz

MusicBrainz is an open music encyclopedia that provides comprehensive music metadata. We query:

- **Artist**: The Beatles (MBID: `b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d`)
- **Release Groups**: Albums, EPs, Compilations, Live albums, Soundtracks
- **Releases**: Different editions (US/UK/remasters)
- **Recordings**: Track information

**Important**: The sync script respects MusicBrainz's rate limit of 1 request per second.

### Crtist
- `id` - Unique identifier
- `name` - Artist name (The Beatles, John Lennon, etc.)
- `slug` - URL-friendly slug (the-beatles, john-lennon, etc.)
- `musicbrainzArtistId` - MusicBrainz artist ID
- `type` - 'group' or 'solo'

### Album
- `mbid` - MusicBrainz release-group ID (unique)
- `title` - Album title
- `artistId` - Foreign key to Artistages linked to MusicBrainz release groups. Images are served via their CDN and cached by Next.js Image optimization.

## Database Schema

### Album
- `mbid` - MusicBrainz release-group ID (unique)
- `title` - Album title
- `artistCredit` - Artist name(s)
- `firstReleaseDate` - Initial release date
- `primaryType` - Album/EP/etc.
- `secondaryTypes` - Compilation/Live/etc. (JSON array)
- `coverArtUrl` - Front cover URL
- `backCoverArtUrl` - Back cover URL

### Track
- `albumId` - Foreign key to Album
- `position` - Track number
- `title` - Track title
- `length` - Duration in milliseconds

### Release
- `albumId` - Foreign key to Album
- `mbid` - MusicBrainz release ID
- `title` - Release title
- `date` - Release date
- `country` - Release country
- `format` - CD/Vinyl/etc.

## Deployment

### Environment Variables

For production, set:

```env
DATABASE_URL="your-postgres-connection-string"
```

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy
5. After first deploy, run sync:
   ```bash
   npm run sync
   ```
   Or set up a cron job to run it periodically

### Database Migration (Production)

When deploying to production with PostgreSQL:

1. Update `.env` with production DATABASE_URL
2. Run migration:
   ```bash
   npx prisma migrate deploy
   ```

## API Rate Limiting

The MusicBrainz API requires:
- Rate limit: 1 request per second
- User-Agent header with contact info

Our implementation includes automatic rate limiting and proper headers.

## SEO Features

- Dynamic sitemap generation
- Robots.txt configuration
- Per-page metadata and OpenGraph tags
- Semantic HTML structure
- Alt text for all images

## Accessibility

- Keyboard navigation support
- Proper heading hierarchy
- ARIA labels where needed
- High contrast text
- Focus indicators

## Credits

**Data Sources**:
- [MusicBrainz](https://musicbrainz.org) - Music metadata
- [Cover Art Archive](https://coverartarchive.org) - Album artwork

**Created by**: Bodhin Industries

## License

ISC License

---

**The Beatles Archive is a Bodhin Industries creation**
