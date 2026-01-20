'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Work {
  id: string;
  title: string;
  type: string;
  firstReleaseDate: string | null;
  primaryImageUrl: string | null;
  tracklistJson: string | null;
  trackCount: number | null;
  versions: Array<{
    id: string;
    country: string | null;
    releaseDate: string | null;
  }>;
}

export default function ComparePage() {
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [leftWork, setLeftWork] = useState<Work | null>(null);
  const [rightWork, setRightWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const left = params.get('left');
    const right = params.get('right');
    if (left) setLeftId(left);
    if (right) setRightId(right);
  }, []);

  useEffect(() => {
    if (leftId) loadWork(leftId, 'left');
  }, [leftId]);

  useEffect(() => {
    if (rightId) loadWork(rightId, 'right');
  }, [rightId]);

  const loadWork = async (id: string, side: 'left' | 'right') => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/works/${id}`);
      const data = await res.json();
      if (side === 'left') {
        setLeftWork(data);
      } else {
        setRightWork(data);
      }
    } catch (error) {
      console.error('Failed to load work:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWorkPanel = (work: Work | null, side: 'left' | 'right') => {
    if (!work) {
      return (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
          <div className="text-center text-metadata">
            <p className="mb-2">Enter a work ID to compare</p>
            <p className="text-xs opacity-60">Find IDs in the URL of album pages</p>
          </div>
        </div>
      );
    }

    const tracklist = work.tracklistJson ? JSON.parse(work.tracklistJson) : [];
    const year = work.firstReleaseDate?.split('-')[0] || 'Unknown';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-4">
          {work.primaryImageUrl ? (
            <Image
              src={work.primaryImageUrl}
              alt={work.title}
              width={120}
              height={120}
              className="rounded shadow-soft"
            />
          ) : (
            <div className="w-30 h-30 bg-neutral-200 dark:bg-neutral-800 rounded flex items-center justify-center">
              <span className="text-neutral-400 text-xs">No Image</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{work.title}</h3>
            <div className="space-y-1 text-metadata">
              <div>Type: {work.type}</div>
              <div>Year: {year}</div>
              <div>Tracks: {work.trackCount || tracklist.length}</div>
              <div>Versions: {work.versions.length}</div>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        {tracklist.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm">Tracklist</h4>
            <div className="space-y-1 text-sm">
              {tracklist.map((track: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800"
                >
                  <div className="flex gap-2">
                    <span className="text-neutral-400 min-w-[2rem]">{track.position}</span>
                    <span>{track.title}</span>
                  </div>
                  {track.length && (
                    <span className="text-neutral-500 text-xs">
                      {Math.floor(track.length / 60000)}:{String(Math.floor((track.length % 60000) / 1000)).padStart(2, '0')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version Summary */}
        <div>
          <h4 className="font-semibold mb-3 text-sm">Versions by Country</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(
              work.versions.reduce((acc, v) => {
                const country = v.country || 'International';
                acc[country] = (acc[country] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([country, count]) => (
              <div key={country} className="flex justify-between py-1">
                <span>{country}</span>
                <span className="text-neutral-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="editorial-container py-12">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-12 text-metadata">
          <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="opacity-60">Compare</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-display mb-3">Compare Albums</h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light">
            Side-by-side comparison of any two works
          </p>
        </header>

        {/* Input Controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Left Side Work ID</label>
            <input
              type="text"
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              placeholder="Enter work ID..."
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Right Side Work ID</label>
            <input
              type="text"
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              placeholder="Enter work ID..."
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="comparison-grid">
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            {renderWorkPanel(leftWork, 'left')}
          </div>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            {renderWorkPanel(rightWork, 'right')}
          </div>
        </div>

        {/* Differences */}
        {leftWork && rightWork && (
          <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-bold mb-4">Key Differences</h2>
            <div className="space-y-3 text-sm">
              {leftWork.type !== rightWork.type && (
                <div className="comparison-highlight">
                  Different types: {leftWork.type} vs {rightWork.type}
                </div>
              )}
              {leftWork.trackCount !== rightWork.trackCount && (
                <div className="comparison-highlight">
                  Different track counts: {leftWork.trackCount} vs {rightWork.trackCount}
                </div>
              )}
              {leftWork.versions.length !== rightWork.versions.length && (
                <div className="comparison-highlight">
                  Different version counts: {leftWork.versions.length} vs {rightWork.versions.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
