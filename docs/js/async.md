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

<!-- KNOWLEDGE-IMPORT:START -->

## async / await 本质与并发陷阱

## TL;DR

> `async` 函数永远返回 Promise;`await` 暂停**当前 async 函数**等 Promise settle 后继续 —— 它是 Promise 链的语法糖,不会阻塞主线程。

## 背景与动机

Promise 解决了回调地狱,但 `.then` 链仍有两个不舒服的地方:

1. **变量传递麻烦**:每个 then 是独立闭包,跨 then 共享中间变量要靠提升或嵌套
2. **错误处理仍要 `.catch`**:和同步的 `try-catch` 风格不一致

ES2017 引入 `async / await`,目标是**让异步代码看起来像同步**:

- 用 `try-catch` 接异步错误
- 用 `if / for / while` 写流程控制
- 中间变量像同步代码一样直接命名

但"看起来像同步"是把双刃剑:**容易写成串行,失去并发优势**。掌握 async/await 的关键是理解它"只是语法糖",底层仍是 Promise。

## 核心机制

### `async` 函数的契约

```js
async function f() {
  return v;
} // 等价于 f returns Promise.resolve(v)
async function f() {
  throw e;
} // 等价于 f returns Promise.reject(e)
async function f() {
  return p;
} // 跟随 Promise p 的最终状态
```

- `async` 函数体内**任何 return 值都被自动包装成 Promise**
- 抛出异常 → 返回的 Promise 变 rejected

### `await` 的实际行为

```js
const v = await expr;
```

1. `expr` 被包装成 Promise(`Promise.resolve(expr)`)
2. **当前 async 函数**在此处暂停,把"剩余代码"挂到该 Promise 的 then 链上
3. **主线程立刻让出**,继续跑其他任务(事件循环不停)
4. Promise fulfilled → `v` 是 fulfilled value,继续执行
5. Promise rejected → 等价于在该位置 `throw reason`,可被 try-catch 接住

> 关键认知:`await` **不阻塞主线程**,只暂停当前 async 函数的执行。

### 与 generator 的关系(规范层)

V8 等引擎用"generator + 自动驱动"实现 async/await:

```js
// async function f() { const x = await p; return x + 1; }
// 大致等价于:
function f() {
  return spawn(function* () {
    const x = yield p;
    return x + 1;
  });
}
// spawn 内部反复 .next + .then 推进
```

理解这点能解释:**await 处一定会出现一次微任务调度**(即便 await 的是同步值)。

## 代码示例

```js
// 1. 基础用法
async function loadUser() {
  const res = await fetch('/api/me');
  if (!res.ok) throw new Error('not ok');
  const user = await res.json();
  return user;
}

// 2. 并行而不是串行(关键!)
// ❌ 串行,总耗时 = T1 + T2
async function loadAllSlow() {
  const a = await fetch('/a');
  const b = await fetch('/b');
  return [a, b];
}

// ✅ 并行,总耗时 ≈ max(T1, T2)
async function loadAllFast() {
  const [a, b] = await Promise.all([fetch('/a'), fetch('/b')]);
  return [a, b];
}

// ✅ 等价写法:先创建,后 await
async function loadAllFast2() {
  const pa = fetch('/a');
  const pb = fetch('/b');
  return [await pa, await pb]; // 创建已经发出去了,await 只是收结果
}
```

## 易错点 / 反例

### 1. `forEach` 里 `await` 不串行(经典坑)

```js
const urls = ['/a', '/b', '/c'];

// ❌ forEach 不等回调
urls.forEach(async (u) => {
  const res = await fetch(u);
  console.log(res);
});
// 三个 fetch 同时发出,forEach 早就返回了
// 想"按顺序"或"等所有完成"都做不到

// ✅ 串行用 for-of
for (const u of urls) {
  const res = await fetch(u);
  console.log(res);
}

// ✅ 并行用 Promise.all
const results = await Promise.all(urls.map((u) => fetch(u)));
```

**根因**: `Array.prototype.forEach` 不识别 Promise,回调返回什么都被丢弃。`map` 同理 —— 但 `Promise.all + map` 是有意义的组合。

### 2. 想并行写成了串行(性能 bug)

```js
// ❌ 这是串行,T1 + T2
const a = await fetch('/a');
const b = await fetch('/b');

// ✅ 改并行
const [a, b] = await Promise.all([fetch('/a'), fetch('/b')]);
```

注意:**只有"两个请求互不依赖"时**才能并行;b 依赖 a 的结果时仍要串行。

### 3. async 函数里漏写 `await`,得到 Promise

