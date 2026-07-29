---
title: 'Hooks 详解'
order: 3
---

# Hooks 详解

> Hooks 让函数组件拥有状态和副作用能力。React 18 新增了 `useId`、`useTransition` 等并发特性 Hook。

---

## useState

```jsx
const [count, setCount] = useState(0);

// ✅ 函数式更新（基于前一个状态计算）
setCount((prev) => prev + 1);

// ❌ 直接使用旧值（闭包陷阱，连续调用只生效一次）
setCount(count + 1);

// 惰性初始化（只在首次渲染执行）
const [data, setData] = useState(() => expensiveCompute());
```

---

## useReducer

```jsx
// 适合复杂状态逻辑 / 多个子值 / 下一个状态依赖上一个状态
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      throw new Error('未知 action');
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: 'increment' })}>+1</button>
    </>
  );
}
```

---

## useEffect / useLayoutEffect

| Hook              | 执行时机           | 适用场景             |
| ----------------- | ------------------ | -------------------- |
| `useEffect`       | 渲染后异步执行     | 数据请求、订阅、日志 |
| `useLayoutEffect` | DOM 更新后同步执行 | 测量 DOM、同步动画   |

```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then((res) => res.json())
    .then(setData);

  // ✅ 清理函数：组件卸载或依赖变化时执行
  return () => controller.abort();
}, [userId]); // 依赖数组：userId 变化时重新执行
```

**依赖数组规则：**

| 写法       | 含义              |
| ---------- | ----------------- |
| 无第二参数 | 每次渲染都执行    |
| `[]`       | 仅挂载时执行一次  |
| `[a, b]`   | a 或 b 变化时执行 |

---

## useRef

```jsx
// 1. 访问 DOM 元素
const inputRef = useRef(null);
useEffect(() => {
  inputRef.current.focus();
}, []);

// 2. 保存不触发重渲染的可变值
const timerRef = useRef(null);
timerRef.current = setInterval(() => {}, 1000);
clearInterval(timerRef.current);

// ❌ 不要在渲染期间读写 ref.current（除了初始化）
```

---

## useImperativeHandle

```jsx
// 配合 forwardRef 暴露子组件的方法给父组件
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => {
      inputRef.current.value = '';
    },
  }));
  return <input ref={inputRef} />;
});

// 父组件调用
const ref = useRef();
<FancyInput ref={ref} />;
ref.current.focus();
```

---

## useMemo / useCallback

| Hook          | 缓存对象 | 用途                     |
| ------------- | -------- | ------------------------ |
| `useMemo`     | 计算结果 | 避免重复计算昂贵值       |
| `useCallback` | 函数引用 | 稳定回调避免子组件重渲染 |

```jsx
// useMemo：缓存计算结果
const sortedList = useMemo(() => items.sort((a, b) => a.price - b.price), [items]);

// useCallback：缓存函数引用
const handleClick = useCallback(
  (id) => {
    setSelected(id);
  },
  [], // 无外部依赖
);

// ❌ 不要滥用：简单计算不需要 useMemo
const doubled = useMemo(() => count * 2, [count]); // 过度优化
const doubled = count * 2; // ✅ 直接计算即可
```

---

## useContext

```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext); // 'dark'
  return <button className={theme}>按钮</button>;
}
```

---

## 自定义 Hook 编写规范

| 规则   | 说明                               |
| ------ | ---------------------------------- |
| 命名   | 必须以 `use` 开头                  |
| 组合   | 可以调用其他 Hook                  |
| 返回值 | 通常返回 `[state, actions]` 或对象 |

```jsx
// useDebounce
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// useLocalStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
```

---

## Hooks 规则

```jsx
// ❌ 不要在条件/循环中调用 Hook
if (isLoggedIn) {
  useEffect(() => {}); // 破坏 Hook 调用顺序
}

// ❌ 不要在普通函数中调用 Hook
function helper() {
  const [state] = useState(); // 非组件/非自定义 Hook
}

// ✅ 只在函数组件或自定义 Hook 的顶层调用
function MyComponent() {
  const [state, setState] = useState(0);
  useEffect(() => {}, []);
}
```

---

## React 18 新增 Hooks

