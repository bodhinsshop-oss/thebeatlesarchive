# The Beatles Archive - Complete Technical Documentation

## Project Overview

**TheBeatlesArchive.com** is a comprehensive, collector-grade music archive website dedicated to The Beatles and their solo careers. It functions as a professional discography database that catalogs every release, pressing, and edition with marketplace integration.

### Core Concept

The site implements a **Work/Version architecture** (inspired by MusicBrainz):
- **Work** = A musical release group (e.g., "Abbey Road" as a concept)
- **Version** = Each individual pressing/edition (e.g., "Abbey Road - 1969 UK Stereo, Parlophone PMC 7088")

This allows collectors to:
1. Browse the complete catalog of works
2. Drill down into specific pressings with country, format, label, catalog numbers
3. Access Discogs marketplace links to purchase specific editions

---

## Technology Stack

### Framework & Core
- **Next.js 16.1.3** - React framework with App Router (not Pages Router)
- **TypeScript** - Full type safety throughout
- **Tailwind CSS v4** - Utility-first styling with @tailwindcss/postcss
- **Turbopack** - Fast development bundler (via `next dev --turbo`)

### Database & ORM
- **Prisma 5.22.0** - Type-safe ORM
- **SQLite** - Local database (file: `prisma/dev.db`)
- **CUID** - String-based IDs (NOT integers) via `@default(cuid())`

### External APIs
1. **MusicBrainz API**
   - Release group and release metadata
   - Rate limit: 1 request per second
   - User-Agent required: `TheBeatlesArchive/1.0.0`
   
2. **Cover Art Archive**
   - Album artwork from archive.org
   - Falls back between http/https protocols
   - Frequent timeouts require error handling

3. **Discogs API**
   - Release matching and marketplace URLs
   - Rate limit: 1 request per second
   - Token authentication in .env: `DISCOGS_TOKEN`

### Key Dependencies
```json
{
  "next": "^16.1.3",
  "react": "^19.0.0",
  "prisma": "^5.22.0",
  "@prisma/client": "^5.22.0",
  "tailwindcss": "^4.0.0",
  "tsx": "^4.19.2"
}
```

---

## Project Structure

```
thebeatlesarchive/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── dev.db                 # SQLite database file
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx          # Homepage (Beatles works grid)
│   │   ├── layout.tsx        # Root layout with navigation
│   │   ├── about/            # About page
│   │   ├── beatles/          # Beatles work & version pages
│   │   │   ├── [workId]/
│   │   │   │   ├── page.tsx  # Work detail page
│   │   │   │   └── version/[versionId]/page.tsx
│   │   ├── solo/             # Solo artist pages
│   │   │   └── [slug]/       # Artist landing page
│   │   │       └── [workId]/ # Solo work & version pages
│   │   ├── sync-status/      # Live sync progress dashboard
│   │   └── api/              # API routes
│   │       ├── works/        # Works API endpoint
│   │       └── sync-status/  # Sync stats API
│   ├── lib/                   # Utility libraries
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── musicbrainz.ts    # MusicBrainz API client
│   │   ├── coverart.ts       # Cover Art Archive client
│   │   └── discogs.ts        # Discogs API client
│   └── scripts/
│       └── sync-works.ts      # Data synchronization script
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Database Schema (Prisma)

### Complete Schema Definition

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Artist {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  mbid            String   @unique
  bio             String?
  imageUrl        String?
  works           Work[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Work {
  id                String    @id @default(cuid())
  mbReleaseGroupId  String    @unique
  discogsMainId     String?
  title             String
  type              String
  firstReleaseDate  String?
  artistId          String
  artist            Artist    @relation(fields: [artistId], references: [id])
  primaryImageUrl   String?
  tracklistJson     String?
  versions          Version[]
  lastSyncedAt      DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([artistId])
}

model Version {
  id                      String    @id @default(cuid())
  mbReleaseId             String    @unique
  workId                  String
  work                    Work      @relation(fields: [workId], references: [id])
  discogsReleaseId        String?
  discogsUrl              String?
  discogsMarketplaceUrl   String?
  country                 String?
  releaseDate             String?
  formatJson              String?
  labelsJson              String?
  identifiersJson         String?
  notes                   String?
  imageUrlsJson           String?
  lastSyncedAt            DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  @@index([workId])
}

model MappingAudit {
  id               String   @id @default(cuid())
  entityType       String
  mbid             String
  discogsId        String
  matchConfidence  Float?
  matchMethod      String?
  matchedAt        DateTime @default(now())

  @@index([mbid])
  @@index([discogsId])
}
```