```js
async function loadJson(url) {
  const res = fetch(url); // ❌ 漏 await
  return res.json(); // TypeError: res.json is not a function
}

// 修复:加 await
async function loadJson(url) {
  const res = await fetch(url);
  return res.json(); // res.json() 返回 Promise,async 函数会自动等(其实可以不写 await)
}
```

追问:为什么 `return res.json()` 不需要 `await`?因为 async 函数 return Promise 时会"跟随"它的状态,**等不等都一样**。但写 `return await` 会让 try-catch 在本函数里就能接住该 Promise 的 reject(否则会冒到调用方),debug 更友好。

### 4. 没 try-catch 也没调用方 `.catch` → unhandledrejection

```js
async function risky() {
  await fetch('/might-fail'); // 失败时 throw
}
risky(); // ❌ 调用方没接,触发 unhandledrejection
```

**修复**:

- 在 risky 内部 `try { await ... } catch { ... }`,或
- 调用方 `risky().catch(handle)`,或
- 全局 `window.addEventListener('unhandledrejection', ...)` 兜底上报

### 5. await 默认会引入一次微任务调度

```js
async function f() {
  console.log('a');
  await 1; // 即使 await 同步值
  console.log('b'); // 进入微任务后才执行
}
f();
console.log('c');
// 输出顺序: a, c, b
```

对性能敏感的同步路径上,**别滥用 async/await**;真不需要异步语义就直接同步写。

## 高频面试题(5 题)

- **Q1**: `async` 函数的返回值类型?以及它和普通函数有什么本质区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `async` 函数永远返回 Promise:

  - return v → `Promise.resolve(v)`
  - throw e → `Promise.reject(e)`
  - return p(Promise) → 跟随 p 的状态

  本质上是"语法糖":编译/解释器把函数体包装成自动驱动的 generator + Promise。这让函数体里能用 `await` 暂停 + 用 try-catch 接异步错误。

  &lt;details&gt;

- **Q2**: `await` 会阻塞主线程吗?它实际做了什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **不阻塞主线程**。`await` 只暂停当前 async 函数:把"剩余代码"挂到右侧 Promise 的 then 链上,主线程立即让出,事件循环继续处理其他任务。Promise settle 后,剩余代码以微任务形式恢复执行。

  &lt;details&gt;

- **Q3**: 怎么把多个 `await` 从串行改成并行?有几种写法?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Promise.all**:`const [a, b] = await Promise.all([fetch('/a'), fetch('/b')])`
  - **先创建后 await**:`const pa = fetch('/a'); const pb = fetch('/b'); const a = await pa; const b = await pb;` —— 两个请求已经并发发出
  - **Promise.allSettled / any / race**:按容错需求选

  前提:任务之间不存在数据依赖。

  &lt;details&gt;

- **Q4**: `forEach` 里 `await` 为什么不会串行?正确写法是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `forEach` 不识别 Promise,内部就是 `for(let i=0; i<arr.length; i++) callback(arr[i])`,callback 返回什么都被丢弃。结果是:三个回调同时被调用,各自返回的 Promise 没人等。

  - 想串行 → `for-of` 或 `for` 循环
  - 想并发 → `Promise.all(arr.map(asyncFn))`

  &lt;details&gt;

- **Q5**: async/await 和 generator 是什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  规范层面 async 函数可以视为"自动驱动的 generator + Promise":

  - generator 用 `yield` 暂停,需要外部不断 `.next()` 推进
  - async/await 把"等 Promise 后调用 .next()" 这个动作内置了,开发者不再自己驱动

  V8 早期实现就是用了 generator,后期做了字节码层面的优化,但语义不变。这一点能解释为什么 await 即使等同步值也会有一次微任务调度 —— 等价于 generator 让出后再被 next。

  &lt;details&gt;

## 延伸资源

