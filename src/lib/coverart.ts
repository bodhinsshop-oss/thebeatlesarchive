// Cover Art Archive API client
export class CoverArtClient {
  private baseUrl = 'https://coverartarchive.org';

  async getReleaseGroupArt(releaseGroupId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/release-group/${releaseGroupId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 404) {
        return null; // No cover art available
      }

      if (!response.ok) {
        throw new Error(`Cover Art Archive error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch cover art for ${releaseGroupId}:`, error);
      return null;
    }
  }

  async getReleaseArt(releaseId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/release/${releaseId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Cover Art Archive error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch cover art for release ${releaseId}:`, error);
      return null;
    }
  }
}

export const coverArtClient = new CoverArtClient();
