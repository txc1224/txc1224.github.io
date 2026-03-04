---
title: '状态管理'
order: 4
---

# 状态管理

> 从 Context 到 Redux Toolkit、Zustand、Jotai，选对方案比学会 API 更重要。

---

## Context API

```jsx
// 1. 创建 Context
const AuthContext = createContext(null);

// 2. Provider 提供数据
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

// 3. 消费数据
function UserInfo() {
  const { user, logout } = useContext(AuthContext);
  if (!user) return <p>未登录</p>;
  return <button onClick={logout}>{user.name}，退出</button>;
}
```

**Context 适用场景：** 主题、语言、登录态等低频变更的全局数据。

```
// ❌ Context 不适合高频更新（每次 Provider value 变化，所有消费者都会重渲染）
// ✅ 高频更新场景请用 Zustand / Jotai
```

---

## Redux Toolkit

```jsx
// store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    }, // Immer 允许直接修改
    decrement: (state) => {
      state.value -= 1;
    },
    addBy: (state, action) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, addBy } = counterSlice.actions;
export const store = configureStore({ reducer: { counter: counterSlice.reducer } });
```

```jsx
// 组件中使用
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  return (
    <>
      <span>{count}</span>
      <button onClick={() => dispatch(increment())}>+1</button>
      <button onClick={() => dispatch(addBy(10))}>+10</button>
    </>
  );
}
```

---

## Zustand

```jsx
import { create } from 'zustand';

// 极简 store，无 Provider、无 boilerplate
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}));

function Counter() {
  const { count, increment } = useCounterStore();
  return <button onClick={increment}>{count}</button>;
}

// 选择性订阅，避免多余重渲染
const count = useCounterStore((s) => s.count);
```

---

## Jotai

```jsx
import { atom, useAtom } from 'jotai';

// 原子化状态：每个 atom 独立
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2); // 派生 atom

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [doubled] = useAtom(doubledAtom);
  return (
    <>
      <span>
        {count} x2 = {doubled}
      </span>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </>
  );
}
```

---

## 方案对比

| 方案          | 包大小 | 学习成本 | 适用场景               |
| ------------- | ------ | -------- | ---------------------- |
| Context       | 0 KB   | 低       | 主题/语言/登录态       |
| Redux Toolkit | ~11 KB | 中       | 大型应用、团队协作     |
| Zustand       | ~1 KB  | 低       | 中小型应用、快速开发   |
| Jotai         | ~3 KB  | 低       | 原子化状态、细粒度更新 |
| Valtio        | ~3 KB  | 低       | 喜欢 Proxy 风格的团队  |

### 选型建议

```
小项目 / 原型     → useState + Context 足够
中型项目          → Zustand（最佳性价比）
大型团队项目      → Redux Toolkit（规范统一、DevTools 强）
状态间有复杂依赖  → Jotai（原子化天然适合）
```

---

## 数据请求状态：React Query / SWR

| 特性          | React Query (TanStack Query) | SWR                   |
| ------------- | ---------------------------- | --------------------- |
| 缓存          | 自动缓存 + 后台刷新          | 自动缓存 + 后台刷新   |
| 分页/无限滚动 | 内置支持                     | 需手动                |
| Mutation      | 内置 `useMutation`           | 需要 `useSWRMutation` |
| DevTools      | 有                           | 无                    |
| 包大小        | ~13 KB                       | ~4 KB                 |

```jsx
// React Query 示例
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then((r) => r.json()),
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorTip message={error.message} />;
  return data.map((user) => <UserCard key={user.id} user={user} />);
}
```

```jsx
// SWR 示例
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);
  if (isLoading) return <Spinner />;
  if (error) return <ErrorTip />;
  return <p>{data.name}</p>;
}
```
