'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SyncStatusBanner() {
  const [status, setStatus] = useState<{ totalVersions: number; isComplete: boolean } | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/sync-status');
        const data = await res.json();
        const isComplete = data.totalVersions >= data.totalWorks * 5;
        
        // Check if just completed
        if (isComplete && status && !status.isComplete) {
          setJustCompleted(true);
          setTimeout(() => setJustCompleted(false), 3000);
        }
        
        setStatus({ totalVersions: data.totalVersions, isComplete });
      } catch {
        setStatus(null);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [status]);

  if (!status || status.isComplete) return null;

  return (
    <div className={`bg-neutral-900 border-b border-neutral-800 text-white transition-all duration-500 ${justCompleted ? 'border-b-2 border-purple-500' : ''}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${justCompleted ? 'bg-purple-400' : 'bg-green-400'}`} />
              <span className="text-neutral-300">Archiving in progress...</span>
            </div>
            <span className={`transition-colors ${justCompleted ? 'text-purple-400 font-medium' : 'text-neutral-500'}`}>
              {status.totalVersions.toLocaleString()} versions indexed
            </span>
          </div>
          <Link 
            href="/monitor" 
            className="text-neutral-400 hover:text-purple-400 transition-colors"
          >
            View progress →
          </Link>
        </div>
      </div>
    </div>
  );
}
