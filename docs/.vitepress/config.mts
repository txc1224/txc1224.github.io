import { defineConfig } from "vitepress";
import { sidebar } from "../../config/docSidebarConf";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "备忘录",
  description: "txc的备忘录",
  appearance: "dark",
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "JS", link: "/js/" },
      { text: "Node.js", link: "/node/" },
      { text: "每日科技资讯", link: "/daily-tech/" },
    ],
    search: {
      provider: "local",
    },
    sidebar,
    editLink: {
      pattern:
        "https://github.com/txc1224/txc1224.github.io/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },
    lastUpdated: {
      text: "最后更新",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/txc1224" },
      {
        icon: "juejin",
        link: "https://juejin.cn/user/2502908797789399",
      },
    ],
  },
});
