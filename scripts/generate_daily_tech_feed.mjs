import { promises as fs } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dailyDir = path.join(rootDir, 'docs', 'daily-tech');
const publicDir = path.join(rootDir, 'docs', 'public');
const outputFile = path.join(publicDir, 'daily-tech.xml');
const siteUrl = 'https://txc1224.github.io';

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function extractSummary(markdown) {
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
  return headings.slice(0, 4).join(' / ') || '每日技术热点聚合。';
}

function extractHighlights(markdown) {
  const rows = [...markdown.matchAll(/\| \[([^\]]+)\]\([^)]+\) \|/g)].map((match) => match[1].trim()).filter(Boolean);

  return rows.slice(0, 5);
}

async function main() {
  const fileNames = (await fs.readdir(dailyDir))
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .sort()
    .reverse();

  const items = [];

  for (const fileName of fileNames.slice(0, 30)) {
    const date = fileName.replace(/\.md$/, '');
    const filePath = path.join(dailyDir, fileName);
    const markdown = await fs.readFile(filePath, 'utf8');
    const summary = extractSummary(markdown);
    const highlights = extractHighlights(markdown);
    const link = `${siteUrl}/daily-tech/${date}`;
    const description = [summary, ...highlights].map((line) => `<p>${escapeXml(line)}</p>`).join('');
    const pubDate = new Date(`${date}T18:00:00+08:00`).toUTCString();

    items.push(`
    <item>
      <title>${escapeXml(`每日科技资讯 ${date}`)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`);
  }

  const latestDate = fileNames[0]?.replace(/\.md$/, '') ?? new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>txc 每日科技资讯</title>
    <link>${siteUrl}/daily-tech/</link>
    <description>每天自动聚合 HackerNews、GitHub Trending 与开发者社区内容。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date(`${latestDate}T18:00:00+08:00`).toUTCString()}</lastBuildDate>
    ${items.join('\n')}
  </channel>
</rss>
`;

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(outputFile, xml, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
