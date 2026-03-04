interface ISidebarItem {
  text: string;
  link?: string;
  items?: ISidebarItem[];
}

interface ISidebarConf {
  [path: string]: ISidebarItem[];
}

export const sidebar: ISidebarConf = {
  "/js/": [
    {
      text: "JS",
      link: "/js/",
    },
  ],
  "/node/": [
    {
      text: "Node.js",
      link: "/node/",
    },
    {
      text: "fs 文件系统",
      link: "/node/fs",
    },
  ],
  "/daily-tech/": [
    {
      text: "每日科技资讯",
      link: "/daily-tech/",
    },
  ],
};