```jsx
// useId：生成唯一 id，SSR 安全
function FormField() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>邮箱</label>
      <input id={id} type="email" />
    </>
  );
}

// useTransition：标记低优先级更新，保持 UI 响应
function SearchPage() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    startTransition(() => {
      setQuery(e.target.value); // 低优先级，不阻塞输入
    });
  };
  return isPending ? <Spinner /> : <Results query={query} />;
}

// useSyncExternalStore：订阅外部数据源（库作者使用）
const width = useSyncExternalStore(
  (callback) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  },
  () => window.innerWidth,
);
```

<!-- KNOWLEDGE-IMPORT:START -->

## React Fiber、调度与协调

## TL;DR

> **Fiber** 是 React 16+ 的内部虚拟栈帧结构，把一次大渲染拆成可中断、可恢复、可分优先级的小任务。它支撑了 React 的异步调度、并发渲染、Suspense 和更细粒度的更新控制。

## 背景与动机

早期 React 的协调过程是递归同步执行的:

- 从根组件一路递归到叶子组件
- 中途不能暂停
- 组件树很大时会长时间占用主线程
- 输入、动画、滚动等高优先级交互可能卡顿

Fiber 的目标不是改变 React 写法,而是重写 React 内部执行模型:

- 把递归调用栈改成链表式 Fiber 树
- 每个 Fiber 节点代表一个组件 / DOM 节点 / Fragment 等工作单元
- render 阶段可中断,commit 阶段必须同步完成
- 通过 lane / priority 区分更新优先级

一句话:**Fiber 让 React 从“同步递归渲染器”变成“可调度的 UI 任务系统”。**

## 核心机制

### Fiber 节点是什么

每个 React element 会对应一个 Fiber 节点。Fiber 不是 DOM,也不是普通虚拟 DOM,而是 React 内部的工作单元。

简化结构:

```ts
type Fiber = {
  type: any; // 组件类型或 DOM 标签
  key: null | string;
  stateNode: any; // DOM 节点或组件实例

  return: Fiber | null; // 父节点
  child: Fiber | null; // 第一个子节点
  sibling: Fiber | null; // 下一个兄弟节点

  pendingProps: any;
  memoizedProps: any;
  memoizedState: any;

  alternate: Fiber | null; // 当前树和 workInProgress 树互指
  flags: number; // Placement / Update / Deletion 等副作用标记
  lanes: number; // 本节点上的更新优先级
};
```

Fiber 用 `return / child / sibling` 把树变成可遍历的链表结构,这样 React 可以自己控制“下一步做哪个节点”,而不是依赖 JS 原生递归栈。

### 双缓存 Fiber 树

React 同时维护两棵树:

```text
current tree              workInProgress tree
屏幕上已经提交的树   ←→   正在计算的新树
```

流程:

1. 当前 UI 对应 `current` 树
2. 有更新时,React 基于 current 创建 / 复用 `workInProgress` 树
3. render 阶段在 workInProgress 上计算差异、标记副作用
4. commit 阶段一次性把变更应用到 DOM
5. 提交完成后,current 指针切到新树

这种结构叫双缓存,类似图形渲染里的 back buffer:先在后台算好,再一次性切到前台。

### Render 阶段 vs Commit 阶段

| 阶段                    | 做什么                            | 是否可中断  | 是否操作 DOM  |
| ----------------------- | --------------------------------- | ----------- | ------------- |
| render / reconciliation | 计算新 Fiber 树、diff、打 flags   | ✅ 可中断   | ❌ 不操作 DOM |
| commit                  | 执行 DOM 更新、ref、layout effect | ❌ 不可中断 | ✅ 操作 DOM   |

render 阶段可中断是并发能力的关键。React 可以先处理高优先级更新,低优先级更新稍后继续。

commit 阶段不能中断,因为 DOM 一旦改到一半暂停,用户会看到不一致的 UI。

### Reconciliation 的核心规则

React diff 不做通用树编辑距离算法,而是基于两个假设:

1. 不同类型的元素生成不同子树
2. 开发者用 `key` 提示哪些子节点是稳定身份

例子:

```jsx
// type 从 div 变成 section,整棵子树重建
&lt;div&gt;<Counter />&lt;div&gt;
&lt;section&gt;<Counter />&lt;section&gt;
```

列表 diff:

```jsx
{
  items.map((item) => <TodoItem key={item.id} item={item} />);
}
```

`key` 的作用是给兄弟节点里的元素一个稳定身份。key 错了,React 可能复用错组件实例,导致输入框值、内部 state、动画状态错位。

### Lane:更新优先级模型

