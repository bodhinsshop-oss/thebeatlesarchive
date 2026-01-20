'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ARTISTS } from '@/lib/artists';

interface Work {
  id: string;
  mbReleaseGroupId: string;
  title: string;
  type: string;
  firstReleaseDate: string | null;
  primaryImageUrl: string | null;
  artist: {
    slug: string;
    name: string;
  };
  _count: {
    versions: number;
  };
}

export default function SoloArtistPage() {
  const params = useParams();
  const artistSlug = params?.slug as string;
  const artist = artistSlug ? ARTISTS[artistSlug] : null;

  const [works, setWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'year' | 'title'>('year');
  const [showContentWarning, setShowContentWarning] = useState(false);

  // Helper function to check if album is Two Virgins
  const isTwoVirgins = (title: string) => {
    return title.toLowerCase().includes('two virgins');
  };

  useEffect(() => {
    if (!artistSlug) return;

    // Show content warning for John Lennon
    if (artistSlug === 'john-lennon') {
      setShowContentWarning(true);
    }

    fetch(`/api/works?artist=${artistSlug}`)
      .then(res => res.json())
      .then(data => {
        setWorks(data);
        setFilteredWorks(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch works:', error);
        setLoading(false);
      });
  }, [artistSlug]);

  useEffect(() => {
    let filtered = [...works];

    if (searchQuery) {
      filtered = filtered.filter(work =>
        work.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(work => work.type === typeFilter);
    }

    if (sortBy === 'year') {
      filtered.sort((a, b) => {
        const dateA = a.firstReleaseDate || '9999';
        const dateB = b.firstReleaseDate || '9999';
        return dateA.localeCompare(dateB);
      });
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredWorks(filtered);
  }, [searchQuery, typeFilter, sortBy, works]);

  const workTypes = ['all', ...new Set(works.map(w => w.type).filter(Boolean))] as string[];

  if (!artist) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Artist Not Found</h2>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading works...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Content Warning Modal for John Lennon */}
      {showContentWarning && artistSlug === 'john-lennon' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold mb-4">Content Warning</h2>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6">
              All albums are not appropriate for all audiences. Some content may contain nudity and harsh language.
            </p>
            <button
              onClick={() => setShowContentWarning(false)}
              className="w-full px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      <Link href="/" className="inline-block mb-6 text-sm text-neutral-600 dark:text-neutral-400 hover:underline">
        ← Back to Home
      </Link>

      {/* Artist Header */}
      <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">Solo Discography</p>
      </div>

      <div className="mb-8">
        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search works..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            {workTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'year' | 'title')}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <option value="year">Sort by Year</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing {filteredWorks.length} of {works.length} works
        </p>
      </div>

      {/* Works Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredWorks.map(work => (
          <Link
            key={work.id}
            href={`/solo/${artistSlug}/${work.id}`}
            className="work-card group"
          >
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-neutral-100 dark:bg-neutral-800">
                {work.primaryImageUrl ? (
                  <>
                    <Image
                      src={work.primaryImageUrl}
                      alt={work.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    {/* Black overlay for Two Virgins albums */}
                    {isTwoVirgins(work.title) && (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        <div className="text-center text-white p-4">
                          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs font-semibold">CENSORED</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:underline">
                  {work.title}
                </h3>
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>{work.firstReleaseDate ? new Date(work.firstReleaseDate).getFullYear() : 'Unknown'}</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">
                    {work.type}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                  {work._count.versions} version{work._count.versions !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredWorks.length === 0 && (
        <div className="text-center py-20">
          <p className="text-neutral-600 dark:text-neutral-400">
            {works.length === 0 
              ? `No works found for ${artist.name}. The sync is running in the background.`
              : 'No works found matching your criteria'
            }
          </p>
        </div>
      )}

      {/* Disclaimer for John Lennon */}
      {artistSlug === 'john-lennon' && (
        <div className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
            Note: "Two Virgins" albums removed for obvious reasons.
          </p>
        </div>
      )}
    </div>
  );
}
