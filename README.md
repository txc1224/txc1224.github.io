# txc 技术备忘录

基于 VitePress 构建的个人技术备忘录站点，记录开发中的知识点、踩坑与最佳实践。

**在线访问**: [https://txc1224.github.io](https://txc1224.github.io)

## 文档内容

| 分类             | 内容                                                 |
| ---------------- | ---------------------------------------------------- |
| **JavaScript**   | 闭包、原型链、异步编程、ES6+、正则、设计模式         |
| **Node.js**      | 模块系统、HTTP、EventEmitter、Stream、fs、调试       |
| **Python**       | 数据类型、函数、OOP、标准库、类型注解、常见陷阱      |
| **Java**         | 基本类型、OOP/泛型、集合框架、异常、多线程、Maven    |
| **Vue**          | 响应式、组件、Composition API、Router、Pinia、生态   |
| **React**        | JSX、Hooks、状态管理、Router、Next.js、生态          |
| **Git**          | 日常操作、分支管理、远程协作、撤销回退、高级技巧     |
| **每日科技资讯** | GitHub Actions 自动聚合 HackerNews + GitHub Trending |
| **收藏导航**     | 常用工具与资源链接分类汇总                           |

## 技术栈

- [VitePress](https://vitepress.dev/) — 静态站点生成
- [vitepress-sidebar](https://github.com/jooy2/vitepress-sidebar) — 侧边栏自动生成
- [vitepress-plugin-pagefind](https://github.com/ATQQ/sugar-blog/tree/master/packages/vitepress-plugin-pagefind) — 离线全文搜索
- [vitepress-plugin-mermaid](https://github.com/emersonbottero/vitepress-plugin-mermaid) — Mermaid 图表渲染
- [Giscus](https://giscus.app/) — 基于 GitHub Discussions 的评论系统
- Canvas 樱花飘落动画 + View Transitions 页面切换

## 开发

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm docs:dev

# 构建（Pagefind 搜索需构建后才可用）
pnpm docs:build

# 预览构建产物
pnpm docs:preview
```

## 部署

通过 GitHub Actions 自动部署到 GitHub Pages：

- **deploy.yml** — push 到 main 分支时自动构建部署
- **daily-tech.yml** — 每天北京时间 18:00 自动抓取科技资讯并触发部署

## 项目结构

```
docs/
├── .vitepress/
│   ├── config.mts          # VitePress 主配置
│   └── theme/
│       ├── index.ts         # 自定义主题入口
│       ├── style.css        # 自定义样式
│       └── components/
│           ├── SakuraCanvas.vue    # 樱花动画
│           └── GiscusComment.vue   # 评论组件
├── js/                     # JavaScript 文档
├── node/                   # Node.js 文档
├── python/                 # Python 文档
├── java/                   # Java 文档
├── vue/                    # Vue 文档
├── react/                  # React 文档
├── git/                    # Git 文档
├── daily-tech/             # 每日科技资讯（自动生成）
├── bookmarks/              # 收藏导航
└── index.md                # 首页
scripts/
└── fetch_daily_tech.py     # 科技资讯抓取脚本
```

## License

ISC