React 18 使用 lane 表示更新优先级。可以把 lane 理解成“车道”:不同更新走不同车道,React 按优先级合并和处理。

常见优先级直觉:

- 用户输入、点击:高优先级
- 页面跳转过渡、列表过滤:较低优先级
- 后台数据刷新:更低优先级

`startTransition` 就是把某些更新标成 transition lane:

```tsx
import { startTransition, useState } from 'react';

function SearchBox({ allItems }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  function onChange(e) {
    const value = e.target.value;
    setText(value); // 高优先级:输入框立即更新
    startTransition(() => {
      setQuery(value); // 低优先级:列表过滤可延后
    });
  }

  return <input value={text} onChange={onChange} />;
}
```

这样输入框不会被昂贵列表渲染拖慢。

## 代码示例

### key 决定组件身份

```tsx
function UserList({ users }) {
  return users.map((user) => <UserCard key={user.id} user={user} />);
}
```

不要用 index 当 key:

```tsx
function BadList({ users }) {
  return users.map((user, index) => <UserCard key={index} user={user} />);
}
```

当插入、删除、排序发生时,index key 会让 React 误以为“位置相同就是同一个组件”,从而复用错内部 state。

### 把昂贵更新放进 transition

```tsx
import { startTransition, useMemo, useState } from 'react';

function ProductSearch({ products }) {
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('');

  const visible = useMemo(() => products.filter((p) => p.name.includes(filter)), [products, filter]);

  function handleChange(e) {
    const value = e.target.value;
    setKeyword(value);
    startTransition(() => setFilter(value));
  }

  return <input value={keyword} onChange={handleChange} />;
}
```

## 易错点 / 反例

### 1. 以为 Fiber 会让 DOM 更新也可中断

Fiber 主要让 render 阶段可中断。commit 阶段仍然同步,因为真实 DOM 更新必须保持一致性。

### 2. 把虚拟 DOM 和 Fiber 混为一谈

React element 是你写 JSX 得到的描述对象;Fiber 是 React 内部为了调度和执行维护的工作节点。两者不是同一层东西。

### 3. key 用 index 导致状态错位

```tsx
{
  todos.map((todo, index) => <TodoInput key={index} todo={todo} />);
}
```

如果删除第一项,后面的组件实例会按位置复用,输入框内部状态可能跑到另一个 todo 上。

### 4. 滥用 `startTransition`

不是所有 setState 都应该放进 transition。输入框 value、按钮反馈、hover 状态这类必须立即响应的更新应保持高优先级。

### 5. 以为 render 函数一定只执行一次

并发渲染下,render 阶段可能被中断、重试、丢弃。组件渲染必须保持纯函数,不要在 render 中发请求、改全局变量、操作 DOM。

## 高频面试题(5 题)

- **Q1**: React Fiber 解决了什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  解决早期 React 同步递归渲染不可中断的问题。Fiber 把组件树拆成一个个可遍历的工作单元,使 render 阶段可以暂停、恢复、放弃、按优先级调度,从而避免大更新长时间阻塞主线程。

  &lt;details&gt;

- **Q2**: render 阶段和 commit 阶段有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  render 阶段负责计算 workInProgress Fiber 树、执行 diff、打副作用 flags,不操作 DOM,可中断。commit 阶段负责把 flags 对应的变更应用到真实 DOM,执行 ref 和 effect,不可中断。

  &lt;details&gt;

- **Q3**: Fiber 的双缓存机制是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  React 同时维护 current tree 和 workInProgress tree。current 表示屏幕上已提交的树,workInProgress 是正在计算的新树。render 阶段在 workInProgress 上完成,commit 后把 current 指向新树,实现后台计算、前台一次性提交。

  &lt;details&gt;

- **Q4**: React diff 为什么需要 key?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  key 用来标识同一层兄弟节点的稳定身份。React 根据 type + key 判断是否复用 Fiber / 组件实例。没有稳定 key 或使用 index key 时,插入、删除、排序会导致组件 state 被错误复用。

  &lt;details&gt;

- **Q5**: `startTransition` 的意义是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `startTransition` 把内部更新标记为低优先级 transition update。React 可以优先处理输入、点击等高优先级更新,把昂贵的列表过滤、页面切换等延后,减少交互卡顿。

  &lt;details&gt;

## 延伸资源

