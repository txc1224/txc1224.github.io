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
      text: "js",
      link: "/js",
    },
  ],
  "/node/": [
    {
      text: "node",
    },
    {
      text: "fs",
      link: "/node/fs",
    },
  ],
};
