'use client';

import { useState, useEffect } from 'react';

export default function ReadingModeToggle() {
  const [readingMode, setReadingMode] = useState(false);

  useEffect(() => {
    if (readingMode) {
      document.body.classList.add('reading-mode');
    } else {
      document.body.classList.remove('reading-mode');
    }
  }, [readingMode]);

  return (
    <button
      onClick={() => setReadingMode(!readingMode)}
      className="fixed bottom-6 right-6 px-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors z-50"
      title="Toggle reading mode (hides navigation, enlarges text)"
    >
      {readingMode ? (
        <>
          <span className="mr-2">📖</span>
          Exit Reading Mode
        </>
      ) : (
        <>
          <span className="mr-2">📄</span>
          Reading Mode
        </>
      )}
    </button>
  );
}
