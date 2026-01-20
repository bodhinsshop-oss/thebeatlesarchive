'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getEraLabel } from '@/lib/era';
import SmartSearch from '@/components/SmartSearch';
import { AlbumGridSkeleton } from '@/components/SkeletonLoader';

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

export default function Home() {
  const [works, setWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [eraFilter, setEraFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'year' | 'title'>('year');

  const handleRandomWork = async () => {
    try {
      const res = await fetch('/api/random');
      const data = await res.json();
      if (data.id) {
        window.location.href = `/beatles/${data.id}`;
      }
    } catch (error) {
      console.error('Failed to get random work:', error);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        handleRandomWork();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    console.log('Fetching works for The Beatles...');
    fetch('/api/works?artist=the-beatles')
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Works received:', data);
        const worksData = Array.isArray(data) ? data : [];
        console.log('Works array:', worksData.length, 'items');
        setWorks(worksData);
        setFilteredWorks(worksData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch works:', error);
        setWorks([]);
        setFilteredWorks([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = [...works];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(work =>
        work.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(work => work.type === typeFilter);
    }

    // Apply era filter
    if (eraFilter !== 'all') {
      filtered = filtered.filter(work => {
        const era = getEraLabel(work.firstReleaseDate, work.artist.slug);
        return era === eraFilter;
      });
    }

    // Apply sorting
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
  }, [searchQuery, typeFilter, eraFilter, sortBy, works]);

  const workTypes = ['all', ...new Set(Array.isArray(works) ? works.map(w => w.type).filter(Boolean) : [])] as string[];
  const eras = ['all', 'Early Beatles', 'Psychedelic Era', 'Late Beatles', 'Post-Breakup', 'Mid-Career Solo', 'Late Career'];

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
      {/* Solo Careers Section */}
      <div className="mb-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Solo Careers</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Explore the complete discographies from each member of The Beatles
            </p>
          </div>
          <button
            onClick={handleRandomWork}
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-all duration-300 text-sm font-medium whitespace-nowrap group relative overflow-hidden"
            title="Press 'R' for random"
          >
            <span className="relative z-10">🎲 Random Release</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/solo/john-lennon"
            className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors text-center"
          >
            <div className="text-4xl mb-2">🎤</div>
            <h3 className="font-semibold group-hover:underline">John Lennon</h3>
          </a>
          <a
            href="/solo/paul-mccartney"
            className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors text-center"
          >
            <div className="text-4xl mb-2">🎸</div>
            <h3 className="font-semibold group-hover:underline">Paul McCartney</h3>
          </a>
          <a
            href="/solo/george-harrison"
            className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors text-center"
          >
            <div className="text-4xl mb-2">🎵</div>
            <h3 className="font-semibold group-hover:underline">George Harrison</h3>
          </a>
          <a
            href="/solo/ringo-starr"
            className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors text-center"
          >
            <div className="text-4xl mb-2">🥁</div>
            <h3 className="font-semibold group-hover:underline">Ringo Starr</h3>
          </a>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">The Beatles Complete Archive</h2>
        
        {/* Filters and Controls */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Smart Search */}
          <SmartSearch />

          <div className="flex flex-col md:flex-row gap-4">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400"
            >
              {workTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>

            {/* Era Filter */}
            <select
              value={eraFilter}
              onChange={(e) => setEraFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400"
            >
              {eras.map(era => (
                <option key={era} value={era}>
                  {era === 'all' ? 'All Eras' : era}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'year' | 'title')}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400"
            >
              <option value="year">Sort by Year</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        <p className="text-metadata">
          Showing {filteredWorks.length} of {works.length} works · Each work may have multiple versions
        </p>
      </div>

      {/* Works Grid */}
      {loading ? (
        <AlbumGridSkeleton count={10} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredWorks.map(work => {
          const year = work.firstReleaseDate?.split('-')[0] || 'Unknown';
          const era = getEraLabel(work.firstReleaseDate, work.artist.slug);
          
          return (
            <Link
              key={work.id}
              href={`/beatles/${work.id}`}
              className="work-card group block"
            >
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-square relative bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                {work.primaryImageUrl ? (
                  <Image
                    src={work.primaryImageUrl}
                    alt={work.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 p-4">
                    <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                    <div className="text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {work.title}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 purple-underline group-hover:text-neutral-900 dark:group-hover:text-white transition-colors mb-2">
                  {work.title}
                </h3>
                
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">{year}</span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-400">
                    {work.type}
                  </span>
                </div>
                
                {era && (
                  <div className="mb-2">
                    <span className="era-badge text-xs">
                      {era}
                    </span>
                  </div>
                )}
                
                {work._count.versions > 0 && (
                  <div className="text-xs">
                    <span className={work._count.versions > 10 ? 'purple-accent font-medium' : 'text-neutral-500 dark:text-neutral-500'}>
                      {work._count.versions} version{work._count.versions !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
        })}
        </div>
      )}

      {!loading && filteredWorks.length === 0 && (
        <div className="text-center py-20 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
          <p className="text-metadata">
            No works found matching your criteria
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setEraFilter('all');
            }}
            className="mt-4 px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
