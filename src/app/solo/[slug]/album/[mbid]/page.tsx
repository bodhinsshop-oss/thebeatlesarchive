'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Track {
  id: string;
  position: number;
  title: string;
  length: number | null;
}

interface Release {
  id: string;
  mbid: string;
  title: string;
  date: string | null;
  country: string | null;
  format: string | null;
}

interface Album {
  id: string;
  mbid: string;
  title: string;
  artistCredit: string;
  firstReleaseDate: string | null;
  primaryType: string | null;
  secondaryTypes: string | null;
  coverArtUrl: string | null;
  backCoverArtUrl: string | null;
  tracks: Track[];
  releases: Release[];
  artist: {
    name: string;
    slug: string;
  };
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SoloAlbumPage() {
  const params = useParams();
  const artistSlug = params?.slug as string;
  const mbid = params?.mbid as string;
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExtremeWarning, setShowExtremeWarning] = useState(false);

  // Helper function to check if album is Two Virgins
  const isTwoVirgins = (title: string) => {
    return title.toLowerCase().includes('two virgins');
  };

  useEffect(() => {
    if (!mbid) return;

    fetch(`/api/albums/${mbid}`)
      .then(res => {
        if (!res.ok) throw new Error('Album not found');
        return res.json();
      })
      .then(data => {
        setAlbum(data);
        // Show extreme warning for Two Virgins
        if (isTwoVirgins(data.title)) {
          setShowExtremeWarning(true);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [mbid]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading album...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Album Not Found</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {error || 'The requested album could not be found.'}
        </p>
        <Link href={`/solo/${artistSlug}`} className="text-blue-600 hover:underline">
          Return to Artist Page
        </Link>
      </div>
    );
  }

  const secondaryTypes = album.secondaryTypes ? JSON.parse(album.secondaryTypes) : [];

  return (
    <div>
      {/* Extreme Warning Modal for Two Virgins */}
      {showExtremeWarning && isTwoVirgins(album.title) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-red-900 text-white rounded-lg shadow-2xl max-w-md w-full p-8 border-4 border-red-600">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h2 className="text-2xl font-bold mb-4">⚠️ EXTREME WARNING ⚠️</h2>
              <p className="text-lg mb-6 font-semibold">
                EXTREME NUDITY
              </p>
              <p className="mb-6">
                Open at your own risk.
              </p>
              <button
                onClick={() => setShowExtremeWarning(false)}
                className="w-full px-6 py-3 bg-white text-red-900 rounded-md hover:bg-red-100 transition-colors font-bold"
              >
                I UNDERSTAND THE RISKS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <Link href={`/solo/${artistSlug}`} className="inline-block mb-6 text-sm text-neutral-600 dark:text-neutral-400 hover:underline">
        ← Back to {album.artist.name}
      </Link>

      {/* Album Header */}
      <div className="grid md:grid-cols-[300px_1fr] lg:grid-cols-[400px_1fr] gap-8 mb-12">
        {/* Cover Art */}
        <div>
          <div className="aspect-square relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
            {album.coverArtUrl ? (
              <>
                <Image
                  src={album.coverArtUrl}
                  alt={album.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                {/* Black overlay for Two Virgins albums */}
                {isTwoVirgins(album.title) && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-bold">CENSORED</p>
                      <p className="text-xs mt-1 opacity-75">Extreme Content</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
            )}
          </div>

          {/* Back Cover */}
          {album.backCoverArtUrl && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Back Cover</h3>
              <div className="aspect-square relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src={album.backCoverArtUrl}
                  alt={`${album.title} - Back Cover`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </div>
          )}
        </div>

        {/* Album Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{album.title}</h1>
          
          <div className="space-y-3 text-lg">
            <p>
              <span className="text-neutral-600 dark:text-neutral-400">Artist:</span>{' '}
              <Link href={`/solo/${artistSlug}`} className="font-semibold hover:underline">
                {album.artistCredit}
              </Link>
            </p>
            
            {album.firstReleaseDate && (
              <p>
                <span className="text-neutral-600 dark:text-neutral-400">Released:</span>{' '}
                <span className="font-semibold">
                  {new Date(album.firstReleaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
            )}

            <p>
              <span className="text-neutral-600 dark:text-neutral-400">Type:</span>{' '}
              <span className="font-semibold">
                {[album.primaryType, ...secondaryTypes].filter(Boolean).join(', ')}
              </span>
            </p>

            {album.tracks.length > 0 && (
              <p>
                <span className="text-neutral-600 dark:text-neutral-400">Tracks:</span>{' '}
                <span className="font-semibold">{album.tracks.length}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tracklist */}
      {album.tracks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Tracklist</h2>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider w-24">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {album.tracks.map((track) => (
                  <tr key={track.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {track.position}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {track.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400 text-right font-mono">
                      {formatDuration(track.length)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Editions/Releases */}
      {album.releases.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Editions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {album.releases.map((release) => (
              <div
                key={release.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4"
              >
                <h3 className="font-semibold mb-2">{release.title}</h3>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                  {release.date && (
                    <p>Released: {new Date(release.date).toLocaleDateString()}</p>
                  )}
                  {release.country && <p>Country: {release.country}</p>}
                  {release.format && <p>Format: {release.format}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
