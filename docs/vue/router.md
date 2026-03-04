---
title: 'Vue Router'
order: 5
---

# Vue Router

> Vue Router 是 Vue 官方路由管理器，支持嵌套路由、动态匹配、导航守卫、懒加载等核心能力。

---

## 基础配置

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('@/views/Home.vue') },
    { path: '/about', component: () => import('@/views/About.vue') },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  ],
});

export default router;
```

| 路由模式 | 函数                   | URL 样式   | 说明                    |
| -------- | ---------------------- | ---------- | ----------------------- |
| History  | `createWebHistory`     | `/about`   | 需要服务端配置 fallback |
| Hash     | `createWebHashHistory` | `/#/about` | 无需服务端配置          |
| Memory   | `createMemoryHistory`  | -          | SSR / 测试用            |

---

## 动态路由参数

```ts
const routes = [
  // 必选参数
  { path: '/user/:id', component: UserDetail },
  // 可选参数
  { path: '/user/:id?', component: UserDetail },
  // 多个参数
  { path: '/org/:orgId/repo/:repoId', component: Repo },
  // 正则约束
  { path: '/article/:id(\\d+)', component: Article },
];
```

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
console.log(route.params.id); // 访问路由参数
</script>
```

---

## 嵌套路由

```ts
const routes = [
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [
      { path: '', component: DashboardHome }, // /dashboard
      { path: 'analytics', component: Analytics }, // /dashboard/analytics
      { path: 'settings', component: Settings }, // /dashboard/settings
    ],
  },
];
```

```vue
<!-- DashboardLayout.vue -->
<template>
  <aside>侧边栏</aside>
  <main>
    <router-view />
    <!-- 子路由渲染在这里 -->
  </main>
</template>
```

---

## 导航守卫

| 守卫类型           | 触发时机                     | 常见用途           |
| ------------------ | ---------------------------- | ------------------ |
| `beforeEach`       | 每次导航前                   | 登录验证、权限检查 |
| `beforeResolve`    | 导航确认前（异步组件解析后） | 数据预加载         |
| `afterEach`        | 导航完成后                   | 页面标题、埋点统计 |
| `beforeEnter`      | 进入特定路由前（路由配置中） | 单个路由的前置检查 |
| `beforeRouteLeave` | 离开当前路由前（组件内）     | 未保存提示         |

```ts
// 全局前置守卫：登录检查
router.beforeEach((to, from) => {
  const isAuth = useAuthStore().isAuthenticated;

  if (to.meta.requiresAuth && !isAuth) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }
});

// 全局后置钩子：设置页面标题
router.afterEach((to) => {
  document.title = (to.meta.title as string) || '默认标题';
});
```

---

## 路由懒加载

```ts
// 每个路由对应一个 chunk
const routes = [
  {
    path: '/admin',
    component: () => import('@/views/Admin.vue'),
  },
];

// 命名 chunk（打包分组）
const routes = [
  {
    path: '/settings',
    component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue'),
  },
];
```

---

## 编程式导航

```ts
import { useRouter } from 'vue-router';

const router = useRouter();

router.push('/home'); // 字符串路径
router.push({ name: 'User', params: { id: 1 } }); // 命名路由
router.push({ path: '/search', query: { q: 'vue' } }); // 带查询参数

router.replace('/login'); // 替换当前记录，不会留下历史
router.go(-1); // 后退一步
router.back(); // 等价于 router.go(-1)
router.forward(); // 等价于 router.go(1)
```

> 注意：`path` 和 `params` 不能同时使用，带 `params` 时必须用 `name`。

---

## 路由元信息（meta）

```ts
const routes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [{ path: 'users', component: UserList, meta: { title: '用户管理' } }],
  },
];
```

---

## 常见模式：权限路由

```ts
// 登录守卫 + 角色权限
router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // 1. 不需要登录的页面直接放行
  if (!to.meta.requiresAuth) return true;

  // 2. 未登录跳转登录页
  if (!auth.token) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }

  // 3. 检查角色权限
  const requiredRoles = to.meta.roles as string[] | undefined;
  if (requiredRoles && !requiredRoles.includes(auth.user.role)) {
    return { name: 'Forbidden' };
  }
});
```
