const SECTION_META: Record<
  string,
  { title: string; description: string; accent: string; href: string; kind: 'notes' | 'feature' }
> = {
  js: {
    title: 'JavaScript',
    description: '闭包、异步、类型判断和高频语言特性。',
    accent: 'JS',
    href: '/js/',
    kind: 'notes',
  },
  node: {
    title: 'Node.js',
    description: '模块系统、HTTP、Stream、调试与工程实践。',
    accent: 'Node',
    href: '/node/',
    kind: 'notes',
  },
  python: {
    title: 'Python',
    description: '类型系统、函数设计、标准库和常见陷阱。',
    accent: 'Py',
    href: '/python/',
    kind: 'notes',
  },
  java: {
    title: 'Java',
    description: '集合、多线程、异常和 Maven 基础。',
    accent: 'Java',
    href: '/java/',
    kind: 'notes',
  },
  vue: {
    title: 'Vue',
    description: '响应式、组件化、Pinia、Router 与生态。',
    accent: 'Vue',
    href: '/vue/',
    kind: 'notes',
  },
  react: {
    title: 'React',
    description: 'JSX、Hooks、状态管理和 Next.js 入口。',
    accent: 'React',
    href: '/react/',
    kind: 'notes',
  },
  git: {
    title: 'Git',
    description: '日常操作、回滚、分支协作与高级技巧。',
    accent: 'Git',
    href: '/git/',
    kind: 'notes',
  },
  'daily-tech': {
    title: '每日科技资讯',
    description: '每天聚合 HN、Trending 与开发者社区内容。',
    accent: 'Daily',
    href: '/daily-tech/',
    kind: 'feature',
  },
  bookmarks: {
    title: '收藏导航',
    description: '实用工具、社区、教程和个人项目入口。',
    accent: 'Links',
    href: '/bookmarks/',
    kind: 'feature',
  },
  // 完整版武侠小游戏合集:见导航栏「小游戏」外链(https://txc1224.github.io/game/)
};

export interface HomeSection {
  slug: string;
  title: string;
  description: string;
  accent: string;
  href: string;
  articleCount: number;
  kind: 'notes' | 'feature';
}

export interface HomeLink {
  title: string;
  href: string;
  description: string;
}

export interface HomeData {
  sections: HomeSection[];
  latestDaily: HomeLink[];
  featuredNotes: HomeLink[];
}

export interface NoteEntry extends HomeLink {
  slug: string;
  sectionTitle: string;
  sectionHref: string;
  tags: string[];
  lastUpdated: number;
}

export interface TagEntry {
  name: string;
  count: number;
  href: string;
  notes: HomeLink[];
}

export interface ArchiveGroup {
  slug: string;
  title: string;
  description: string;
  href: string;
  count: number;
  notes: NoteEntry[];
}

export interface DailyDigestEntry extends HomeLink {
  date: string;
  highlights: string[];
}

interface PageData {
  title: string;
  description: string;
  frontmatter: Record<string, unknown>;
  relativePath: string;
  filePath: string;
  lastUpdated?: number;
}

const FEATURED_URLS = new Set([
  '/js/core',
  '/js/async',
  '/node/events-stream',
  '/react/hooks',
  '/vue/composition',
  '/git/undo',
]);

const TAG_RULES: Array<{ name: string; test: (entry: { url: string; title: string; slug: string }) => boolean }> = [
  {
    name: '异步',
    test: (entry) => /async|promise|await|异步/i.test(`${entry.url} ${entry.title}`),
  },
  {
    name: '类型系统',
    test: (entry) => /types|typing|generic|类型|泛型/i.test(`${entry.url} ${entry.title}`),
  },
  {
    name: '状态管理',
    test: (entry) => /state|pinia|redux|zustand|状态/i.test(`${entry.url} ${entry.title}`),
  },
  {
    name: '路由',
    test: (entry) => /router|route|路由/i.test(`${entry.url} ${entry.title}`),
  },
  {
    name: '工程化',
    test: (entry) => /maven|npm|build|工程|构建|deploy|调试/i.test(`${entry.url} ${entry.title}`),
  },
  {
    name: '性能与原理',
    test: (entry) => /stream|event|process|render|原理|性能/i.test(`${entry.url} ${entry.title}`),
  },
];