### Schema Notes

**CRITICAL**: All IDs are CUID strings (e.g., `"cmkk87ah80002yg6t797x4r8v"`), NOT integers. Never use `parseInt()` on IDs.

**JSON Fields**: Several fields store JSON as strings:
- `tracklistJson` - Array of track objects: `[{position: 1, title: "Come Together", length: 259000}]`
- `formatJson` - Array of format objects: `[{format: "Vinyl", trackCount: 17}]`
- `labelsJson` - Array of label objects: `[{name: "Apple Records", catalogNumber: "PCS 7088"}]`
- `identifiersJson` - Object with barcodes/IDs: `{barcode: "5099969945618"}`
- `imageUrlsJson` - Array of image URLs

---

## Core Features

### 1. Homepage (/)

**Purpose**: Display all Beatles works in a searchable, filterable grid

**Key Features**:
- Grid of album covers with work titles
- Search by title
- Filter by type (Album, EP, Single, Live, Soundtrack, Compilation)
- Sort by date or title
- Shows version count per work
- Links to individual work pages

**Implementation**:
```typescript
// Fetches from /api/works?artist=the-beatles
interface Work {
  id: string;  // CUID string
  title: string;
  type: string;
  firstReleaseDate: string | null;
  primaryImageUrl: string | null;
  _count: {
    versions: number;
  };
}
```

**Styling**: Black text on white background, minimal archival aesthetic, responsive grid

### 2. Solo Artist Pages (/solo/[slug])

**Artists**:
- John Lennon (`/solo/john-lennon`)
- Paul McCartney (`/solo/paul-mccartney`)
- George Harrison (`/solo/george-harrison`)
- Ringo Starr (`/solo/ringo-starr`)

**Features**:
- Dropdown navigation in header to switch between artists
- Same grid/filter/search functionality as homepage
- Fetches from `/api/works?artist={slug}`
- Special content moderation for John Lennon's "Two Virgins" albums

### 3. Work Detail Pages

**Beatles**: `/beatles/[workId]`  
**Solo**: `/solo/[slug]/[workId]`

**Displays**:
- Large album cover
- Work title and year
- Work type (Album/Single/etc)
- Complete tracklist (parsed from `tracklistJson`)
- External links:
  - MusicBrainz release-group link
  - Discogs master link (if matched)
  - Discogs marketplace "Buy" button
- List of all versions with filters (country, format, year)

**Version List Features**:
- Filter by country (dropdown)
- Filter by format (Vinyl, CD, Cassette, etc)
- Filter by decade (1960s, 1970s, etc)
- Clickable rows navigate to version detail pages

### 4. Version Detail Pages

**Beatles**: `/beatles/[workId]/version/[versionId]`  
**Solo**: `/solo/[slug]/[workId]/version/[versionId]`

**Displays**:
- Multiple cover images (if available)
- Country and release date
- Format details (e.g., "2×Vinyl, LP, Album, Stereo")
- Record labels with catalog numbers
- Barcodes and identifiers
- Pressing notes/disambiguation
- Prominent "🛒 BUY ON DISCOGS MARKETPLACE" button
- MusicBrainz release link

### 5. Content Moderation (Two Virgins)

**Requirement**: John Lennon's "Unfinished Music No. 1: Two Virgins" features nudity on the cover and must be censored.

**Implementation**:

**On Work Pages**:
- Detect if title includes "Two Virgins"
- Apply blackout overlay: `<div className="absolute inset-0 bg-black opacity-95" />`
- Show warning text over cover

