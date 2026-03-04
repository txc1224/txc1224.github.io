---
title: 'UI 框架 & 生态'
order: 7
---

# UI 框架 & 生态

> Vue 生态成熟丰富，覆盖 PC/移动端 UI 框架、SSR/SSG、工具库、开发工具等。

---

## Element Plus（PC 端）

```ts
// 按需引入（推荐）
// pnpm add element-plus
// pnpm add -D unplugin-vue-components unplugin-auto-import

// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [AutoImport({ resolvers: [ElementPlusResolver()] }), Components({ resolvers: [ElementPlusResolver()] })],
});
```

```vue
<!-- 直接使用，无需手动 import -->
<template>
  <el-button type="primary" @click="handleClick">按钮</el-button>
  <el-table :data="tableData">
    <el-table-column prop="name" label="名称" />
    <el-table-column prop="status" label="状态" />
  </el-table>
</template>
```

---

## Vant（移动端）

```ts
// pnpm add vant
// pnpm add -D @vant/auto-import-resolver

// vite.config.ts
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from '@vant/auto-import-resolver';

export default defineConfig({
  plugins: [Components({ resolvers: [VantResolver()] })],
});
```

```vue
<template>
  <van-button type="primary">按钮</van-button>
  <van-list v-model:loading="loading" :finished="finished" @load="onLoad">
    <van-cell v-for="item in list" :key="item.id" :title="item.name" />
  </van-list>
</template>
```

---

## Nuxt 3 概述

| 特性       | 说明                            |
| ---------- | ------------------------------- |
| SSR        | 服务端渲染，SEO 友好            |
| SSG        | 静态站点生成，部署到 CDN        |
| 文件路由   | `pages/` 目录自动生成路由       |
| 自动导入   | 组件、composables、API 自动导入 |
| 服务端 API | `server/api/` 目录编写后端接口  |

```bash
# 创建 Nuxt 3 项目
npx nuxi@latest init my-nuxt-app
```

```
nuxt-app/
  ├── pages/          # 文件路由
  ├── components/     # 自动注册组件
  ├── composables/    # 自动导入 composables
  ├── server/api/     # 服务端 API
  ├── layouts/        # 布局组件
  └── nuxt.config.ts  # 配置文件
```

---

## VitePress 建站

```bash
# 创建 VitePress 项目
npx vitepress init
```

| 适用场景 | 说明                    |
| -------- | ----------------------- |
| 技术文档 | Markdown 驱动，开箱即用 |
| 博客     | 支持自定义主题          |
| 知识库   | 侧边栏 + 搜索           |

> 本站就是用 VitePress 搭建的。

---

## 常用工具库

| 库                      | 用途                  | 安装                                  |
| ----------------------- | --------------------- | ------------------------------------- |
| VueUse                  | 200+ 实用 Composables | `pnpm add @vueuse/core`               |
| unplugin-auto-import    | 自动导入 API          | `pnpm add -D unplugin-auto-import`    |
| unplugin-vue-components | 自动注册组件          | `pnpm add -D unplugin-vue-components` |
| vue-i18n                | 国际化                | `pnpm add vue-i18n`                   |
| @formkit/auto-animate   | 自动过渡动画          | `pnpm add @formkit/auto-animate`      |
| vee-validate + zod      | 表单验证              | `pnpm add vee-validate zod`           |

### VueUse 常用函数速览

```ts
import {
  useLocalStorage, // 响应式 localStorage
  useDark, // 深色模式
  useClipboard, // 复制到剪贴板
  useIntersectionObserver, // 懒加载
  useDebounceFn, // 防抖
  useThrottleFn, // 节流
} from '@vueuse/core';

const isDark = useDark();
const name = useLocalStorage('name', '默认值');
const { copy, copied } = useClipboard();
```

---

## 开发工具

| 工具                   | 说明                                         |
| ---------------------- | -------------------------------------------- |
| Vue DevTools           | 浏览器扩展，调试组件树 / 状态 / 路由 / Pinia |
| Volar (Vue - Official) | VSCode 官方扩展，类型检查 + 语法高亮         |
| vue-tsc                | 命令行类型检查，CI 中使用                    |
| Vitest                 | Vite 原生测试框架，兼容 Jest API             |
| Vue Test Utils         | 官方组件测试工具                             |

```bash
# CI 中运行类型检查
npx vue-tsc --noEmit

# 运行单元测试
npx vitest run
```
