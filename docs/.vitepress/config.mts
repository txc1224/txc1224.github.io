import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { generateSidebar } from 'vitepress-sidebar';
import { pagefindPlugin } from 'vitepress-plugin-pagefind';

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: '备忘录',
    description: 'txc的备忘录',
    appearance: 'dark',
    lastUpdated: true,
    head: [
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'txc 技术备忘录' }],
      ['meta', { property: 'og:description', content: '记录开发中遇到的知识点、踩坑与最佳实践' }],
      ['meta', { property: 'og:url', content: 'https://txc1224.github.io' }],
    ],
    sitemap: {
      hostname: 'https://txc1224.github.io',
    },
    vite: {
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
          items: [{ text: 'Git', link: '/git/' }],
        },
        { text: '小游戏', link: '/playground/' },
        { text: '每日科技资讯', link: '/daily-tech/' },
        { text: '收藏导航', link: '/bookmarks/' },
      ],
      sidebar: generateSidebar([
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
          scanStartPath: 'playground',
          resolvePath: '/playground/',
          useTitleFromFrontmatter: true,
        },
        {
          documentRootPath: '/docs',
          scanStartPath: 'daily-tech',
          resolvePath: '/daily-tech/',
          useTitleFromFrontmatter: true,
        },
        {
          documentRootPath: '/docs',
          scanStartPath: 'bookmarks',
          resolvePath: '/bookmarks/',
          useTitleFromFrontmatter: true,
        },
      ]),
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
