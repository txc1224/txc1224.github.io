---
title: 'Pinia 状态管理'
order: 6
---

# Pinia 状态管理

> Pinia 是 Vue 官方推荐的状态管理库，API 简洁、TypeScript 友好、支持 DevTools。

---

## Option Store vs Setup Store

| 特性     | Option Store                  | Setup Store                |
| -------- | ----------------------------- | -------------------------- |
| 风格     | 类似 Options API              | 类似 Composition API       |
| 定义方式 | `{ state, getters, actions }` | `() => { return { ... } }` |
| 灵活性   | 结构固定                      | 更灵活，可使用 composables |
| 适用场景 | 简单 store                    | 复杂逻辑、需要 watchers    |

```ts
// Option Store 风格
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubled: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++;
    },
  },
});
```

```ts
// Setup Store 风格（推荐）
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }

  return { count, doubled, increment };
});
```

---

## State / Getters / Actions

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref('');

  // Getters
  const isLoggedIn = computed(() => !!token.value);
  const displayName = computed(() => user.value?.name ?? '游客');

  // Actions（支持 async）
  async function login(credentials: LoginForm) {
    const res = await api.login(credentials);
    token.value = res.token;
    user.value = res.user;
  }

  function logout() {
    token.value = '';
    user.value = null;
  }

  return { user, token, isLoggedIn, displayName, login, logout };
});
```

---

## Store 间互相引用

```ts
// stores/cart.ts
import { useUserStore } from './user';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);

  const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.qty, 0));

  async function checkout() {
    const userStore = useUserStore(); // 在 action 内部获取
    if (!userStore.isLoggedIn) throw new Error('请先登录');
    await api.createOrder(items.value);
    items.value = [];
  }

  return { items, total, checkout };
});
```

---

## $patch 批量修改

```ts
const store = useUserStore();

// 对象形式：适合简单修改
store.$patch({
  token: 'new-token',
  user: { name: 'Vue', role: 'admin' },
});

// 函数形式：适合数组操作等复杂修改
store.$patch((state) => {
  state.items.push({ id: 1, name: 'item' });
  state.items = state.items.filter((i) => i.active);
});
```

---

## 持久化插件

```ts
// pnpm add pinia-plugin-persistedstate
import piniaPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPersistedstate);

// 在 store 中启用
export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('');
    return { token };
  },
  {
    persist: {
      pick: ['token'], // 只持久化 token
      storage: localStorage, // 默认 localStorage
    },
  },
);
```

---

## Pinia vs Vuex 对比

| 特性       | Pinia              | Vuex 4              |
| ---------- | ------------------ | ------------------- |
| API 风格   | 简洁，无 mutations | mutations + actions |
| TypeScript | 原生友好           | 需要额外类型体操    |
| 模块化     | 每个 Store 独立    | 需要 modules 嵌套   |
| DevTools   | 完整支持           | 完整支持            |
| 体积       | ~1KB               | ~10KB               |
| 维护状态   | Vue 官方推荐       | 维护模式            |

---

## 最佳实践

```ts
// ✅ Store 按业务领域拆分
stores/
  ├── user.ts      // 用户认证
  ├── cart.ts      // 购物车
  ├── product.ts   // 商品
  └── app.ts       // 全局状态（主题、语言）

// ❌ 一个巨大的 store 包含所有状态
stores/
  └── index.ts     // 几百行的 mega store
```

```ts
// ❌ 在组件外直接使用 store（Pinia 未初始化）
const store = useUserStore(); // 可能报错

// ✅ 确保在 app.use(pinia) 之后使用
// 在路由守卫、组件 setup、actions 内部使用
router.beforeEach(() => {
  const store = useUserStore(); // 安全
});
```