**On Version Pages**:
- Show extreme warning modal on page load
- Modal requires explicit "I Understand" button click
- After dismissal, show censored versions with continued warnings

**Code Pattern**:
```typescript
const isTwoVirgins = work.title.toLowerCase().includes('two virgins');

{isTwoVirgins && (
  <div className="absolute inset-0 bg-black opacity-95 flex items-center justify-center">
    <p className="text-white text-sm font-bold">CENSORED</p>
  </div>
)}
```

### 6. Sync Status Dashboard (/sync-status)

**Purpose**: Live monitoring of data synchronization progress

**Features**:
- Auto-refreshes every 3 seconds
- Total works / expected (~1,640)
- Total versions count
- Discogs mappings count
- Progress bar (overall percentage)
- Per-artist breakdown with individual progress bars
- **Real-time sync rate** (works per minute)
- **Estimated time remaining (ETA)**
- Last updated timestamp

**API Endpoint**: `/api/sync-status`

**Response Format**:
```json
{
  "totalWorks": 138,
  "totalVersions": 622,
  "totalMappings": 237,
  "artistStats": [
    {
      "name": "The Beatles",
      "slug": "the-beatles",
      "works": 60,
      "versions": 424
    }
  ],
  "lastUpdated": "2026-01-19T02:41:41.093Z"
}
```

**ETA Calculation**:
- Tracks `previousWorks` count and `lastCheckTime`
- Calculates `worksPerMinute` on each refresh
- Projects remaining time: `(1640 - totalWorks) / worksPerMinute`
- Displays as "Xh Ym" or "X minutes"

### 7. About Page (/about)

**Sections**:
1. **Project Overview** - Mission statement
2. **Data Sources**:
   - MusicBrainz (metadata)
   - Cover Art Archive (artwork)
   - Discogs (marketplace/pressings)
3. **Work vs Version Architecture** - Explanation of collector model
4. **Coverage** - What's included (albums, singles, EPs, live, compilations, broadcasts)
5. **External Links Policy** - Disclaimer about Discogs affiliation
6. **Updates** - Sync frequency info
7. **Contact/Feedback** - Placeholder for future contact form

---

## API Clients

### MusicBrainz Client (`src/lib/musicbrainz.ts`)

**Purpose**: Fetch release groups (works) and releases (versions) from MusicBrainz

**Key Methods**:
```typescript
class MusicBrainzClient {
  // Get all release groups for an artist (paginated)
  async getArtistReleaseGroups(artistMbid: string): Promise<ReleaseGroup[]>
  
  // Get details of a specific release group
  async getReleaseGroupDetails(releaseGroupId: string): Promise<ReleaseGroupDetails>
  
  // Get detailed release information
  async getRelease(releaseId: string): Promise<ReleaseDetails>
}
```

**Rate Limiting**: 1 request per second, implemented via async delay

**Retry Logic**: 3 attempts with exponential backoff (2s, 4s, 6s)

**User-Agent**: `TheBeatlesArchive/1.0.0 (contact info)` - REQUIRED by MusicBrainz

### Cover Art Archive Client (`src/lib/coverart.ts`)

**Purpose**: Fetch album artwork from archive.org

**Key Methods**:
```typescript
class CoverArtClient {
  // Get cover art for a release group
  async getReleaseGroupArt(releaseGroupId: string): Promise<CoverArtResponse>
  
  // Get cover art for a specific release
  async getReleaseArt(releaseId: string): Promise<CoverArtResponse>
}
```

**Protocol Fallback**: Tries HTTPS first, falls back to HTTP if fails

**Error Handling**: Returns null on failure (artwork is optional)

**Timeout Issues**: Frequently times out, all callers must wrap in try-catch

### Discogs Client (`src/lib/discogs.ts`)

**Purpose**: Search Discogs database and generate marketplace URLs

**Authentication**: Token-based (in .env)