function getTopLevelSlug(url: string) {
  const match = url.match(/^\/([^/]+)\//);
  return match?.[1] ?? '';
}

function normalizeUrl(url: string) {
  if (url === '/') return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function isIndexLike(url: string) {
  return /^\/(?:$|[^/]+\/)$/.test(url);
}

function toUrl(relativePath: string) {
  const cleanPath = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
  if (!cleanPath) return '/';
  return cleanPath.endsWith('/') ? `/${cleanPath}` : `/${cleanPath}`;
}

const pageModules = import.meta.glob<PageData>('../../../**/*.md', {
  eager: true,
  import: '__pageData',
});

const dailyRawModules = import.meta.glob<string>('../../../daily-tech/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const articleEntries = Object.values(pageModules)
  .map((page) => {
    const url = normalizeUrl(toUrl(page.relativePath));
    return {
      url,
      slug: getTopLevelSlug(url),
      title: String(page.frontmatter.title ?? page.title ?? '').trim(),
      description: String(page.frontmatter.description ?? page.description ?? '').trim(),
      lastUpdated: page.lastUpdated ?? 0,
    };
  })
  .filter((entry) => entry.url !== '/');

const noteEntries: NoteEntry[] = articleEntries
  .filter((entry) => SECTION_META[entry.slug]?.kind === 'notes' && !isIndexLike(entry.url))
  .map((entry) => {
    const section = SECTION_META[entry.slug];
    const tags = new Set<string>([section.title]);

    for (const rule of TAG_RULES) {
      if (rule.test(entry)) tags.add(rule.name);
    }

    return {
      title: entry.title,
      href: entry.url,
      description: entry.description || `${section.title} 主题下的知识点速查。`,
      slug: entry.slug,
      sectionTitle: section.title,
      sectionHref: section.href,
      tags: [...tags],
      lastUpdated: entry.lastUpdated,
    };
  })
  .sort((a, b) => b.lastUpdated - a.lastUpdated || a.href.localeCompare(b.href));

const sectionCountMap = new Map<string, number>();
for (const entry of articleEntries) {
  if (!entry.slug || !SECTION_META[entry.slug]) continue;
  if (entry.slug === 'daily-tech') continue;
  if (entry.slug === 'bookmarks') continue;
  if (isIndexLike(entry.url)) continue;

  sectionCountMap.set(entry.slug, (sectionCountMap.get(entry.slug) ?? 0) + 1);
}

const sections = Object.entries(SECTION_META)
  .map(([slug, meta]) => ({
    slug,
    title: meta.title,
    description: meta.description,
    accent: meta.accent,
    href: meta.href,
    articleCount: sectionCountMap.get(slug) ?? 0,
    kind: meta.kind,
  }))
  .sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'notes' ? -1 : 1;
    return b.articleCount - a.articleCount || a.title.localeCompare(b.title);
  });

const latestDaily = articleEntries
  .filter((entry) => entry.slug === 'daily-tech' && /^\d{4}-\d{2}-\d{2}$/.test(entry.url.split('/').at(-1) ?? ''))
  .sort((a, b) => b.url.localeCompare(a.url))
  .slice(0, 6)
  .map((entry) => ({
    title: entry.url.split('/').at(-1) ?? entry.title,
    href: entry.url,
    description: '自动聚合的技术热点与项目动态。',
  }));

const featuredNotes = articleEntries
  .filter((entry) => FEATURED_URLS.has(entry.url))
  .sort((a, b) => b.lastUpdated - a.lastUpdated)
  .map((entry) => ({
    title: entry.title,
    href: entry.url,
    description: entry.description || '知识点速查与实践备忘。',
  }));

export const homeData: HomeData = {
  sections,
  latestDaily,
  featuredNotes,
};

function extractHighlights(markdown: string) {
  const rows = [...markdown.matchAll(/\| \[([^\]]+)\]\([^)]+\) \|/g)].map((match) => match[1].trim()).filter(Boolean);

  return rows.slice(0, 3);
}

function extractDailySummary(markdown: string) {
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
  return headings.slice(0, 3).join(' / ') || '当天的技术热点与项目动态。';
}

export const dailyDigestEntries: DailyDigestEntry[] = Object.entries(dailyRawModules)
  .map(([path, markdown]) => {
    const date = path.match(/(\d{4}-\d{2}-\d{2})\.md$/)?.[1] ?? '';
    if (!date) return null;

    return {
      date,
      title: `每日科技资讯 ${date}`,
      href: `/daily-tech/${date}`,
      description: extractDailySummary(markdown),
      highlights: extractHighlights(markdown),
    };
  })
  .filter((entry): entry is DailyDigestEntry => Boolean(entry))
  .sort((a, b) => b.date.localeCompare(a.date));

export const archiveGroups: ArchiveGroup[] = sections
  .filter((section) => section.kind === 'notes')
  .map((section) => ({
    slug: section.slug,
    title: section.title,
    description: section.description,
    href: section.href,
    count: noteEntries.filter((note) => note.slug === section.slug).length,
    notes: noteEntries.filter((note) => note.slug === section.slug).slice(0, 8),
  }))
  .filter((group) => group.count > 0);

const tagMap = new Map<string, NoteEntry[]>();
for (const note of noteEntries) {
  for (const tag of note.tags) {
    const bucket = tagMap.get(tag) ?? [];
    bucket.push(note);
    tagMap.set(tag, bucket);
  }
}

export const tagEntries: TagEntry[] = [...tagMap.entries()]
  .map(([name, notes]) => ({
    name,
    count: notes.length,
    href: `/tags/#${encodeURIComponent(name)}`,
    notes: notes.slice(0, 5).map((note) => ({
      title: note.title,
      href: note.href,
      description: note.description,
    })),
  }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const relatedNoteMap = new Map<string, HomeLink[]>();
for (const note of noteEntries) {
  const related = noteEntries
    .filter((candidate) => candidate.href !== note.href)
    .map((candidate) => {
      const sameSection = candidate.slug === note.slug ? 4 : 0;
      const sharedTags = candidate.tags.filter((tag) => note.tags.includes(tag)).length;
      return {
        candidate,
        score: sameSection + sharedTags,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.lastUpdated - a.candidate.lastUpdated)
    .slice(0, 3)
    .map((item) => ({
      title: item.candidate.title,
      href: item.candidate.href,
      description: `${item.candidate.sectionTitle} · ${item.candidate.tags.slice(0, 2).join(' / ')}`,
    }));

  relatedNoteMap.set(note.href, related);
}

export function getRelatedNotes(href: string) {
  return relatedNoteMap.get(normalizeUrl(href)) ?? [];
}