- [React: Render and Commit](https://react.dev/learn/render-and-commit)
- [React Legacy: Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [React Reconciler 源码](https://github.com/facebook/react/tree/main/packages/react-reconciler)

## (留白) 我的理解

> 这一段不强制填。

---

## React Hooks 模型、闭包与依赖数组

## TL;DR

> **Hooks** 让函数组件拥有状态、副作用和复用逻辑。它的本质不是“生命周期语法糖”,而是 React 按调用顺序把 hook 状态挂到 Fiber 上;闭包和依赖数组是 Hooks 最核心的理解门槛。

## 背景与动机

Hooks 出现前,React 复杂逻辑主要靠:

- class component 生命周期
- render props
- higher-order components
- mixin 早期方案

这些方式的问题:

- 状态逻辑难复用
- 生命周期里同一业务逻辑被拆散
- HOC / render props 容易形成嵌套地狱
- class 的 `this`、绑定、生命周期心智负担重

Hooks 的目标:

- 用函数组织组件逻辑
- 用 `useXxx` 组合式复用状态逻辑
- 让副作用显式依赖响应式数据
- 让函数组件成为主流组件形态

## 核心机制

### Hooks 状态挂在哪里

函数组件每次 render 都会重新执行函数。局部变量会重新创建,但 hook 状态不会丢,因为状态实际挂在当前组件对应的 Fiber 节点上。

简化理解:

```text
Fiber(App)
  memoizedState → Hook(useState)
                  → Hook(useEffect)
                  → Hook(useMemo)
```

React 靠“调用顺序”匹配每个 hook:

```tsx
function Counter() {
  const [count, setCount] = useState(0); // 第 1 个 hook
  const [name, setName] = useState('A'); // 第 2 个 hook
  useEffect(() => {}, [count]); // 第 3 个 hook
}
```

所以下面写法是错误的:

```tsx
function Bad({ enabled }) {
  if (enabled) {
    useEffect(() => {}, []); // ❌ 条件调用破坏顺序
  }
  const [count] = useState(0);
}
```

这就是 Rules of Hooks 的根因:只能在函数组件或自定义 hook 顶层调用 hook。

### `useState`:状态快照而不是可变变量

React 每次 render 拿到的是一次“状态快照”:

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
  }
}
```

点击后只加 1,因为两次 `count + 1` 里的 `count` 都来自同一次 render 的快照。

需要基于上一次状态更新时,用函数式更新:

```tsx
setCount((c) => c + 1);
setCount((c) => c + 1);
```

### `useEffect`:同步外部系统

`useEffect` 不是“组件挂载后执行代码”的万能入口,它的职责是把 React 状态同步到外部系统:

- DOM 事件监听
- WebSocket
- 定时器
- 第三方库实例
- 手动请求或订阅

基本模型:

```tsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);
```

依赖数组表达的是:**这个 effect 用到了哪些 render 内的响应式值。**

### 闭包陷阱:stale closure

典型错误:

```tsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // 永远是初始 count
    }, 1000);
    return () => clearInterval(id);
  }, []);
}
```

`[]` 表示 effect 只使用初始 render 的闭包,所以 interval 里的 `count` 永远是初始值。

修复方式取决于意图:

```tsx
// 需要读最新 count:把 count 放入依赖
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, [count]);

// 只需要累加:用函数式更新,不依赖外层 count
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

### `useMemo` / `useCallback`

`useMemo` 缓存计算结果:

```tsx
const visibleItems = useMemo(() => items.filter((item) => item.name.includes(keyword)), [items, keyword]);
```

`useCallback` 缓存函数引用:

```tsx
const handleSelect = useCallback(
  (id) => {
    onSelect(id);
  },
  [onSelect],
);
```

不要把它们当默认优化。它们有成本,主要适合:

- 昂贵计算
- 传给 `memo` 子组件的稳定引用
- 作为其他 hook 的依赖避免无意义重跑

### 自定义 Hook

自定义 hook 是复用状态逻辑的函数,必须以 `use` 开头:

```tsx
import { useEffect, useState } from 'react';

export function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return width;
}
```

自定义 hook 不是共享状态。每个组件调用一次,就拥有独立 hook 状态。需要共享状态时用 context、状态库或外部 store。

## 代码示例

### 正确处理请求竞态

