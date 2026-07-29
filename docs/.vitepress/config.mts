import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { generateSidebar } from 'vitepress-sidebar';
import { pagefindPlugin } from 'vitepress-plugin-pagefind';

// https://vitepress.dev/reference/site-config
const require = createRequire(import.meta.url);
const dayjsEsmEntry = require.resolve('dayjs/esm/index.js');
const sanitizeUrlShim = require.resolve('./theme/utils/sanitize-url-shim.mjs');
const sanitizeUrlEntry = require.resolve('@braintree/sanitize-url/dist/index.js');
const docsRoot = path.resolve(process.cwd(), 'docs');

function createDailyTechSidebar() {
  const dailyTechDir = path.join(docsRoot, 'daily-tech');
  const entries = readdirSync(dailyTechDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{4}-\d{2}-\d{2}\.md$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .sort((a, b) => b.localeCompare(a, 'en'));

  const groups = new Map<string, string[]>();

  for (const slug of entries) {
    const monthKey = slug.slice(0, 7);
    const list = groups.get(monthKey) ?? [];
    list.push(slug);
    groups.set(monthKey, list);
  }

  return [
    {
      text: '总览',
      items: [{ text: '每日科技资讯', link: '/daily-tech/' }],
    },
    ...Array.from(groups.entries()).map(([monthKey, slugs]) => {
      const [year, month] = monthKey.split('-');
      return {
        text: `${year} 年 ${month} 月`,
        collapsed: true,
        items: slugs.map((slug) => ({
          text: slug,
          link: `/daily-tech/${slug}`,
        })),
      };
    }),
  ];
}

const generatedSidebar = generateSidebar([
  {
    documentRootPath: '/docs',
    scanStartPath: 'js',
    resolvePath: '/js/',
    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterOrder: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'node',
    resolvePath: '/node/',
    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterOrder: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'python',
    resolvePath: '/python/',
    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterOrder: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'java',
    resolvePath: '/java/',
    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterOrder: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'git',
    resolvePath: '/git/',
    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterOrder: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'vue',
    resolvePath: '/vue/',
    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterOrder: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'react',
    resolvePath: '/react/',
    useTitleFromFrontmatter: true,
    sortMenusByFrontmatterOrder: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'bookmarks',
    resolvePath: '/bookmarks/',
    useTitleFromFrontmatter: true,
  },
]);

const config = withMermaid(
  defineConfig({
    title: '备忘录',
    description: 'txc的备忘录',
    appearance: 'dark',
    lastUpdated: true,
    head: [
      ['link', { rel: 'icon', type: 'image/png', href: '/kuromi-512.png' }],
      ['link', { rel: 'apple-touch-icon', href: '/kuromi-512.png' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'txc 技术备忘录' }],
      ['meta', { property: 'og:description', content: '记录开发中遇到的知识点、踩坑与最佳实践' }],
      ['meta', { property: 'og:url', content: 'https://txc1224.github.io' }],
      ['link', { rel: 'alternate', type: 'application/rss+xml', title: '每日科技资讯 RSS', href: '/daily-tech.xml' }],
    ],
    sitemap: {
      hostname: 'https://txc1224.github.io',
    },
    vite: {
      resolve: {
        alias: [
          { find: /^dayjs$/, replacement: dayjsEsmEntry },
          { find: /^@braintree\/sanitize-url$/, replacement: sanitizeUrlShim },
          {
            find: /^@braintree\/sanitize-url\/dist\/index\.js$/,
            replacement: sanitizeUrlEntry,
          },
        ],
      },
      plugins: [
        pagefindPlugin({
          btnPlaceholder: '搜索文档',
          placeholder: '搜索文档',
          emptyText: '没有找到相关结果',
          heading: '共 {{searchResult}} 条结果',
        }),
      ],
    },
    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: '首页', link: '/' },
        {
          text: '语言',
          items: [
            { text: 'JavaScript', link: '/js/' },
            { text: 'Node.js', link: '/node/' },
            { text: 'Python', link: '/python/' },
            { text: 'Java', link: '/java/' },
          ],
        },
        {
          text: '框架',
          items: [
            { text: 'Vue', link: '/vue/' },
            { text: 'React', link: '/react/' },
          ],
        },
        {
          text: '工具',
          items: [
            { text: 'Git', link: '/git/' },
            { text: '归档', link: '/archive/' },
            { text: '标签', link: '/tags/' },
          ],
        },
        { text: '全网热榜实时聚合', link: 'https://txc1224.github.io/daily-digest/' },
        { text: '小游戏', link: 'https://txc1224.github.io/game/', target: '_blank' },
        { text: '每日科技资讯', link: '/daily-tech/' },
        { text: '收藏导航', link: '/bookmarks/' },
      ],
      sidebar: {
        ...generatedSidebar,
        '/daily-tech/': createDailyTechSidebar(),
      },
      editLink: {
        pattern: 'https://github.com/txc1224/txc1224.github.io/edit/main/docs/:path',
        text: '在 GitHub 上编辑此页',
      },
      lastUpdated: {
        text: '最后更新',
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/txc1224' },
        {
          icon: 'juejin',
          link: 'https://juejin.cn/user/2502908797789399',
        },
      ],
    },
  }),
);

const blockedOptimizeDeps = new Set(['@braintree/sanitize-url', 'debug', 'cytoscape-cose-bilkent', 'cytoscape']);

config.vite ??= {};
config.vite.optimizeDeps ??= {};
config.vite.optimizeDeps.include = (config.vite.optimizeDeps.include ?? []).filter(
  (item) => !blockedOptimizeDeps.has(item),
);

export default config;
