// MusicBrainz API client with rate limiting
export class MusicBrainzClient {
  private baseUrl = 'https://musicbrainz.org/ws/2';
  private userAgent = 'TheBeatlesArchive/1.0.0 (contact@bodhin.industries)';
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 second between requests

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        return response;
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry ${i + 1}/${maxRetries} for ${url}`);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Progressive backoff
        }
      }
    }
    
    throw lastError;
  }

  async searchArtist(artistName: string) {
    await this.rateLimit();
    
    const params = new URLSearchParams({
      query: `artist:"${artistName}"`,
      fmt: 'json'
    });

    const response = await this.fetchWithRetry(`${this.baseUrl}/artist?${params}`);

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getReleaseGroups(artistId: string, limit = 100, offset = 0) {
    await this.rateLimit();
    
    const params = new URLSearchParams({
      artist: artistId,
      limit: limit.toString(),
      offset: offset.toString(),
      fmt: 'json'
    });

    const response = await this.fetchWithRetry(`${this.baseUrl}/release-group?${params}`);

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getReleaseGroupDetails(releaseGroupId: string) {
    await this.rateLimit();
    
    const params = new URLSearchParams({
      inc: 'releases+artist-credits',
      fmt: 'json'
    });

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/release-group/${releaseGroupId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getRelease(releaseId: string) {
    await this.rateLimit();
    
    const params = new URLSearchParams({
      inc: 'recordings+artist-credits+labels',
      fmt: 'json'
    });

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/release/${releaseId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const musicbrainzClient = new MusicBrainzClient();
