import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const musicDir = path.join(projectRoot, 'docs/public/music');
const outputFile = path.join(projectRoot, 'docs/.vitepress/theme/data/music-manifest.ts');

function toTitleCase(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toTrackMeta(filename) {
  const stem = filename.replace(path.extname(filename), '');
  const artistMatch = stem.match(/^([^-]+)-\s*(.+)$/);

  if (artistMatch) {
    return {
      artist: toTitleCase(artistMatch[1]),
      title: toTitleCase(artistMatch[2]),
    };
  }

  return {
    artist: 'Local Library',
    title: toTitleCase(stem),
  };
}

async function main() {
  const entries = await fs.readdir(musicDir, { withFileTypes: true });
  const tracks = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.(mp3|m4a|wav|ogg)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((name) => {
      const meta = toTrackMeta(name);
      return {
        ...meta,
        src: `/music/${name}`,
      };
    });

  const source = `export interface MusicTrack {\n  title: string;\n  artist: string;\n  src: string;\n}\n\nexport const musicManifest: MusicTrack[] = ${JSON.stringify(tracks, null, 2)};\n`;

  await fs.writeFile(outputFile, source, 'utf8');
  console.log(`Generated ${tracks.length} music tracks -> ${path.relative(projectRoot, outputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