```tsx
import { useEffect, useState } from 'react';

function UserCard({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();

    fetch(`/api/users/${userId}`, { signal: ctrl.signal })
      .then((res) => res.json())
      .then(setUser)
      .catch((err) => {
        if (err.name !== 'AbortError') throw err;
      });

    return () => ctrl.abort();
  }, [userId]);

  return &lt;pre&gt;{JSON.stringify(user, null, 2)}&lt;pre&gt;;
}
```

### 函数式更新避免依赖旧快照

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  function addTwo() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }

  return <button onClick={addTwo}>{count}&lt;button&gt;;
}
```

## 易错点 / 反例

### 1. 条件调用 Hook

```tsx
if (isAdmin) {
  useEffect(() => {}, []); // ❌
}
```

hook 顺序必须在每次 render 中一致。条件逻辑应该写进 hook 内部:

```tsx
useEffect(() => {
  if (!isAdmin) return;
}, [isAdmin]);
```

### 2. 依赖数组撒谎

```tsx
useEffect(() => {
  fetchUser(userId);
}, []); // ❌ 实际依赖 userId
```

依赖数组不是“我希望它什么时候跑”,而是“这个 effect 用到了哪些响应式值”。

### 3. 为了消除 lint 警告盲目加空依赖

如果加依赖后无限循环,通常说明 effect 里创建了不稳定对象 / 函数,或者逻辑不该放在 effect 里。不要用 `// eslint-disable-next-line react-hooks/exhaustive-deps` 逃避。

### 4. 滥用 `useMemo` / `useCallback`

普通计算和普通事件函数不一定需要缓存。过度使用会增加依赖维护成本,还可能制造 stale closure。

### 5. 把自定义 Hook 当成单例 store

```tsx
const a = useCounter();
const b = useCounter();
```

这里 a 和 b 是两份独立状态,不是共享状态。

### 6. Strict Mode 下 effect 执行两次误判为 bug

开发环境 Strict Mode 会额外执行 setup + cleanup 一轮,用于发现副作用清理不完整的问题。生产环境不会这样重复,但你的 cleanup 必须正确。

## 高频面试题(5 题)

- **Q1**: 为什么 Hook 不能写在 if / for / 嵌套函数里?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  React 按调用顺序把 hook 状态挂到 Fiber 的 hook 链表上。条件调用会导致不同 render 的 hook 顺序不一致,React 无法知道某个状态对应哪个 hook,从而状态错位。

  &lt;details&gt;

- **Q2**: `useEffect` 的依赖数组到底表示什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  表示 effect 闭包中使用到的所有 render 内响应式值,如 props、state、组件内定义的函数和变量。React 根据依赖是否变化决定是否重新执行 cleanup + setup。它不是生命周期选择器。

  &lt;details&gt;

- **Q3**: 什么是 stale closure?怎么修复?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  stale closure 是 effect / callback 捕获了某次旧 render 的变量,后续状态变化后仍读取旧值。修复方式包括:补齐依赖、使用函数式更新、把可变最新值放进 ref、或把逻辑移到事件处理 / reducer 中。

  &lt;details&gt;

- **Q4**: `useMemo` 和 `useCallback` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `useMemo` 缓存函数执行结果,`useCallback` 缓存函数本身的引用。`useCallback(fn, deps)` 基本等价于 `useMemo(() => fn, deps)`。它们主要用于昂贵计算和稳定引用,不是默认必需。

  &lt;details&gt;

- **Q5**: 自定义 Hook 和普通函数有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  自定义 Hook 是可以调用其他 hook 的函数,名称必须以 `use` 开头,并遵守 Rules of Hooks。它复用的是状态逻辑,不是共享状态;每次调用都有独立 hook 状态链。

  &lt;details&gt;

## 延伸资源

