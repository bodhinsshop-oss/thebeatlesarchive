// Artist configuration for The Beatles and solo artists

export interface ArtistConfig {
  id: string;
  name: string;
  slug: string;
  musicbrainzArtistId: string;
  type: 'group' | 'solo';
}

export const ARTISTS: Record<string, ArtistConfig> = {
  'the-beatles': {
    id: 'beatles-group-id',
    name: 'The Beatles',
    slug: 'the-beatles',
    musicbrainzArtistId: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    type: 'group',
  },
  'john-lennon': {
    id: 'john-lennon-id',
    name: 'John Lennon',
    slug: 'john-lennon',
    musicbrainzArtistId: '4d5447d7-c61c-4120-ba1b-d7f471d385b9',
    type: 'solo',
  },
  'paul-mccartney': {
    id: 'paul-mccartney-id',
    name: 'Paul McCartney',
    slug: 'paul-mccartney',
    musicbrainzArtistId: 'ba550d0e-adac-4864-b88b-407cab5e76af',
    type: 'solo',
  },
  'george-harrison': {
    id: 'george-harrison-id',
    name: 'George Harrison',
    slug: 'george-harrison',
    musicbrainzArtistId: '42a8f507-8412-4611-854f-926571049fa0',
    type: 'solo',
  },
  'ringo-starr': {
    id: 'ringo-starr-id',
    name: 'Ringo Starr',
    slug: 'ringo-starr',
    musicbrainzArtistId: '300c4c73-33ac-4255-9d57-4e32627f5e13',
    type: 'solo',
  },
};

export const SOLO_ARTISTS = Object.values(ARTISTS).filter(a => a.type === 'solo');
export const THE_BEATLES = ARTISTS['the-beatles'];