**Key Methods**:
```typescript
class DiscogsClient {
  // Search for releases (masters or regular releases)
  async searchReleases(query: string): Promise<DiscogsSearchResult[]>
  
  // Get master release details
  async getMaster(masterId: string): Promise<DiscogsMaster>
  
  // Get specific release details
  async getRelease(releaseId: string): Promise<DiscogsRelease>
  
  // Generate marketplace URL
  getMarketplaceUrl(releaseId: string): string
  
  // Generate master URL
  getMasterUrl(masterId: string): string
}
```

**Rate Limiting**: 1 request per second, respects `Retry-After` headers

**Search Strategy**:
- Combine artist + title into single query: `"The Beatles Abbey Road"`
- Prefer `type: 'master'` results
- Match title to ensure relevance
- Store confidence scores in MappingAudit table

---

## Data Synchronization System

### Sync Script (`src/scripts/sync-works.ts`)

**Purpose**: Populate database from MusicBrainz and match to Discogs

**CLI Usage**:
```bash
npm run sync:works -- --artist=the-beatles
npm run sync:works -- --artist=john-lennon
npm run sync:works -- --all
```

**Process Flow**:

1. **Fetch Release Groups** (Works)
   - Paginated requests to MusicBrainz (100 per page)
   - Filter by allowed types (Album, EP, Single, Live, Soundtrack, Compilation, Broadcast)
   - Skip bootlegs and invalid types

2. **For Each Release Group**:
   - Fetch cover art (with error handling)
   - Search Discogs for master match
     - Combine artist + title in query
     - Filter for masters with matching titles
     - Calculate confidence score (1.0 = exact match, 0.7 = partial)
   - Store mapping audit record
   - Fetch first release for tracklist
   - Create/update Work in database

3. **Fetch Releases** (Versions)
   - Get up to 20 releases per work (ordered by date)
   - For each release:
     - Fetch detailed release info from MusicBrainz
     - Extract format, labels, catalog numbers, barcodes
     - Check for Discogs URL in MusicBrainz relations
     - Fetch release cover art (multiple images)
     - Create/update Version in database

4. **Error Handling**:
   - Cover Art timeouts → continue without images
   - Discogs failures → work stored without Discogs links
   - Database errors → skip to next item
   - Rate limit errors → wait and retry

### Allowed Release Types

**Primary Types**:
- Album
- EP
- Single
- Live
- Soundtrack
- Compilation
- Broadcast

**Secondary Types** (also allowed):
- Audiobook
- Audio drama
- Demo
- DJ-mix
- Interview
- Mixtape/Street
- Remix
- Spokenword

### Sync Performance

**Rate Limits**:
- MusicBrainz: 1 req/sec
- Discogs: 1 req/sec (with 60s cooldowns on rate limit hits)
- Cover Art Archive: No limit but frequent timeouts

**Expected Speed**:
- ~1-2 works per minute (including versions)
- Full Beatles catalog (1003 works) = **8-16 hours**
- All artists (1640 works) = **12-24 hours**

**Optimization Strategy**:
- Sync runs in background (non-blocking)
- Uses existing work/version records (updates, not recreates)
- Skips versions if work already has 20+
- Error handling allows continuation despite failures

---

## Styling & Design System

### Tailwind Configuration

**Version**: Tailwind CSS v4 (using @tailwindcss/postcss)

