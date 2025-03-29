import { defineConfig } from "vitepress";
import { sidebar } from "../../config/docSidebarConf";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "备忘录",
  description: "txc的备忘录",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      // { text: "js", link: "/js" },
      // {
      //   text: "node",
      //   link: "/node",
      // },
    ],
    search: {
      provider: "local",
    },
    sidebar,
    socialLinks: [
      { icon: "github", link: "https://github.com/txc1224" },
      {
        icon: "juejin",
        link: "https://juejin.cn/user/2502908797789399",
      },
    ],
  },
});