- [React Reference: Hooks](https://react.dev/reference/react)
- [React: useEffect](https://react.dev/reference/react/useEffect)
- [React exhaustive-deps lint](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps)

## (留白) 我的理解

> 这一段不强制填。

---

## React Suspense、并发渲染与 Server Components

## TL;DR

> **Suspense** 是 React 的“等待边界”:子树还没准备好时先显示 fallback。它和 Fiber 并发渲染结合后,支撑了渐进式加载、选择性 hydration、流式 SSR 和 React Server Components。

## 背景与动机

传统 React 页面加载常见问题:

- JS bundle 没加载完 → 整页白屏
- 数据没回来 → 手写 `loading` 状态散落各处
- SSR 一次性生成完整 HTML → 慢数据卡住整页
- hydration 必须整棵树按顺序激活 → 低优先级区域阻塞高优先级交互

React 18 的并发能力和 Suspense 试图解决这些问题:

- UI 可以按边界分块等待
- 低优先级渲染可被高优先级交互打断
- 服务端可以边渲染边流式输出 HTML
- 客户端可以优先 hydration 用户正在交互的区域
- Server Components 可以把部分组件完全放到服务端执行

## 核心机制

### Suspense 边界

基本写法:

```tsx
import { Suspense } from 'react';

function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <Profile />
    &lt;Suspense&gt;
  );
}
```

如果 `Profile` 子树在渲染时“挂起”(suspend),React 会显示 fallback,等它准备好后再切换到真实内容。

常见触发 suspend 的来源:

- `React.lazy` 加载组件代码
- 支持 Suspense 的框架数据请求
- Server Components / streaming SSR 中的异步边界

### `React.lazy`:代码分割入口

```tsx
import { lazy, Suspense } from 'react';

const SettingsPanel = lazy(() => import('./SettingsPanel'));

export function App() {
  return (
    <Suspense fallback={&lt;div&gt;Loading...&lt;div&gt;}>
      <SettingsPanel />
    &lt;Suspense&gt;
  );
}
```

当 chunk 还没加载完时,`SettingsPanel` 会 suspend,最近的 Suspense 边界显示 fallback。

### 并发渲染:可中断的 render

并发渲染不是“多线程渲染”,React 仍然在主线程执行 JS。它的含义是 render 阶段可中断、可放弃、可恢复。

`useTransition` 用于把某些更新标成非紧急:

```tsx
import { useState, useTransition } from 'react';

function SearchPage({ items }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function onChange(e) {
    const value = e.target.value;
    setText(value);
    startTransition(() => setQuery(value));
  }

  const filtered = items.filter((item) => item.name.includes(query));

  return (
    <>
      <input value={text} onChange={onChange} />
      {isPending && &lt;span&gt;更新中...&lt;span&gt;}
      <List items={filtered} />
    </>
  );
}
```

输入框更新保持紧急,列表过滤可以延迟。

### `useDeferredValue`:延迟某个值

```tsx
import { useDeferredValue, useState } from 'react';

function Search({ items }) {
  const [keyword, setKeyword] = useState('');
  const deferredKeyword = useDeferredValue(keyword);

  return (
    <>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      <SlowList keyword={deferredKeyword} items={items} />
    </>
  );
}
```

`useDeferredValue` 让下游慢组件使用滞后的值,避免拖慢输入。

### Streaming SSR

传统 SSR:

```text
服务端等所有数据和组件都准备好 → 一次性返回完整 HTML → 客户端 hydration
```

Streaming SSR:

```text
先返回外壳 HTML
遇到慢组件 Suspense 边界先输出 fallback
慢组件准备好后继续把 HTML 片段流给浏览器
客户端逐步 hydration
```

React 服务端 API 示例:

```ts
import { renderToPipeableStream } from 'react-dom/server';

const stream = renderToPipeableStream(<App />, {
  onShellReady() {
    response.setHeader('content-type', 'text/html');
    stream.pipe(response);
  },
});
```

Suspense 边界是 streaming 的切分点。

### Selective Hydration

在 SSR 页面里,HTML 先出现,但组件事件要等 hydration 后才可交互。

React 18 可以根据 Suspense 边界做选择性 hydration:

- 用户点击某个区域
- React 优先 hydration 该区域
- 其他低优先级区域稍后激活

这让 SSR 页面更快进入“可交互”状态。

### React Server Components(RSC)

RSC 是一种组件模型:部分组件只在服务端运行,不会把它们的 JS 发到浏览器。

Server Component 特点:

- 可直接访问数据库 / 文件系统 / 内部服务
- 不进入客户端 bundle
- 不能使用 `useState` / `useEffect` / 浏览器 API
- 可以渲染 Client Component

Client Component 用 `'use client'` 标记:

```tsx
'use client';

import { useState } from 'react';

export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>Like&lt;button&gt;;
}
```

Server Component 示例:

```tsx
import { LikeButton } from './LikeButton';

export default async function PostPage({ id }) {
  const post = await db.posts.find(id);

  return (
    &lt;article&gt;
      &lt;h1&gt;{post.title}&lt;h1&gt;
      <LikeButton />
    &lt;article&gt;
  );
}
```

RSC 的核心收益:

- 减少客户端 JS
- 数据读取靠近服务端
- 避免一部分 client fetch waterfall
- 和 Suspense / streaming 天然结合

## 代码示例

### 合理拆 Suspense 边界

```tsx
function Dashboard() {
  return (
    <>
      <Header />
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile />
      &lt;Suspense&gt;
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart />
      &lt;Suspense&gt;
    </>
  );
}
```

不要用一个巨大 Suspense 包住整页,否则一个慢组件会让整页都显示 fallback。

### 用 transition 避免隐藏已显示内容

```tsx
function RouterLikePage() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  function selectTab(nextTab) {
    startTransition(() => setTab(nextTab));
  }

  return (
    <>
      <button onClick={() => selectTab('posts')}>Posts&lt;button&gt;
      {isPending && &lt;span&gt;加载中...&lt;span&gt;}
      <Suspense fallback={<BigSpinner />}>
        <TabContent tab={tab} />
      &lt;Suspense&gt;
    </>
  );
}
```

transition 可以让 React 尽量保留旧 UI,等待新 UI 准备好后再切换。

## 易错点 / 反例

### 1. 以为 Suspense 自动支持任意 fetch

裸 `useEffect + fetch` 不会触发 Suspense。Suspense 数据获取通常需要框架支持或特定资源封装。`React.lazy` 是官方稳定支持的代码加载场景。

### 2. Suspense 边界过大

```tsx
<Suspense fallback={<FullPageSpinner />}>
  <EntireApp />
&lt;Suspense&gt;
```

一个小组件慢了就全页 spinner。更好的方式是按页面区块拆多个边界。

### 3. fallback 造成布局跳动

fallback 尺寸和真实内容差太多会造成 CLS。Skeleton 应尽量保持接近真实布局的尺寸。

### 4. 在 Server Component 中使用客户端能力

```tsx
export default function Page() {
  const [count, setCount] = useState(0); // ❌ Server Component 默认不能用
}
```

需要状态和事件时,拆成 `'use client'` 组件。

### 5. 把所有组件都标成 `'use client'`

这会放弃 RSC 的主要收益:减少客户端 JS、服务端直接取数、避免客户端 waterfall。原则是尽量让页面和数据组件保持 server,只把交互叶子节点设为 client。

### 6. 以为 concurrent rendering 等于多线程

React 并发渲染仍在主线程。它是合作式调度:把工作切片,在合适时机让出主线程,而不是浏览器开多个线程同时渲染组件。

## 高频面试题(5 题)

- **Q1**: Suspense 的本质是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Suspense 是 React 的等待边界。当子树渲染时因为代码、数据或服务端流式边界尚未准备好而 suspend,React 显示最近 Suspense 的 fallback,等准备完成后再渲染真实内容。

  &lt;details&gt;

- **Q2**: `useTransition` 和普通 setState 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `useTransition` 把内部更新标记为非紧急 transition。React 可以优先处理输入、点击等紧急更新,并在新 UI 准备好前尽量保留旧 UI。普通 setState 默认按当前事件优先级处理。

  &lt;details&gt;

- **Q3**: Streaming SSR 和传统 SSR 的区别是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  传统 SSR 通常等整页 HTML 准备好后一次性返回。Streaming SSR 可以先发送 shell HTML,慢组件用 Suspense fallback 占位,准备好后继续流式发送 HTML 片段,缩短首屏等待并支持渐进 hydration。

  &lt;details&gt;

- **Q4**: React Server Components 解决什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  RSC 让部分组件只在服务端运行,不进入客户端 bundle,可以直接访问服务端数据源,减少客户端 JS 和 client fetch waterfall。交互逻辑仍放在 `'use client'` 组件中。

  &lt;details&gt;

- **Q5**: Server Component 和 Client Component 怎么划分?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  默认尽量使用 Server Component 承担数据读取、静态展示和组合。需要 `useState`、`useEffect`、事件处理、浏览器 API 的部分拆成 Client Component,用 `'use client'` 标记。边界越靠近交互叶子越好。

  &lt;details&gt;

## 延伸资源

- [React: Suspense](https://react.dev/reference/react/Suspense)
- [React: useTransition](https://react.dev/reference/react/useTransition)
- [React: Server Components](https://react.dev/reference/rsc/server-components)
- [React DOM Server: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