**Color Palette**:
- Black (#000000) - Primary text, borders, navigation
- White (#FFFFFF) - Backgrounds
- Gray scale - Secondary text, hover states
- No brand colors - intentionally austere archival aesthetic

### Design Principles

1. **Minimal Archival Aesthetic**
   - Clean, newspaper-like layout
   - High contrast black on white
   - No gradients, shadows, or decorative elements
   - Focus on typography and content hierarchy

2. **Typography**:
   - System font stack (native sans-serif)
   - Font sizes: 3xl for headers, base for body, sm for metadata
   - Font weights: Bold for titles/CTA, normal for body

3. **Layout**:
   - Max-width containers (max-w-7xl, max-w-4xl)
   - Responsive grid: 2-6 columns based on screen size
   - Consistent spacing (py-12, px-4, gap-6)
   - Border thickness: 2px for emphasis, 1px for dividers

4. **Interactive Elements**:
   - Hover states: Bold text or light gray background
   - No rounded corners (sharp, archival feel)
   - Thick borders on buttons and cards
   - Explicit call-to-action buttons (e.g., "🛒 BUY ON DISCOGS MARKETPLACE")

### Component Patterns

**Album Grid Card**:
```tsx
<div className="border-2 border-black bg-white hover:bg-gray-50 transition-colors cursor-pointer">
  <Image src={cover} alt={title} className="w-full aspect-square object-cover" />
  <div className="p-4">
    <h2 className="font-bold text-lg mb-1">{title}</h2>
    <p className="text-sm text-gray-600">{year}</p>
    <p className="text-xs text-gray-500">{versionCount} versions</p>
  </div>
</div>
```

**Filter Controls**:
```tsx
<div className="flex flex-wrap gap-4 items-center">
  <input 
    type="text" 
    placeholder="Search..."
    className="border-2 border-black px-4 py-2 flex-grow"
  />
  <select className="border-2 border-black px-4 py-2">
    <option>All Types</option>
    <option>Album</option>
    <option>Single</option>
  </select>
</div>
```

**Call-to-Action Button**:
```tsx
<a 
  href={marketplaceUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block bg-black text-white px-8 py-4 text-lg font-bold hover:bg-gray-800"
>
  🛒 BUY ON DISCOGS MARKETPLACE
</a>
```

---

## Navigation Structure

### Header Component

**Layout**: Logo left, navigation center, solo artist dropdown right

**Navigation Links**:
- Home (/)
- About (/about)
- Sync Status (/sync-status)

**Solo Artists Dropdown**:
```tsx
<select onChange={(e) => router.push(e.target.value)}>
  <option value="">Solo Careers</option>
  <option value="/solo/john-lennon">John Lennon</option>
  <option value="/solo/paul-mccartney">Paul McCartney</option>
  <option value="/solo/george-harrison">George Harrison</option>
  <option value="/solo/ringo-starr">Ringo Starr</option>
</select>
```

**Styling**: Black background, white text, border-bottom

### Breadcrumbs

**Pattern**: Home > Artist > Work > Version

**Implementation**:
```tsx
<nav className="text-sm mb-6">
  <a href="/" className="hover:underline">Home</a>
  {' > '}
  <a href="/solo/john-lennon" className="hover:underline">John Lennon</a>
  {' > '}
  <span className="font-bold">{work.title}</span>
</nav>
```

---

## Environment Configuration

### .env File

```env
DATABASE_URL="file:./dev.db"
DISCOGS_TOKEN="your_discogs_token_here"
```

### Obtaining Discogs Token

1. Create Discogs account
2. Go to Settings > Developers
3. Generate new token
4. Copy to .env file

---

## Development Workflow

### Setup Commands

```bash
# Install dependencies
npm install

# Initialize database
npx prisma generate
npx prisma db push

# Seed artists (required before sync)
npx tsx prisma/seed.ts

# Start development server
npm run dev

# Run sync (in separate terminal)
npm run sync:works -- --all
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# View current schema
npx prisma format
```

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Critical Implementation Details

### ID Handling

**NEVER use `parseInt()` on IDs** - they are CUID strings:
```typescript
// ❌ WRONG
const workId = parseInt(params.workId);

// ✅ CORRECT
const workId = params.workId;
```

### JSON Parsing

All JSON fields must be parsed before use:
```typescript
const tracklist = work.tracklistJson 
  ? JSON.parse(work.tracklistJson) 
  : [];

const formats = version.formatJson 
  ? JSON.parse(version.formatJson) 
  : [];
```

### Image Handling

Use Next.js Image component with external domains:
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['coverartarchive.org', 'archive.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coverartarchive.org',
      },
      {
        protocol: 'http',
        hostname: 'coverartarchive.org',
      },
    ],
  },
};
```

### API Route Pattern

All API routes return JSON with proper error handling:
```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artist = searchParams.get('artist');
    
    const works = await prisma.work.findMany({
      where: { artist: { slug: artist } },
      include: { _count: { select: { versions: true } } },
      orderBy: { firstReleaseDate: 'asc' },
    });
    
    return Response.json(works);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}
