'use client';

import { useState, useEffect } from 'react';

interface ArtistStats {
  name: string;
  slug: string;
  works: number;
  versions: number;
}

interface StatusData {
  totalWorks: number;
  totalVersions: number;
  totalMappings: number;
  artistStats: ArtistStats[];
  lastUpdated: string;
}

export default function SyncStatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousWorks, setPreviousWorks] = useState<number>(0);
  const [worksPerMinute, setWorksPerMinute] = useState<number>(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/sync-status', { cache: 'no-store' });
      const data = await res.json();
      
      // Calculate sync rate
      const now = Date.now();
      const timeDiff = (now - lastCheckTime) / 1000 / 60; // minutes
      const worksDiff = data.totalWorks - previousWorks;
      
      if (timeDiff > 0 && worksDiff > 0) {
        const rate = worksDiff / timeDiff;
        setWorksPerMinute(rate);
      }
      
      setPreviousWorks(data.totalWorks);
      setLastCheckTime(now);
      setStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching status:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Refresh every 3 seconds for more responsive updates
    return () => clearInterval(interval);
  }, []);
  
  const calculateETA = () => {
    if (!status || worksPerMinute === 0) return null;
    
    const remaining = 1640 - status.totalWorks;
    const minutesRemaining = remaining / worksPerMinute;
    
    if (minutesRemaining < 60) {
      return `${Math.round(minutesRemaining)} minutes`;
    } else {
      const hours = Math.floor(minutesRemaining / 60);
      const minutes = Math.round(minutesRemaining % 60);
      return `${hours}h ${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4">Loading sync status...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <p className="text-center text-red-600">Failed to load sync status</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-black">Sync Status</h1>
        <p className="text-gray-800">
          Auto-refreshing every 3 seconds
        </p>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-gray-700">
            Last updated: {new Date(status.lastUpdated).toLocaleTimeString()}
          </p>
          {worksPerMinute > 0 && (
            <p className="text-sm text-gray-700">
              • Rate: {worksPerMinute.toFixed(1)} works/min
            </p>
          )}
          {calculateETA() && (
            <p className="text-sm font-semibold text-blue-600">
              • ETA: {calculateETA()}
            </p>
          )}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 border-2 border-black p-6">
          <div className="text-3xl font-bold mb-2 text-black">{status.totalWorks}</div>
          <div className="text-sm font-semibold text-black">Total Works</div>
          <div className="text-xs text-gray-600">Release groups synced</div>
        </div>
        <div className="bg-gray-50 border-2 border-black p-6">
          <div className="text-3xl font-bold mb-2 text-black">{status.totalVersions}</div>
          <div className="text-sm font-semibold text-black">Total Versions</div>
          <div className="text-xs text-gray-600">Pressings/editions synced</div>
        </div>
        <div className="bg-gray-50 border-2 border-black p-6">
          <div className="text-3xl font-bold mb-2 text-black">{status.totalMappings}</div>
          <div className="text-sm font-semibold text-black">Discogs Mappings</div>
          <div className="text-xs text-gray-600">Matched to marketplace</div>
        </div>
      </div>

      {/* Expected Totals */}
      <div className="bg-gray-100 border-2 border-gray-400 p-4 mb-8">
        <h2 className="font-bold mb-2 text-black">Expected Totals (Approximate):</h2>
        <div className="text-sm space-y-1 text-black">
          <div>• The Beatles: ~1000 works</div>
          <div>• John Lennon: ~250 works</div>
          <div>• Paul McCartney: ~180 works</div>
          <div>• George Harrison: ~130 works</div>
          <div>• Ringo Starr: ~80 works</div>
          <div className="font-bold mt-2 text-black">Total Expected: ~1,640 works</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2 text-black">
          <span>Overall Progress</span>
          <span>{Math.round((status.totalWorks / 1640) * 100)}%</span>
        </div>
        <div className="w-full h-8 bg-gray-200 border-2 border-black">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${Math.min((status.totalWorks / 1640) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Artist Breakdown */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-black">By Artist</h2>
        <div className="space-y-4">
          {status.artistStats
            .sort((a, b) => b.works - a.works)
            .map((artist) => (
              <div key={artist.slug} className="border-2 border-gray-400 p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-black">{artist.name}</h3>
                  <div className="text-right">
                    <div className="font-bold text-black">{artist.works} works</div>
                    <div className="text-sm text-gray-700">{artist.versions} versions</div>
                  </div>
                </div>
                <div className="w-full h-4 bg-gray-200 border border-gray-400">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (artist.works /
                          (artist.name === 'The Beatles'
                            ? 1000
                            : artist.name === 'John Lennon'
                            ? 250
                            : artist.name === 'Paul McCartney'
                            ? 180
                            : artist.name === 'George Harrison'
                            ? 130
                            : 80)) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-8 p-4 bg-green-100 border-2 border-green-500">
        <p className="text-sm text-black">
          <strong>✓ Sync is running in the background</strong>
          <br />
          The sync process is fetching works from MusicBrainz, matching them to Discogs,
          and storing all pressing details. This page will automatically update every 5 seconds.
        </p>
      </div>
    </div>
  );
}
