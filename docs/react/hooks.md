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
