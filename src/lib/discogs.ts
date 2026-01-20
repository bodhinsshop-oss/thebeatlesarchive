// Discogs API client with proper rate limiting and caching

const DISCOGS_API_BASE = 'https://api.discogs.com';
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN || '';
const USER_AGENT = 'TheBeatlesArchive/1.0 +https://thebeatlesarchive.com';

interface DiscogsSearchResult {
  id: number;
  type: 'master' | 'release';
  title: string;
  year?: string;
  format?: string[];
  country?: string;
  label?: string[];
  catno?: string;
  thumb?: string;
}

interface DiscogsRelease {
  id: number;
  title: string;
  artists: Array<{ name: string; id: number }>;
  year?: number;
  released?: string;
  country?: string;
  formats?: Array<{
    name: string;
    qty: string;
    descriptions?: string[];
  }>;
  labels?: Array<{
    name: string;
    catno: string;
  }>;
  identifiers?: Array<{
    type: string;
    value: string;
  }>;
  tracklist?: Array<{
    position: string;
    title: string;
    duration: string;
  }>;
  notes?: string;
  images?: Array<{
    type: string;
    uri: string;
    uri150: string;
  }>;
  uri: string;
}

interface DiscogsMaster {
  id: number;
  title: string;
  year?: number;
  artists: Array<{ name: string; id: number }>;
  genres?: string[];
  styles?: string[];
  tracklist?: Array<{
    position: string;
    title: string;
    duration: string;
  }>;
  images?: Array<{
    type: string;
    uri: string;
    uri150: string;
  }>;
  uri: string;
  main_release?: number;
}

class DiscogsClient {
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 request per second

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async request<T>(endpoint: string, retries = 3): Promise<T> {
    await this.rateLimit();

    const url = `${DISCOGS_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
    };

    if (DISCOGS_TOKEN) {
      headers['Authorization'] = `Discogs token=${DISCOGS_TOKEN}`;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { headers });

        if (response.status === 429) {
          // Rate limited
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          console.log(`Rate limited by Discogs, waiting ${retryAfter}s...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Discogs API error: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  async searchReleases(query: string, type?: 'master' | 'release'): Promise<DiscogsSearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      per_page: '50',
    });

    if (type) {
      params.append('type', type);
    }

    const data = await this.request<{ results: DiscogsSearchResult[] }>(`/database/search?${params}`);
    return data.results || [];
  }

  async getRelease(releaseId: number | string): Promise<DiscogsRelease> {
    return await this.request<DiscogsRelease>(`/releases/${releaseId}`);
  }

  async getMaster(masterId: number | string): Promise<DiscogsMaster> {
    return await this.request<DiscogsMaster>(`/masters/${masterId}`);
  }

  getMarketplaceUrl(releaseId: number | string): string {
    return `https://www.discogs.com/sell/list?release_id=${releaseId}`;
  }

  getReleaseUrl(releaseId: number | string): string {
    return `https://www.discogs.com/release/${releaseId}`;
  }

  getMasterUrl(masterId: number | string): string {
    return `https://www.discogs.com/master/${masterId}`;
  }

  // Match a MusicBrainz release to Discogs
  async matchRelease(artist: string, title: string, year?: string): Promise<{
    discogsId: number | null;
    confidence: number;
    method: string;
  }> {
    try {
      // Search with artist and title
      const searchQuery = `${artist} ${title}${year ? ` ${year}` : ''}`;
      const results = await this.searchReleases(searchQuery);

      if (results.length === 0) {
        return { discogsId: null, confidence: 0, method: 'strict_search' };
      }

      // Find best match
      const titleLower = title.toLowerCase();
      const artistLower = artist.toLowerCase();

      for (const result of results.slice(0, 10)) {
        const resultTitleLower = result.title.toLowerCase();
        
        // Check if title and artist match
        if (resultTitleLower.includes(titleLower) && resultTitleLower.includes(artistLower)) {
          // Year match increases confidence
          let confidence = 0.8;
          if (year && result.year === year) {
            confidence = 0.95;
          }

          return {
            discogsId: result.id,
            confidence,
            method: 'strict_search',
          };
        }
      }

      // Partial match
      const firstResult = results[0];
      return {
        discogsId: firstResult.id,
        confidence: 0.5,
        method: 'strict_search',
      };
    } catch (error) {
      console.error('Discogs match error:', error);
      return { discogsId: null, confidence: 0, method: 'error' };
    }
  }
}

export const discogsClient = new DiscogsClient();
export type { DiscogsRelease, DiscogsMaster, DiscogsSearchResult };