- [MDN: async function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: await](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/await)
- [ECMA-262: Async Function Definitions](https://tc39.es/ecma262/#sec-async-function-definitions)

## (留白) 我的理解

> 这一段不强制填。

---

## 异步并发控制(限流 / 取消 / 超时)

## TL;DR

> `Promise.all` 默认无限制并发,生产环境必须**限流 + 取消 + 超时**。`AbortController` 是 Web 标准的统一取消信号,`AbortSignal.timeout` / `AbortSignal.any` 把超时和组合也内置了。

## 背景与动机

`Promise.all([...arr.map(fetch)])` 在玩具代码里很爽,在真实项目里是隐患:

- **打爆服务**:1000 条数据并发 fetch,后端瞬时 QPS 飙升,触发限流甚至熔断
- **占满连接池**:浏览器对单 origin 的并发连接数有上限(常见 6),其他请求排队
- **耗尽内存**:每个 in-flight 请求都占用 Promise + Response + 解码缓冲
- **失败时资源泄漏**:`Promise.all` 一拒,其他请求仍在跑,白白消耗带宽

而且 Promise 本身**没有 cancel 语义** —— 一旦发出去就只能等它 settle。生产代码必须靠 `AbortController` 把"取消"显式建模成可传递的信号。

掌握这一组工具(限流 + AbortController + 超时)是从"能跑通"到"能上线"的分水岭。

## 核心机制

### 限流(并发数控制)的本质 —— 池模式

保持"in-flight 任务数 ≤ N",有空位就启动下一个:

```
任务队列(M 个):  [T1] [T2] [T3] [T4] [T5] [T6] [T7] [T8]
                  │    │    │
                  ▼    ▼    ▼
活跃槽(N=3): ┌─────┬─────┬─────┐
              │ T1  │ T2  │ T3  │  ← 任一完成,从队列拉下一个补位
              └─────┴─────┴─────┘
```

社区标准实现是 [`p-limit`](https://github.com/sindresorhus/p-limit),核心 ~30 行,内部就是上面的池模式。

### AbortController / AbortSignal —— 标准取消机制

- `AbortController`:可"按下"取消按钮的发射器,持有 `.signal` 和 `.abort(reason?)` 方法
- `AbortSignal`:可被多处订阅的"信号对象",有 `.aborted`、`.reason`、`.addEventListener('abort', ...)`
- 接受 `signal` 的 API(fetch、setTimeout、Worker、自定义函数)在 abort 后**主动 reject**为 `AbortError` 或 `signal.reason`
- 一个 controller 只能 `.abort()` 一次,**复用要重新创建**

### `AbortSignal.timeout(ms)` —— 内置超时信号

旧写法要手写 `setTimeout + ctrl.abort()`,新 API 一行搞定:

```js
fetch('/x', { signal: AbortSignal.timeout(5000) });
// 5 秒后自动 abort,抛 TimeoutError
```

浏览器自 2022/2023 起默认支持,Node 17.3+ 内置。

### `AbortSignal.any([s1, s2])` —— 信号组合

把多个信号合并为"任一触发即取消"。典型用法:把"用户主动取消"和"超时"合成一个信号传下去:

```js
const userSignal = userCtrl.signal;
const timeoutSignal = AbortSignal.timeout(5000);
const combined = AbortSignal.any([userSignal, timeoutSignal]);
fetch('/x', { signal: combined });
```

## 代码示例

### 1. 手写并发限流(池模式,~25 行)

```js
async function pLimit(limit, tasks) {
  const results = new Array(tasks.length);
  let nextIndex = 0;
  let active = 0;

  return new Promise((resolve, reject) => {
    const launchNext = () => {
      if (nextIndex >= tasks.length && active === 0) return resolve(results);
      while (active < limit && nextIndex < tasks.length) {
        const i = nextIndex++;
        active++;
        Promise.resolve()
          .then(() => tasks[i]())
          .then(
            (v) => {
              results[i] = v;
            },
            (e) => reject(e), // 简化:首个错误就整体 reject
          )
          .finally(() => {
            active--;
            launchNext();
          });
      }
    };
    launchNext();
  });
}

// 用法
await pLimit(
  3,
  urls.map((u) => () => fetch(u).then((r) => r.json())),
);
```

### 2. AbortController 取消 fetch

```js
const ctrl = new AbortController();

const p = fetch('/big-file', { signal: ctrl.signal })
  .then((r) => r.text())
  .catch((e) => {
    if (e.name === 'AbortError') return null; // 主动取消的正常路径
    throw e;
  });

setTimeout(() => ctrl.abort('user navigated away'), 100);
```

### 3. 超时 + 用户取消组合

```js
async function loadWithTimeout(url, ms, userSignal) {
  const signal = AbortSignal.any([AbortSignal.timeout(ms), userSignal]);
  return fetch(url, { signal }).then((r) => r.json());
}

const userCtrl = new AbortController();
loadWithTimeout('/x', 5000, userCtrl.signal).catch((e) => {
  if (e.name === 'TimeoutError') return retry();
  if (e.name === 'AbortError') return null;
  throw e;
});
```

### 4. Promise.all 失败时取消其余请求

```js
async function allOrCancel(urls) {
  const ctrl = new AbortController();
  const tasks = urls.map((u) => fetch(u, { signal: ctrl.signal }));
  try {
    return await Promise.all(tasks);
  } catch (e) {
    ctrl.abort(); // ✅ 主动取消其他 in-flight 请求,避免资源泄漏
    throw e;
  }
}
```

## 易错点 / 反例

### 1. 用 setTimeout 做"超时",但底层请求继续跑

```js
// ❌ 这只是让 Promise 早 reject,fetch 仍然在后台传输
function timeout(p, ms) {
  return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
}
await timeout(fetch('/big-file'), 1000);
// fetch 还在下载剩下的 100MB,占带宽 + 耗内存
```

**修复**: 用 `AbortSignal.timeout(1000)` 真正取消传输,而不是只忽略结果。

### 2. AbortController 复用 → 第二次根本不生效

```js
const ctrl = new AbortController();

ctrl.abort();
fetch('/a', { signal: ctrl.signal }); // ❌ signal 已经 aborted,fetch 立刻 reject
fetch('/b', { signal: ctrl.signal }); // 同上
```

**规则**: 一个 controller 是一次性的,abort 后必须**重新 new**。

### 3. 限流写错把"任务"当"Promise"传进去

```js
// ❌ 这样不是限流!Promise 已经发出去了
const tasks = urls.map((u) => fetch(u));
await pLimit(3, tasks);

// ✅ 传"工厂函数",由限流器决定何时启动
const tasks = urls.map((u) => () => fetch(u));
await pLimit(3, tasks);
```

**根因**: Promise 是"已经在跑"的任务,限流器接到时已经晚了。要传"如何启动任务"的函数,让限流器掌握启动时机。

### 4. AbortError 被当成"真错误"上报

```js
fetch('/x', { signal: ctrl.signal }).catch((e) => {
  reportToSentry(e); // ❌ 用户主动取消也被报警
});

// ✅ 区分对待
fetch('/x', { signal: ctrl.signal }).catch((e) => {
  if (e.name === 'AbortError') return; // 取消是正常路径,不上报
  reportToSentry(e);
});
```

### 5. `Promise.race` 永远等不到的"漏 settle"任务

```js
await Promise.race([
  fetch('/a'),
  new Promise(() => {}), // ❌ 永远 pending,内存泄漏
]);
```

即便 race 结果已经定了,**漏 settle 的 Promise 仍占内存**直到进程退出。务必让所有参赛 Promise 都有终态(配合 AbortController)。

## 高频面试题(5 题)

- **Q1**: `Promise.all([...arr.map(fetch)])` 在生产环境有什么风险?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 无并发限制 → 打爆下游服务 / 占满连接池 / 耗尽内存
  - 任一失败时其他 Promise 不会取消,白白消耗带宽
  - 没有超时机制 → 个别慢请求拖死整体

  生产做法:**限流 + 取消 + 超时**三件套,典型用 `p-limit` + `AbortController` + `AbortSignal.timeout` 组合。

  &lt;details&gt;

- **Q2**: 现场写一个并发限流器(限制最多 N 个 in-flight)。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  核心思路 —— 池模式:

  1. 维护"活跃数 active" 和"下一个待启动索引 nextIndex"
  2. 每次启动时 active++,每完成一个 active--
  3. 完成回调里递归触发 launchNext,补位直到队列空且 active 为 0

  关键点:

  - 任务必须以"工厂函数"形式传入,而不是已经发出的 Promise
  - 用 `Promise.resolve().then(() => task())` 启动,保持微任务边界一致
  - 错误处理策略:首错即停 vs 收集所有错误再返回(看业务)

  代码见示例 1。

  &lt;details&gt;

- **Q3**: AbortController 是怎么工作的?和"用 boolean 做取消标志位"有什么本质差别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  AbortController 持有 `signal` 对象,signal 是**事件目标**(EventTarget):

  - 接受 signal 的 API 在内部 `addEventListener('abort', ...)`,abort 时主动 reject
  - signal 可同时传给任意多消费者,abort 一次全员通知

  和布尔标志的差异:

  - **可传递**:可以跨函数、跨组件传 signal,无需轮询
  - **可订阅**:基于事件,fetch / setTimeout 等原生 API 直接支持
  - **可组合**:`AbortSignal.any([...])` 把多个信号合并
  - **不可逆**:一次性,语义清晰

  &lt;details&gt;

- **Q4**: `setTimeout + Promise.race` 实现的"超时"和 `AbortSignal.timeout` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `Promise.race` 方案只让上层 Promise 早 reject,**底层请求/任务并不会停**,继续占资源
  - `AbortSignal.timeout` 通过 signal 真正通知 fetch / setTimeout / Worker 等 API 取消传输,资源被回收

  生产代码用前者属于资源泄漏,该用后者。

  &lt;details&gt;

- **Q5**: `AbortSignal.timeout` 和 `AbortSignal.any` 各解决什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **`AbortSignal.timeout(ms)`**:返回一个 ms 毫秒后自动 abort 的 signal,省去手写 `new AbortController + setTimeout + ctrl.abort` 的样板
  - **`AbortSignal.any([s1, s2, ...])`**:把多个 signal 合成"任一触发即 abort"的新 signal。典型场景:把"用户主动取消"和"超时"合并成一个信号传下去,被取消方不需要关心是哪个原因触发

  两者都是 2022/2023 年成为 Baseline 的现代 API,Node 17.3+ / 主流浏览器都支持。

  &lt;details&gt;

## 延伸资源

- [MDN: AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [MDN: AbortSignal](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortSignal)
- [p-limit 源码](https://github.com/sindresorhus/p-limit)(社区限流标准实现)

## (留白) 我的理解

> 这一段不强制填。

---

## 异步错误处理(.catch / try-await / unhandledrejection)

## TL;DR

> Promise 链用 `.catch` 兜尾;`async/await` 用 `try-catch` 自然包住 `await`;漏接的 rejection 会触发 `unhandledrejection`(浏览器)或 `unhandledRejection`(Node)。

## 背景与动机

异步代码的错误传播路径不像同步那样自然。常见的"看起来对、其实漏接"的写法:

- `.then(fn1, fn2)` 把 fn2 当 catch,但接不住 fn1 的错
- async 函数没 try-catch + 调用方也没 .catch → 错误悄悄消失
- `Promise.all` 一个失败,其他还在跑,资源泄漏
- catch 之后没 throw 也没 return,流程继续走,看起来正常实则带 bug

掌握"错误怎么走链"和"全局兜底机制",是写可观测、可上线的异步代码的底线。

## 核心机制

### Promise 链:错误向后冒泡

```
P1 ──reject(e)──► .then(fn) ──skip──► .then(fn) ──skip──► .catch(handler) ──返回 v──► .then(fn2) ✓
                                                                   │
                                                          ↳ catch 后链恢复 fulfilled
```

- 任意一环 `reject` 或 `throw`,后续 `.then(fn)` 都被跳过(因为 fn 只接 fulfilled)
- 直到遇到 `.catch(handler)` 或 `.then(undefined, handler)` 才被处理
- handler 正常返回 → 后续链恢复 fulfilled,继续往下走

### `async/await`:用 `try-catch` 包 `await`

```js
async function f() {
  try {
    const v = await mayFail();
    use(v);
  } catch (e) {
    handle(e);
  } finally {
    cleanup();
  }
}
```

- `await` 处的 rejection 等价于在该位置 `throw`
- try-catch 接住后,函数继续按"恢复"路径走
- finally 里**别 await 长任务**(会延迟 try-catch 之外的代码)

### `finally`:清理逻辑

两种写法等价:

```js
p.then(onF, onR).finally(cleanup);
// vs
p.finally(cleanup).then(onF, onR); // ⚠ 顺序不同!
```

**注意**: `finally` 不接收 value/reason,**透传**前面的状态;但若 finally 内抛错,新的 rejection 会**覆盖**原状态。

### `unhandledrejection` —— 最后兜底

- **浏览器**:`window.addEventListener('unhandledrejection', handler)`
- **Node**:`process.on('unhandledRejection', handler)`(注意大小写)
- 触发时机:Promise rejected 后**当前 microtask 周期结束仍没人接** → 派发该事件
- 默认行为:浏览器在 Console 输出 `Uncaught (in promise)`;Node 22+ 默认让进程崩溃
- 千万不要把它当正常错误通道,**它是兜底报警**:让监控/上报抓到漏接的错误,而不是替代 try-catch

## 代码示例

```js
// 1. async 函数标准错误处理
async function loadUser() {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) throw new HttpError(res.status);
    return await res.json();
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) {
      redirectLogin();
      return null;
    }
    throw e; // 未知错误向上抛
  } finally {
    hideSpinner();
  }
}

// 2. 全局兜底(应用入口)
window.addEventListener('unhandledrejection', (event) => {
  console.error('unhandled', event.reason);
  reportToSentry(event.reason);
  event.preventDefault(); // 阻止浏览器默认在 Console 报红
});
```

## 易错点 / 反例

### 1. `.then(fn1, fn2)` 接不住 fn1 抛的错

```js
fetch('/a').then(
  (res) => {
    throw new Error('parse fail');
  }, // 这里抛
  (e) => console.log('caught?', e), // ❌ 接不到
);

// ✅ 改成 .then().catch()
fetch('/a')
  .then((res) => {
    throw new Error('parse fail');
  })
  .catch((e) => console.log('caught', e));
```

### 2. async 函数没 try-catch + 调用方没 .catch

```js
async function risky() {
  await fetch('/x');                  // 可能 reject
}
risky();                              // ❌ 触发 unhandledrejection

// ✅ 任意一种
risky().catch(console.error);
// 或
async function safe() { try { await risky(); } catch (e) { ... } }
```

工程上推荐:**任何顶层调用 async 函数时都要 `.catch` 收尾**,把异步当同步写时容易漏。

### 3. `await` 在 try 外面,catch 接不住

```js
async function bug() {
  const p = mayFail(); // p 已经在排队 reject
  try {
    return p.value; // ❌ 这是同步访问,不会等 reject
  } catch {}
  await p; // 这里才 await,但 try 已经过了
}
```

**修复**: `try { return await mayFail(); } catch (e) { ... }`,把 `await` 写在 try 内。

### 4. catch 之后既不 return 也不 throw,错误被吞、流程继续

```js
async function process(data) {
  try {
    await validate(data);
  } catch (e) {
    console.error(e); // ❌ 错误"看起来"已处理
  }
  await save(data); // 但接着还是往下走,save 一个无效数据
}

// ✅ 显式决定:要么 throw 终止,要么 return 跳出,要么按降级路径
async function process(data) {
  try {
    await validate(data);
  } catch (e) {
    reportInvalid(data, e);
    return; // 终止当前流程
  }
  await save(data);
}
```

这条是真实项目里**最隐蔽**的异步 bug 之一:看 log 没异常,但产生了脏数据。

### 5. `Promise.all` 一个失败,其他还在跑

```js
const ctrl = new AbortController();
const tasks = urls.map((u) => fetch(u, { signal: ctrl.signal }));

try {
  await Promise.all(tasks);
} catch (e) {
  ctrl.abort(); // ✅ 主动取消其他 in-flight 请求
  throw e;
}
```

默认 `Promise.all` 拒绝时不会取消其他 Promise,需要配合 `AbortController` 显式取消。

## 高频面试题(5 题)

- **Q1**: `.then(fn1, fn2)` 和 `.then(fn1).catch(fn2)` 在错误处理上有什么本质区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `.then(fn1, fn2)` 是同一个 then 调用的两个分支:fn1 接 fulfilled,fn2 接 rejected,**fn1 抛出的错 fn2 接不到**
  - `.then(fn1).catch(fn2)` 中 catch 是对前面整段(包括 fn1)的兜底,**fn1 抛错或返回 rejected Promise 都能被接住**

  工程上统一用第二种,错误处理更可预期。

  &lt;details&gt;

- **Q2**: async 函数应该怎么处理错误?有哪几种正确姿势?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 函数内部:`try { await ... } catch (e) { ... } finally { ... }`
  - 函数外部:`asyncFn().catch(handler)`
  - 全局兜底:`unhandledrejection` 事件 / `process.on('unhandledRejection')`

  原则:**离错误最近的层做最具体的处理,无法处理的向上抛,顶层 catch 兜底,全局监听做监控**。

  &lt;details&gt;

- **Q3**: `unhandledrejection` 什么时候触发?能用它替代 try-catch 吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Promise rejected 后,当前 microtask 周期结束时仍没有 `.catch` / `try-catch` 接住,就触发该事件。**不能替代 try-catch**,它是"兜底报警"用于监控、上报、防进程崩溃,而不是正常的错误处理通道。

  Node 22+ 默认会让进程崩溃,生产环境必须显式监听并上报。

  &lt;details&gt;

- **Q4**: 为什么 catch 之后再 .then() 还能继续执行?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `.catch(handler)` 等价于 `.then(undefined, handler)`,它返回的**新 Promise** 会按 handler 的返回值/抛出决定状态:

  - handler 正常返回值 → 新 Promise fulfilled,后续 .then 是"恢复"路径,正常跑
  - handler 抛错或返回 rejected Promise → 新 Promise rejected,继续向后冒泡

  这就是为什么 catch 既能"消化"错误,也能"重新抛出"。

  &lt;details&gt;

- **Q5**: `Promise.all` 一个失败时,其他 Promise 怎么取消?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `Promise.all` 不会自动取消其他 Promise(Promise 本身没有 cancel 语义)。工程做法:

  - 用 `AbortController` 在 catch 里主动 `.abort()`,fetch / setTimeout / 自定义任务都支持读 signal
  - 或改用 `Promise.allSettled` 显式接受"部分失败"
  - 必要时用 `p-limit` / `p-queue` 等库做带取消的并发控制

  详见 `js-async-concurrency`。

  &lt;details&gt;

## 延伸资源

- [MDN: Promise.prototype.catch](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch)
- [MDN: unhandledrejection event](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/unhandledrejection_event)
- [Node.js: unhandledRejection](https://nodejs.org/api/process.html#event-unhandledrejection)

## (留白) 我的理解

> 这一段不强制填。

---

## Promise 三态、链式与静态方法

## TL;DR

> Promise 是异步操作的状态机:`pending → fulfilled / rejected`(单向、不可逆);`then` 链每次返回**新** Promise,静态方法负责组合并发。

## 背景与动机

ES6 之前异步靠回调函数,典型问题:

- **回调地狱**:嵌套深、可读性差(右漂移)
- **错误处理割裂**:每个回调都要 `if (err)` 自查,主逻辑被淹没
- **控制流难写**:并发、串行、超时、重试都得自己拼

```js
// 回调时代的典型样子(Node.js fs)
fs.readFile('a.txt', (err, a) => {
  if (err) return done(err);
  fs.readFile('b.txt', (err, b) => {
    if (err) return done(err);
    fs.writeFile('c.txt', a + b, (err) => {
      if (err) return done(err);
      done(null);
    });
  });
});
```

ES6 把社区方案(jQuery Deferred / Q / Bluebird)抽象成 [Promises/A+](https://promisesaplus.com/) 规范,纳入语言标准。Promise 的核心价值:

- **状态机语义**:把"还没完成 / 完成了 / 失败了"形式化为三个状态
- **链式调用**:用 `.then` 把"下一步"串起来,代码线性
- **错误冒泡**:错误沿链向后传,直到被 `.catch` 接住,**不会被悄悄吞掉**(只要你接了)
- **可组合**:用静态方法做并发、竞速、容错

Promise 是后续 `async/await`、`for-await-of`、`AbortController`、`top-level await` 等异步特性的**地基**。

## 核心机制

### 三态(状态一旦确定不可变)

```
            ┌────► fulfilled (with value)
pending ────┤
            └────► rejected  (with reason)
```

- 状态只能从 `pending` 单向迁移到 `fulfilled` 或 `rejected`
- 一旦 settled(fulfilled / rejected 统称),状态和值都不可改变
- **executor 抛出的同步错误**自动等价于 `reject(err)`

### `.then(onFulfilled, onRejected)` 永远返回新 Promise

- 回调返回**普通值** → 新 Promise fulfilled with that value
- 回调返回**Promise** → 新 Promise 跟随它的最终状态
- 回调**抛出异常** → 新 Promise rejected with that error
- 不传回调或传非函数 → 状态和值"穿透"传到下一个

```
原 Promise ─resolve(v)─► .then(fn) ─返回 v'─► 新 Promise (fulfilled v')
                                  ─返回 P──► 新 Promise (跟随 P)
                                  ─throw e─► 新 Promise (rejected e)
```

### `.catch` / `.finally`

- `.catch(fn)` 等价于 `.then(undefined, fn)`,只接 rejection
- `.finally(fn)` **不接**收 value/reason,无论成功失败都执行,常用于清理(关 loading、关连接)
- `.finally` 抛错 / 返回 rejected Promise 会让最终结果变成 rejected;否则**透传**前面的状态

### 微任务 vs 宏任务

- `Promise.then / catch / finally` 的回调进入**微任务队列**(microtask)
- 微任务在每次宏任务结束后、渲染前**清空整个队列**才让出
- 这就是为什么 `setTimeout(..., 0)` 比 `Promise.resolve().then(...)` 晚执行

### 静态组合方法对比

| 方法                 | 语义                      | 全部成功                         | 任一失败                      | 全部失败                |
| -------------------- | ------------------------- | -------------------------------- | ----------------------------- | ----------------------- |
| `Promise.all`        | 全成才成,任一失败立刻失败 | resolve [v1,v2,…]                | 立刻 reject 第一个 reason     | reject 第一个 reason    |
| `Promise.allSettled` | 等所有 settled            | resolve [{status,value/reason}…] | (不会"失败")                  | resolve 数组            |
| `Promise.race`       | 第一个 settled 决定       | 第一个 settle 是成功就 resolve   | 第一个 settle 是失败就 reject | 同左                    |
| `Promise.any`        | 第一个 fulfilled 决定     | resolve 第一个 value             | 仍等其他                      | reject `AggregateError` |

## 代码示例

```js
// 1. 把回调地狱重写为线性链
function loadConfig() {
  return fetch('/config.json')
    .then((res) => res.json())
    .then((cfg) => fetch(cfg.userUrl))
    .then((res) => res.json())
    .then((user) => ({ ...user, loaded: Date.now() }))
    .catch((err) => {
      console.error('load failed', err);
      return { fallback: true };
    })
    .finally(() => console.log('done'));
}

// 2. 静态方法
const p1 = Promise.resolve(1);
const p2 = new Promise((r) => setTimeout(() => r(2), 100));
const p3 = Promise.reject(new Error('boom'));

await Promise.all([p1, p2]); // [1, 2]
await Promise.allSettled([p1, p3]); // [{status:'fulfilled',value:1}, {status:'rejected',reason:Error}]
await Promise.race([p1, p2]); // 1 (p1 已经 fulfilled)
await Promise.any([p3, p2]); // 2 (跳过 reject,等到 fulfilled)
```

## 易错点 / 反例

### 1. `.then` 里忘记 return,链断裂

```js
fetch('/a')
  .then((res) => {
    res.json().then((data) => console.log(data)); // ❌ 没 return
  })
  .then((data) => console.log(data)); // 永远是 undefined

// ✅ 修复
fetch('/a')
  .then((res) => res.json()) // return
  .then((data) => console.log(data));
```

### 2. `.then(fn1, fn2)` 形式:fn1 抛错时 fn2 接不住

```js
Promise.resolve(1).then(
  (v) => {
    throw new Error('boom');
  }, // 这里抛
  (e) => console.log('caught?', e), // ❌ 接不到
);
// 同一 then 调用的两个回调互不影响

// ✅ 想接所有错误用 .catch
Promise.resolve(1)
  .then((v) => {
    throw new Error('boom');
  })
  .catch((e) => console.log('caught', e));
```

### 3. `Promise.all` 一个失败,其他还在跑

```js
const tasks = urls.map((u) => fetch(u));
await Promise.all(tasks);
// 只要任一 reject,Promise.all 立刻 reject
// 但其他 fetch 不会被取消!仍占用网络/CPU,可能资源泄漏
```

**修复方案**:

- 用 `Promise.allSettled` 拿到所有结果再处理
- 配合 `AbortController` 在第一个 reject 时 abort 其他

### 4. 在 executor 里写异步代码却不调用 resolve / reject

```js
new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log('done'); // ❌ 没调 resolve/reject,Promise 永远 pending
  }, 100);
});
```

**修复**: 任何分支都必须最终走到 `resolve` 或 `reject`。

### 5. 把同步代码包进 Promise 没意义且会推迟一帧

```js
// ❌ 没必要
new Promise((r) => r(syncCompute()));

// ✅ 直接用
const v = syncCompute();
// 真要 Promise:Promise.resolve(syncCompute())
```

## 高频面试题(5 题)

- **Q1**: Promise 有几种状态?状态之间能怎么转换?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  三种: `pending`、`fulfilled`、`rejected`。状态只能从 pending **单向**迁移到 fulfilled 或 rejected,一旦 settled 后**状态和值都不可变**。Promises/A+ 规范明确禁止从 settled 回到 pending。

  &lt;details&gt;

- **Q2**: 解释 `.then` 的链式机制 —— 它是如何返回"新 Promise"的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  每次调用 `.then` 都返回**新 Promise**,新 Promise 的状态由回调的返回值决定:

  - 回调返回普通值 → 新 Promise fulfilled with that value
  - 回调返回 Promise → 新 Promise 跟随那个 Promise 的状态
  - 回调抛错 → 新 Promise rejected with that error
  - 没传回调 → 值/错误"穿透"到下一个 .then

  这正是为什么链式调用能层层组合的根本原因。

  &lt;details&gt;

- **Q3**: `Promise.all / allSettled / race / any` 四个方法的区别?各自适合什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **all**:并发全成才成,任一失败立刻失败。适合"必须全部成功"的批量请求
  - **allSettled**:等所有 settled,返回每个的状态和值。适合"无论成败都要拿到所有结果"
  - **race**:第一个 settled 决定结果(包括失败)。常用于做超时
  - **any**:第一个 **fulfilled** 决定结果,全失败抛 `AggregateError`。适合"多源容错请求"

  &lt;details&gt;

- **Q4**: `.then(fn1, fn2)` 和 `.then(fn1).catch(fn2)` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `.then(fn1, fn2)`: fn1 处理 fulfilled、fn2 处理 rejected,**但 fn1 抛错时 fn2 接不住**(它们是同一个 then 调用的两个分支,互不影响)
  - `.then(fn1).catch(fn2)`: fn1 抛错或返回 rejected Promise,**会**被后续 catch 接住

  推荐用后者:错误处理统一,链式自然。

  &lt;details&gt;

- **Q5**: Promise 回调是宏任务还是微任务?和 setTimeout 的执行顺序如何?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Promise 的 `.then / catch / finally` 回调是**微任务**(microtask)。每次宏任务执行结束后,事件循环会先**清空整个微任务队列**才进入下一个宏任务或渲染。

  ```js
  setTimeout(() => console.log('a'), 0);
  Promise.resolve().then(() => console.log('b'));
  console.log('c');
  // 输出: c, b, a
  ```

  详见 `js-event-loop`。

  &lt;details&gt;

## 延伸资源

- [MDN: Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Promises/A+ 规范](https://promisesaplus.com/)
- [ECMA-262: Promise Objects](https://tc39.es/ecma262/#sec-promise-objects)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
