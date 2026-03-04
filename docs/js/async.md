---
title: '异步编程'
order: 3
---

# 异步编程

> JS 单线程通过事件循环处理异步，掌握 Promise + async/await + 并发控制是写好异步代码的关键。

---

## Event Loop 执行顺序

| 阶段        | 任务类型                                               | 示例                |
| ----------- | ------------------------------------------------------ | ------------------- |
| 1. 同步代码 | 调用栈                                                 | `console.log()`     |
| 2. 微任务   | Promise.then / queueMicrotask / MutationObserver       | `.then()` 回调      |
| 3. 宏任务   | setTimeout / setInterval / I/O / requestAnimationFrame | `setTimeout()` 回调 |

> 每轮宏任务结束后，清空所有微任务，再执行下一个宏任务。

```js
console.log('1'); // 同步
setTimeout(() => console.log('2'), 0); // 宏任务
Promise.resolve().then(() => console.log('3')); // 微任务
console.log('4'); // 同步

// 输出顺序：1 → 4 → 3 → 2
```

---

## Promise 核心 API

```js
// 基础链式调用
fetch('/api/user')
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err))
  .finally(() => console.log('done'));
```

### 并发方法对比

| 方法                 | 行为                           | 返回值       | 适用场景               |
| -------------------- | ------------------------------ | ------------ | ---------------------- |
| `Promise.all`        | 全部成功才成功，一个失败就失败 | 结果数组     | 并行请求，全部需要     |
| `Promise.allSettled` | 等待全部完成（不管成功失败）   | 状态数组     | 批量操作，需要所有结果 |
| `Promise.race`       | 第一个完成的（成功或失败）     | 第一个结果   | 超时控制               |
| `Promise.any`        | 第一个成功的                   | 第一个成功值 | 多源取最快             |

```js
// Promise.all：并行请求
const [user, posts] = await Promise.all([
  fetch('/api/user').then((r) => r.json()),
  fetch('/api/posts').then((r) => r.json()),
]);

// Promise.allSettled：批量操作
const results = await Promise.allSettled([fetchA(), fetchB()]);
results.forEach((r) => {
  if (r.status === 'fulfilled') console.log(r.value);
  else console.error(r.reason);
});

// Promise.race：超时控制
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))]);
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
```

### 顺序 vs 并发

```js
// ❌ 顺序执行（慢：A 完成后才请求 B）
async function sequential() {
  const a = await fetchA(); // 3s
  const b = await fetchB(); // 3s
  // 总耗时 6s
}

// ✅ 并发执行（快：同时请求）
async function concurrent() {
  const [a, b] = await Promise.all([fetchA(), fetchB()]);
  // 总耗时 3s
}
```

---

## 并发控制

```js
// 限制并发数量（如批量上传文件）
async function concurrentLimit(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = task().then((r) => {
      executing.delete(p);
      return r;
    });
    executing.add(p);
    results.push(p);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// 使用：最多 3 个并发
const urls = ['/api/1', '/api/2', '/api/3', '/api/4', '/api/5'];
const tasks = urls.map((url) => () => fetch(url).then((r) => r.json()));
await concurrentLimit(tasks, 3);
```

---

## 错误处理模式

```js
// 模式一：try/catch
try {
  const data = await fetchData();
} catch (err) {
  handleError(err);
}

// 模式二：to 函数（避免嵌套 try/catch）
const to = (promise) => promise.then((data) => [null, data]).catch((err) => [err, null]);

const [err, user] = await to(fetchUser(1));
if (err) return handleError(err);
```

---

## 常见陷阱

```js
// ❌ forEach 中使用 await 无效（不会等待）
[1, 2, 3].forEach(async (id) => {
  await fetchUser(id); // 三个请求几乎同时发出
});

// ✅ 使用 for...of 顺序执行
for (const id of [1, 2, 3]) {
  await fetchUser(id);
}

// ✅ 使用 Promise.all 并发执行
await Promise.all([1, 2, 3].map((id) => fetchUser(id)));
```

```js
// ❌ async 函数忘记 await，返回 Promise 而非值
async function getData() {
  return fetch('/api'); // 返回 Promise<Response>，不是 Response
}

// ✅ 记得 await
async function getData() {
  return await fetch('/api'); // 返回 Response
}
```

```js
// ❌ catch 之后链式调用继续执行
fetch('/api')
  .catch((err) => console.error(err)) // 错误被"吃掉"
  .then((data) => console.log(data)); // data 为 undefined，仍然执行

// ✅ catch 中重新抛出
fetch('/api')
  .catch((err) => {
    console.error(err);
    throw err;
  })
  .then((data) => console.log(data)); // 不会执行
```
