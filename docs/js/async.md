# 异步编程

## Event Loop

JS 是单线程的，通过事件循环处理异步：

1. 执行同步代码（调用栈）
2. 执行所有**微任务**（Promise.then、queueMicrotask）
3. 执行一个**宏任务**（setTimeout、setInterval、I/O）
4. 重复 2-3

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');

// 输出顺序：1 → 4 → 3 → 2
// 宏任务：setTimeout
// 微任务：Promise.then（优先级更高）
```

---

## Promise

```js
// 基础用法
fetch('/api/user')
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err))
  .finally(() => console.log('done'));

// 并发
const [user, posts] = await Promise.all([
  fetch('/api/user').then((r) => r.json()),
  fetch('/api/posts').then((r) => r.json()),
]);

// 竞速（第一个完成的）
const result = await Promise.race([fetchA(), fetchB()]);

// 全部结果（不管成功失败）
const results = await Promise.allSettled([fetchA(), fetchB()]);
results.forEach((r) => {
  if (r.status === 'fulfilled') console.log(r.value);
  else console.error(r.reason);
});
```

---

## async / await

```js
async function getUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch user:', err);
    throw err; // 记得重新抛出，否则调用方拿不到错误
  }
}

// 顺序 vs 并发
async function sequential() {
  const a = await fetchA(); // 等 A 完成再请求 B
  const b = await fetchB();
}

async function concurrent() {
  const [a, b] = await Promise.all([fetchA(), fetchB()]); // 同时请求
}
```