```

### Client vs Server Components

**Server Components** (default):
- All pages without 'use client'
- Direct database access via Prisma
- No useState, useEffect, or browser APIs

**Client Components**:
- Marked with `'use client'` at top
- Used for interactivity (search, filters, dropdowns)
- Fetch data from API routes, not direct Prisma

---

## SEO & Metadata

### robots.txt
```
User-agent: *
Allow: /
Sitemap: http://localhost:3000/sitemap.xml
```

### sitemap.xml (Dynamic)

Generated from database, includes:
- Homepage
- All work pages (/beatles/[id])
- All version pages (/beatles/[id]/version/[versionId])
- Solo artist pages
- Static pages (about, etc)

### Page Metadata

```typescript
export const metadata = {
  title: 'Work Title | The Beatles Archive',
  description: 'View all editions and pressings...',
};
```

---

## Testing Strategy

### Manual Testing Checklist

1. **Homepage**:
   - ✓ Grid displays works
   - ✓ Search filters results
   - ✓ Type filter works
   - ✓ Sort by date/title
   - ✓ Click navigates to work page

2. **Work Pages**:
   - ✓ Cover image displays
   - ✓ Tracklist renders
   - ✓ External links work
   - ✓ Version list displays
   - ✓ Filters function
   - ✓ Click row navigates to version

3. **Version Pages**:
   - ✓ Pressing details display
   - ✓ Marketplace button links to Discogs
   - ✓ Multiple images render

4. **Content Moderation**:
   - ✓ Two Virgins albums are censored
   - ✓ Warning modal appears
   - ✓ Overlay covers image

5. **Sync Status**:
   - ✓ Stats update every 3 seconds
   - ✓ ETA calculates correctly
   - ✓ Progress bars animate

### Database Verification

```bash
# Check work counts
npx tsx check-quick.ts

# Verify Discogs mappings
npx tsx check-discogs-urls.ts
```

---

## Deployment Considerations

### Vercel Deployment

1. Connect GitHub repo
2. Set environment variables in dashboard
3. Database considerations:
   - SQLite works for small scale
   - Consider PostgreSQL for production
   - Update Prisma schema datasource

### Database Migration for Production

Change `prisma/schema.prisma`:
```prisma
// Development (SQLite)
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// Production (PostgreSQL)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Performance Optimization

1. **Image Optimization**: Already handled by Next.js Image
2. **Database Indexing**: Already defined in schema (@index)
3. **API Caching**: Add revalidation to API routes
4. **Static Generation**: Pre-render popular work pages

---

## Troubleshooting

### Sync Keeps Crashing

**Issue**: Sync stops after processing a few works

**Causes**:
- Cover Art Archive timeouts
- Database locking
- Rate limit exceeded

**Solutions**:
- All Cover Art fetches wrapped in try-catch
- Add database error handling to all Prisma calls
- Respect rate limits (1 req/sec with delays)
- Consider simplified sync that creates works without versions first

### Pages Show "Invalid ID" Error

**Issue**: Pages crash with Prisma errors

**Cause**: Using `parseInt()` on CUID strings

**Solution**: Remove all `parseInt()` calls on IDs

### Discogs Links All Point to Same Album

**Issue**: All works map to Discogs ID 79241 (White Album)

**Cause**: Search query only includes artist, not title

**Solution**: Combine artist + title in search:
```typescript
const searchQuery = `${artistName} ${workTitle}`;
const results = await discogsClient.searchReleases(searchQuery);
```

### Images Not Loading

**Issue**: Next.js blocks external images

**Solution**: Add domains to `next.config.js`:
```javascript
images: {
  domains: ['coverartarchive.org', 'archive.org'],
}
```

---

## API Reference

### GET /api/works

**Query Parameters**:
- `artist` (required): Artist slug (e.g., "the-beatles")

**Response**:
```json
[
  {
    "id": "cmkk87ah80002yg6t797x4r8v",
    "title": "Abbey Road",
    "type": "Album",
    "firstReleaseDate": "1969-09-26",
    "primaryImageUrl": "https://...",
    "_count": {
      "versions": 150
    }
  }
]
```

