'use client';

import { useState, useEffect } from 'react';

interface SyncStatus {
  totalWorks: number;
  totalVersions: number;
  totalMappings: number;
  artistStats: Array<{
    name: string;
    works: number;
    versions: number;
    mappings: number;
  }>;
}

export default function MonitorPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [previousVersions, setPreviousVersions] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/sync-status');
        const data = await res.json();
        
        // Calculate rate
        if (status) {
          const versionDiff = data.totalVersions - previousVersions;
          if (versionDiff > 0) {
            setRate(versionDiff / 10); // versions per second (10s interval)
          }
        }
        
        setPreviousVersions(data.totalVersions);
        setStatus(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [status, previousVersions]);

  if (!status) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const totalVersionsExpected = status.totalWorks * 8; // Rough estimate
  const progress = (status.totalVersions / totalVersionsExpected) * 100;
  const eta = rate > 0 ? (totalVersionsExpected - status.totalVersions) / rate / 60 : 0;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Sync Monitor</h1>
        
        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <div className="text-neutral-400 text-sm mb-2">Total Works</div>
            <div className="text-4xl font-bold">{status.totalWorks.toLocaleString()}</div>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <div className="text-neutral-400 text-sm mb-2">Total Versions</div>
            <div className="text-4xl font-bold text-green-400">{status.totalVersions.toLocaleString()}</div>
            {rate > 0 && (
              <div className="text-sm text-neutral-500 mt-1">+{rate.toFixed(1)}/s</div>
            )}
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <div className="text-neutral-400 text-sm mb-2">Discogs Links</div>
            <div className="text-4xl font-bold text-blue-400">{status.totalMappings.toLocaleString()}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">Progress</div>
            <div className="text-2xl font-bold">{progress.toFixed(1)}%</div>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {eta > 0 && (
            <div className="text-neutral-400 text-sm mt-2">
              ETA: {Math.floor(eta / 60)}h {Math.floor(eta % 60)}m
            </div>
          )}
        </div>

        {/* Artist Breakdown */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">By Artist</h2>
          <div className="space-y-4">
            {status.artistStats.map((artist) => (
              <div key={artist.name} className="border-b border-neutral-800 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{artist.name}</div>
                  <div className="text-sm text-neutral-400">
                    {artist.works} works
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-400">Versions:</span>{' '}
                    <span className="text-green-400 font-mono">{artist.versions}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Discogs:</span>{' '}
                    <span className="text-blue-400 font-mono">{artist.mappings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last Update */}
        <div className="text-center text-neutral-500 text-sm mt-6">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
