export interface MusicTrack {
  title: string;
  artist: string;
  src: string;
}

export const musicManifest: MusicTrack[] = [
  {
    artist: 'Izony',
    title: '1',
    src: '/music/izony-1.mp3',
  },
  {
    artist: 'Izony',
    title: '2',
    src: '/music/izony-2.mp3',
  },
  {
    artist: 'The',
    title: 'Gifted',
    src: '/music/the-gifted.mp3',
  },
];