### GET /api/sync-status

**Response**:
```json
{
  "totalWorks": 138,
  "totalVersions": 622,
  "totalMappings": 237,
  "artistStats": [
    {
      "name": "The Beatles",
      "slug": "the-beatles",
      "works": 60,
      "versions": 424
    }
  ],
  "lastUpdated": "2026-01-19T02:41:41.093Z"
}
```

---

## Complete Feature List

### ✅ Implemented

1. Homepage with Beatles works grid
2. Search and filter functionality
3. Solo artist landing pages (4 artists)
4. Solo artist dropdown navigation
5. Work detail pages (Beatles + solo)
6. Version detail pages (Beatles + solo)
7. Tracklist display
8. Multiple cover images per version
9. Discogs marketplace integration
10. MusicBrainz linking
11. Content moderation (Two Virgins)
12. Sync status dashboard
13. Real-time sync rate calculation
14. ETA display
15. Progress bars (overall + per-artist)
16. About page with documentation
17. API endpoints (/api/works, /api/sync-status)
18. Responsive design (mobile-friendly)
19. SEO (sitemap, robots.txt, metadata)
20. Database schema with Work/Version architecture

### 📋 Implementation Instructions for AI Coder

**Step 1: Initialize Project**
```bash
npx create-next-app@latest thebeatlesarchive --typescript --tailwind --app
cd thebeatlesarchive
npm install prisma @prisma/client
npm install --save-dev tsx
```

**Step 2: Setup Prisma**
- Copy exact schema from this document
- Run `npx prisma init`
- Update `prisma/schema.prisma` with provided schema
- Run `npx prisma generate`
- Run `npx prisma db push`

**Step 3: Create API Clients**
- Copy MusicBrainz client code (with rate limiting)
- Copy Cover Art Archive client (with protocol fallback)
- Copy Discogs client (with token auth)
- Add prisma.ts singleton client

**Step 4: Seed Database**
- Create 5 Artist records (Beatles + 4 solo)
- Use exact MBIDs from this document

**Step 5: Create Page Structure**
- Follow exact file structure from "Project Structure" section
- Use Server Components by default
- Add 'use client' only for interactive components

**Step 6: Implement Sync Script**
- Follow sync process flow from documentation
- Add all error handling as specified
- Include rate limiting (1 req/sec)
- Wrap Cover Art fetches in try-catch

**Step 7: Build UI Components**
- Use exact styling patterns from "Styling & Design System"
- Implement black/white minimal aesthetic
- Add all filters and search functionality
- Include breadcrumbs on detail pages

**Step 8: Content Moderation**
- Detect "Two Virgins" in titles (case-insensitive)
- Apply blackout overlays on work pages
- Show warning modal on version pages

**Step 9: Sync Status Page**
- Auto-refresh every 3 seconds
- Calculate works per minute
- Display ETA based on progress rate
- Show per-artist progress bars

**Step 10: Testing**
- Verify all pages load
- Test search/filter on homepage
- Confirm Discogs links work
- Check Two Virgins censoring
- Monitor sync progress

---

## Final Notes

This is a **production-ready, collector-grade music archive** with:
- Professional database architecture
- Comprehensive error handling
- Rate-limited API integration
- Content moderation
- Real-time sync monitoring
- Marketplace integration

The site is designed to scale to thousands of works and tens of thousands of versions while maintaining performance and providing a clean, archival user experience.

**Total Implementation Time**: ~40-60 hours for experienced developer

**Complexity Level**: Intermediate to Advanced

**Key Challenges**:
1. API rate limiting and error handling
2. Work/Version data model understanding
3. JSON field parsing throughout
4. CUID vs integer ID handling
5. Sync script reliability with multiple failure points

**Success Metrics**:
- All 1,640 expected works synced
- Discogs marketplace links functional
- Search/filter responsive on all pages
- Two Virgins content properly moderated
- Mobile-responsive design working

---

END OF DOCUMENTATION
