---
title: '常见陷阱'
order: 8
---

# 常见陷阱

> React 中最常踩的坑，提前知道能省下大量调试时间。

---

## setState 是异步的（批量更新）

```jsx
// ❌ 连续调用，count 只加 1（基于同一个闭包快照）
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
  // 最终 count 只加 1
}

// ✅ 函数式更新，每次基于最新值
function handleClick() {
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
  // 最终 count 加 3
}
```

> React 18 默认对所有事件处理、setTimeout、Promise 回调都进行批量更新。

---

## useEffect 依赖数组陷阱（闭包过期值）

```jsx
// ❌ 闭包捕获了旧的 count 值
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 永远是初始值 0
  }, 1000);
  return () => clearInterval(timer);
}, []); // 空依赖：effect 只执行一次

// ✅ 方案一：添加依赖（每次 count 变化重建 timer）
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count);
  }, 1000);
  return () => clearInterval(timer);
}, [count]);

// ✅ 方案二：使用 ref 保存最新值
const countRef = useRef(count);
countRef.current = count;
useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current); // 始终最新
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

---

## 对象/数组状态更新必须返回新引用

```jsx
// ❌ 直接修改原对象，React 检测不到变化，不会重渲染
const handleUpdate = () => {
  user.name = '新名字';
  setUser(user); // 引用相同，React 认为没变化
};

// ✅ 展开运算符创建新对象
setUser({ ...user, name: '新名字' });

// ✅ 数组：添加/删除/修改都要返回新数组
setItems([...items, newItem]); // 添加
setItems(items.filter((item) => item.id !== targetId)); // 删除
setItems(
  items.map(
    (item) => (item.id === targetId ? { ...item, done: true } : item), // 修改
  ),
);

// ❌ 数组的 push/splice 是原地修改
items.push(newItem);
setItems(items); // 不会触发渲染
```

---

## key 的正确使用

```jsx
// ❌ 用 index 做 key：增删排序时导致渲染错乱、表单值串位
{
  list.map((item, index) => <input key={index} defaultValue={item.name} />);
}

// ✅ 使用唯一稳定的业务 id
{
  list.map((item) => <input key={item.id} defaultValue={item.name} />);
}

// 特殊技巧：用 key 强制重置组件状态
<UserForm key={selectedUserId} userId={selectedUserId} />;
```

---

## useMemo / useCallback 过度使用

```jsx
// ❌ 简单计算不需要 useMemo（缓存本身也有开销）
const label = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
// ✅ 直接计算
const label = `${firstName} ${lastName}`;

// ❌ 传给 DOM 元素的回调不需要 useCallback
<button onClick={useCallback(() => setOpen(true), [])}>打开</button>
// ✅ 直接写
<button onClick={() => setOpen(true)}>打开</button>

// ✅ 适合使用的场景：
// 1. 传给 React.memo 包裹的子组件的回调
// 2. 作为 useEffect 依赖项的函数
// 3. 真正昂贵的计算（排序大数组、复杂过滤）
```

---

## useEffect 中的清理函数

```jsx
// ❌ 忘记清理导致内存泄漏 / 竞态条件
useEffect(() => {
  const subscription = eventBus.subscribe(handler);
  // 组件卸载后 handler 仍然执行 → 内存泄漏
}, []);

// ✅ 返回清理函���
useEffect(() => {
  const subscription = eventBus.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);

// ✅ 防止竞态条件（组件卸载后仍 setState）
useEffect(() => {
  let cancelled = false;
  fetchData().then((data) => {
    if (!cancelled) setData(data);
  });
  return () => {
    cancelled = true;
  };
}, [id]);
```

---

## 条件渲染中的 Hook 顺序

```jsx
// ❌ Hook 在条件语句中调用，违反 Hooks 规则
function Profile({ isLoggedIn }) {
  if (!isLoggedIn) return <Login />;
  const [user, setUser] = useState(null); // 条件执行，破坏调用顺序
}

// ✅ Hook 放在顶部，条件判断在后面
function Profile({ isLoggedIn }) {
  const [user, setUser] = useState(null); // 始终调用
  if (!isLoggedIn) return <Login />;
  return <UserInfo user={user} />;
}
```

---

## forwardRef 使用场景

```jsx
// ❌ 普通组件无法接收 ref
function MyInput(props) {
  return <input {...props} />;
}
const ref = useRef();
<MyInput ref={ref} />; // ⚠️ ref 不会传递到 input

// ✅ forwardRef 转发 ref
const MyInput = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
const ref = useRef();
<MyInput ref={ref} />; // ref 指向内部 input 元素
```

---

## StrictMode 双重渲染

```jsx
// React.StrictMode 在开发模式下会故意双重调用：
// - 组件函数体
// - useState/useReducer 的初始化函数
// - useEffect 的 setup 和 cleanup

// ❌ 误以为是 bug，副作用执行了两次
useEffect(() => {
  console.log('mounted'); // 开发模式打印两次
  return () => console.log('unmounted');
}, []);

// ✅ 这是正常行为，用于检测不纯的副作用
// 生产环境只执行一次
// 如果双重执行导致问题，说明副作用不够"纯净"
```

| 现象               | 原因            | 解决                         |
| ------------------ | --------------- | ---------------------------- |
| effect 执行两次    | StrictMode 检测 | 确保 cleanup 正确            |
| 接口请求两次       | StrictMode      | 开发环境正常，生产只请求一次 |
| 初始化函数执行两次 | StrictMode      | 确保初始化是幂等的           |
