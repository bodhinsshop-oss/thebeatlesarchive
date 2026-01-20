/**
 * Era Detection System
 * Maps years to musical eras for Beatles and solo artists
 */

export interface Era {
  name: string;
  color: string;
  description: string;
}

export function getEraForYear(year: number | string, artistSlug: string): Era | null {
  const y = typeof year === 'string' ? parseInt(year) : year;
  if (isNaN(y)) return null;

  if (artistSlug === 'the-beatles') {
    if (y >= 1963 && y <= 1965) {
      return {
        name: 'Early Beatles',
        color: '#000000',
        description: 'The early years: Please Please Me through Help!'
      };
    }
    if (y >= 1966 && y <= 1967) {
      return {
        name: 'Psychedelic Era',
        color: '#6B5B8E',
        description: 'Revolver, Sgt. Pepper, Magical Mystery Tour'
      };
    }
    if (y >= 1968 && y <= 1970) {
      return {
        name: 'Late Beatles',
        color: '#8B4513',
        description: 'The White Album through Let It Be'
      };
    }
  }

  // Solo artists
  if (['john-lennon', 'paul-mccartney', 'george-harrison', 'ringo-starr'].includes(artistSlug)) {
    if (y >= 1970 && y <= 1975) {
      return {
        name: 'Post-Breakup',
        color: '#2E5C8A',
        description: 'Early solo work following The Beatles split'
      };
    }
    if (y >= 1976 && y <= 1985) {
      return {
        name: 'Mid-Career Solo',
        color: '#4A7C59',
        description: 'Established solo careers'
      };
    }
    if (y >= 1986) {
      return {
        name: 'Late Career',
        color: '#8B6F47',
        description: 'Later solo work and collaborations'
      };
    }
  }

  return null;
}

export function getEraLabel(year: string | null, artistSlug: string): string | null {
  if (!year) return null;
  const y = year.split('-')[0];
  const era = getEraForYear(y, artistSlug);
  return era?.name || null;
}
