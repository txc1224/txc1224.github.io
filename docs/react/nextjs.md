---
title: 'Next.js'
order: 6
---

# Next.js

> Next.js 是 React 全栈框架，支持 SSR / SSG / ISR，App Router 是未来方向。

---

## App Router vs Pages Router

| 特性     | App Router (v13.4+)    | Pages Router            |
| -------- | ---------------------- | ----------------------- |
| 目录     | `app/`                 | `pages/`                |
| 默认组件 | Server Component       | Client Component        |
| 布局     | `layout.tsx` 嵌套      | `_app.tsx` 全局         |
| 数据获取 | `async` 组件 / `fetch` | `getServerSideProps` 等 |
| 加载状态 | `loading.tsx`          | 手动处理                |
| 错误处理 | `error.tsx`            | `_error.tsx`            |
| 推荐度   | ✅ 新项目推荐          | 维护旧项目              |

---

## 文件系统路由

```
app/
├── layout.tsx          # 根布局
├── page.tsx            # / 首页
├── about/
│   └── page.tsx        # /about
├── blog/
│   ├── page.tsx        # /blog
│   └── [slug]/
│       └── page.tsx    # /blog/:slug 动态路由
├── (marketing)/        # 路由组（不影响 URL）
│   ├── pricing/page.tsx
│   └── contact/page.tsx
├── api/
│   └── users/route.ts  # API 路由 /api/users
├── loading.tsx         # 全局 loading
├── error.tsx           # 全局错误处理
└── not-found.tsx       # 404
```

| 约定文件        | 作用                         |
| --------------- | ---------------------------- |
| `page.tsx`      | 页面组件（必须导出默认组件） |
| `layout.tsx`    | 共享布局，自动嵌套           |
| `loading.tsx`   | Suspense 加载占位            |
| `error.tsx`     | 错误边界                     |
| `not-found.tsx` | 404 页面                     |
| `route.ts`      | API 路由处理                 |

---

## Server Components vs Client Components

```jsx
// ✅ Server Component（默认），可以直接 async
async function UserList() {
  const users = await db.user.findMany(); // 直接访问数据库
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}

// Client Component：需要交互、浏览器 API、Hooks
('use client'); // ← 文件顶部声明
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

| 能力            | Server Component | Client Component |
| --------------- | ---------------- | ---------------- |
| 访问数据库/文件 | ✅               | ❌               |
| 使用 Hooks      | ❌               | ✅               |
| 事件处理        | ❌               | ✅               |
| 浏览器 API      | ❌               | ✅               |
| 减少 JS 体积    | ✅               | ❌               |

---

## 数据获取

```jsx
// Server Component 直接 fetch（自动去重 + 缓存）
async function PostPage({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    cache: 'force-cache', // SSG：构建时缓存
    // cache: 'no-store',    // SSR：每次请求
    // next: { revalidate: 60 }, // ISR：60 秒重新验证
  }).then((r) => r.json());

  return <article>{post.title}</article>;
}
```

| 缓存策略                  | 等价模式 | 说明                 |
| ------------------------- | -------- | -------------------- |
| `cache: 'force-cache'`    | SSG      | 构建时生成，永久缓存 |
| `cache: 'no-store'`       | SSR      | 每次请求都重新获取   |
| `next: { revalidate: N }` | ISR      | N 秒后重新验证       |

---

## API Routes

```ts
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

---

## 中间件

```ts
// middleware.ts（项目根目录）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

---

## 常用配置

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }],
  },
  redirects: async () => [{ source: '/old-page', destination: '/new-page', permanent: true }],
  env: {
    API_URL: process.env.API_URL,
  },
};

module.exports = nextConfig;
```

---

## 部署

| 方式          | 特点                                           |
| ------------- | ---------------------------------------------- |
| Vercel        | 零配置、自动 CI/CD、边缘函数                   |
| Docker 自托管 | `next build` → `next start`，需要 Node.js 环境 |
| 静态导出      | `output: 'export'`，纯静态托管（不支持 SSR）   |

```bash
# Docker 自托管
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
