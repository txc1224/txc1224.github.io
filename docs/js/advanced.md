---
title: 'Map & Set / Generator / Proxy / Symbol'
order: 6
---

# Map & Set / Generator / Proxy / Symbol

## Map / Set / WeakMap / WeakSet

### Map vs Object

|        | `Map`        | `Object`                 |
| ------ | ------------ | ------------------------ |
| 键类型 | 任意类型     | 仅字符串/Symbol          |
| 有序性 | 插入顺序     | 不保证（现代JS基本有序） |
| 大小   | `.size`      | `Object.keys().length`   |
| 迭代   | 内置可迭代   | 需转换                   |
| 性能   | 频繁增删更优 | 普通读写更优             |

```js
const map = new Map()
map.set('key', 'value')
map.set({ id: 1 }, 'obj-key') // 对象作为键
map.get('key')        // 'value'
map.has('key')        // true
map.delete('key')
map.size              // 剩余条目数

// 迭代
for (const [k, v] of map) { /* ... */ }
map.forEach((v, k) => { /* ... */ })
[...map.keys()]
[...map.values()]
[...map.entries()]
```

### Set

```js
const set = new Set([1, 2, 3, 2, 1]); // 自动去重 => {1, 2, 3}

// 数组去重
const unique = [...new Set(arr)];

// 集合运算
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

const union = new Set([...a, ...b]); // {1,2,3,4}
const intersection = new Set([...a].filter((x) => b.has(x))); // {2,3}
const difference = new Set([...a].filter((x) => !b.has(x))); // {1}
```

### WeakMap / WeakSet

```js
// WeakMap：键必须是对象，弱引用（不阻止GC）
const wm = new WeakMap();
let obj = { data: 'secret' };
wm.set(obj, { meta: 'extra' });
obj = null; // obj 可被垃圾回收，WeakMap 中的条目自动清理

// 典型用例：关联私有数据，不影响对象生命周期
const privateData = new WeakMap();
class User {
  constructor(name) {
    privateData.set(this, { name });
  }
  getName() {
    return privateData.get(this).name;
  }
}
```

---

## Generator & Iterator

```js
// Generator 函数：用 yield 暂停执行
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i
}

const r = range(0, 10, 2)
r.next() // { value: 0, done: false }
r.next() // { value: 2, done: false }
[...range(0, 5)] // [0, 1, 2, 3, 4]

// 手写可迭代对象（实现 Symbol.iterator）
const range2 = {
  from: 1, to: 5,
  [Symbol.iterator]() {
    let cur = this.from
    return {
      next: () => cur <= this.to
        ? { value: cur++, done: false }
        : { done: true }
    }
  }
}
[...range2] // [1, 2, 3, 4, 5]

// 无限序列（懒求值）
function* fibonacci() {
  let [a, b] = [0, 1]
  while (true) {
    yield a;
    [a, b] = [b, a + b]
  }
}

// 异步生成器（分页请求）
async function* paginate(url) {
  let page = 1
  while (true) {
    const res = await fetch(`${url}?page=${page}`)
    const data = await res.json()
    if (!data.items.length) return
    yield data.items
    page++
  }
}

for await (const items of paginate('/api/users')) {
  console.log(items)
}
```

---

## Proxy & Reflect

```js
// 基础拦截
const handler = {
  get(target, key, receiver) {
    console.log(`读取: ${key}`);
    return Reflect.get(target, key, receiver); // 配合 Reflect 转发
  },
  set(target, key, value, receiver) {
    console.log(`设置: ${key} = ${value}`);
    return Reflect.set(target, key, value, receiver);
  },
  has(target, key) {
    return key in target;
  },
  deleteProperty(target, key) {
    console.log(`删除: ${key}`);
    return Reflect.deleteProperty(target, key);
  },
};

const proxy = new Proxy({ name: 'foo' }, handler);

// 响应式数据（Vue3 原理简化版）
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key); // 依赖收集
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key); // 触发更新
      return result;
    },
  });
}

// Reflect：提供操作对象的标准方法，与 Proxy trap 一一对应
Reflect.has(obj, 'key'); // 等价于 'key' in obj
Reflect.ownKeys(obj); // 等价于 Object.getOwnPropertyNames + getOwnPropertySymbols
Reflect.deleteProperty(obj, 'k'); // 等价于 delete obj.k
```

---

## Symbol

```js
// 唯一标识符，即使描述相同也不相等
const s1 = Symbol('id');
const s2 = Symbol('id');
s1 === s2; // false

// 防止属性名冲突（常用于库/框架）
const ID = Symbol('id');
obj[ID] = 123; // 不会覆盖 obj.id

// 全局 Symbol 注册表（跨模块共享）
const shared = Symbol.for('shared');
Symbol.keyFor(shared); // 'shared'

// 内置 Well-known Symbol
class Collection {
  [Symbol.iterator]() {
    /* ... */
  } // 使对象可迭代
  [Symbol.toPrimitive](hint) {
    // 控制类型转换
    return hint === 'number' ? this.size : this.toString();
  }
  static [Symbol.hasInstance](instance) {
    // 控制 instanceof 行为
    return Array.isArray(instance);
  }
}
```

<!-- KNOWLEDGE-IMPORT:START -->

## 浏览器 vs Node 事件循环差异

## TL;DR

> 浏览器按 HTML spec 走"宏 → 清空微 → 渲染";Node 用 libuv 分 6 阶段循环,每个阶段间清空微任务和 `process.nextTick` 队列;`process.nextTick` 优先级高于普通微任务。

## 背景与动机

两端都基于事件循环,但实现差别足以让同一段代码输出不同结果:

- Node 有 `process.nextTick` / `setImmediate`,浏览器没有
- Node 11+ 才在每个 timer 后清空微队列,旧 Node 是一组 timer 跑完才清
- 浏览器有"渲染机会"插在事件循环里,Node 没有
- `setImmediate` vs `setTimeout(0)` 顺序在普通场景里**不确定**,但在 I/O 回调里**确定**

混合端代码(SSR、Node CLI 工具、共享 utils)如果靠"经验"判断顺序很容易踩坑。掌握两端模型差异是写跨端可靠代码的前提。

## 核心机制

### 浏览器事件循环(HTML Spec 简化版)

```
loop:
  1. 取一个 task(从 task queue)
  2. 执行该 task 到调用栈空
  3. perform microtask checkpoint:
     while (microtask queue not empty) { run next; }
  4. 如果到了渲染时机:
     - 执行 requestAnimationFrame 回调
     - resize / scroll 等事件
     - 计算 style / layout / paint
  5. 回到第 1 步
```

### Node 事件循环(libuv 6 阶段)

```
┌───────────────────────────┐
│        timers             │  setTimeout / setInterval 到期回调
├───────────────────────────┤
│   pending callbacks       │  少数 I/O 操作的延迟错误回调
├───────────────────────────┤
│   idle, prepare           │  内部使用
├───────────────────────────┤
│        poll               │  等待 I/O / 处理 I/O 回调
│  (这里也是事件循环驻留点)      │
├───────────────────────────┤
│        check              │  setImmediate 回调
├───────────────────────────┤
│   close callbacks         │  socket.on('close')、handle.on('close')
└───────────────────────────┘
       ↓ 每个阶段切换之间
       清空 process.nextTick 队列 → 清空微任务队列
       ↓
   回到 timers 阶段
```

### 优先级(Node 内)

1. **同步代码**(当前调用栈)
2. **`process.nextTick` 队列**
3. **微任务队列**(Promise / queueMicrotask)
4. **当前阶段的回调**(timers / poll / check / ...)

`process.nextTick` 不是任何阶段的一部分,而是在**任何阶段切换之间**优先清空。这就是它"优先级高于 Promise"的根因。

### `setImmediate` vs `setTimeout(fn, 0)`

- **在 I/O 回调内**:`setImmediate` **一定**先于 `setTimeout(0)`,因为 check 阶段紧接 poll 阶段
- **在主模块顶层**:谁先不一定,取决于进程启动初始化耗时(timers 阶段的"到期判断"可能错过 0ms)

```js
// 在主模块顶层:可能 immediate 也可能 timeout 先
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// 在 I/O 回调内:必然 immediate 先
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// 输出: immediate, timeout
```

### Node 11+ 的对齐

Node 10 及以前:`timers` 阶段会**把所有到期 timer 一口气跑完**再清微队列。Node 11+ 改成**每跑完一个 timer 就清一次微队列**,语义更接近浏览器。

```js
// 同样代码在 Node 10 和 Node 11+ 输出不同
setTimeout(() => {
  console.log('t1');
  Promise.resolve().then(() => console.log('p1'));
}, 0);
setTimeout(() => {
  console.log('t2');
  Promise.resolve().then(() => console.log('p2'));
}, 0);

// Node 10  : t1, t2, p1, p2  (一组 timer 跑完再清微)
// Node 11+ : t1, p1, t2, p2  (每个 timer 后清微)
// 浏览器     : t1, p1, t2, p2  (和 Node 11+ 一致)
```

生产环境如果还跑 Node ≤10 必须警惕这一点。Node 22+ 早已正常。

## 代码示例

### 浏览器 vs Node 输出对比

```js
console.log('start');
setTimeout(() => console.log('timeout'), 0);
setImmediate?.(() => console.log('immediate')); // 仅 Node 有
Promise.resolve().then(() => console.log('promise'));
process?.nextTick?.(() => console.log('nextTick')); // 仅 Node 有
console.log('end');

// 浏览器输出:
//   start, end, promise, timeout
// Node 输出(顶层,不在 I/O 内):
//   start, end, nextTick, promise, timeout, immediate   (timeout/immediate 顺序可能颠倒)
```

### Node 里的 `nextTick` 抢先示例

```js
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('next'));
// 输出: next, promise
//
// 解析:阶段切换时先清 nextTick 队列,再清 Promise 微队列
```

## 易错点 / 反例

### 1. 把 `setTimeout(0)` 和 `setImmediate` 当一回事

两者**只在 I/O 回调内顺序确定**(immediate 先),其他场景**不要赖以排序**。需要确定顺序时用 `process.nextTick` 或 Promise 链。

### 2. 滥用 `process.nextTick` 导致 I/O starvation

```js
function recurse() {
  process.nextTick(recurse);
}
recurse();
// ❌ nextTick 队列永远清不完 → 事件循环永远进不到 poll 阶段
// → I/O 回调永远不被处理,程序"看起来活着但什么都不做"
```

`process.nextTick` 比 Promise 优先级还高,无限递归直接饿死 I/O。Node 官方建议:**只在需要"在当前操作完成后立即但同步之前"时用,不要做循环调度**。

### 3. 跨端代码假设 `setImmediate` 存在

```js
// SSR 或同构代码
setImmediate(work); // ❌ 浏览器没有 setImmediate
```

**修复**:

```js
const queueTask = typeof setImmediate === 'function' ? setImmediate : (fn) => setTimeout(fn, 0);
```

或用 MessageChannel polyfill。

### 4. `requestAnimationFrame` 在 Node 里不存在

浏览器把渲染时机插在事件循环里,Node 没有渲染,自然没有 rAF。SSR / 同构代码里调用 rAF 必须做 typeof 守卫。

### 5. Node 10 环境下 timer 微任务顺序"反常识"

```js
// 在 Node 10 跑会发现 p1 p2 比 t1 t2 都晚
// 在 Node 11+ 和浏览器都符合"每个宏任务后清微"的常识
```

**修复**:升级 Node ≥ 12,且 CI 把 Node 版本固定。

## 高频面试题(5 题)

- **Q1**: 描述浏览器事件循环的工作流程。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  HTML spec 简化:

  1. 取一个宏任务执行到调用栈空
  2. 执行微任务检查点 —— 清空微任务队列(包括处理中产生的新微任务)
  3. 如到了渲染时机:rAF 回调 → resize/scroll → style → layout → paint
  4. 回到 1

  关键点:微任务清空在每个宏任务之后;渲染在微任务清空之后。

  &lt;details&gt;

- **Q2**: Node 事件循环有几个阶段?各自做什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  6 个:

  1. **timers**:到期的 setTimeout / setInterval
  2. **pending callbacks**:少数 I/O 错误的延迟回调
  3. **idle, prepare**:libuv 内部
  4. **poll**:I/O 回调,事件循环主要驻留点
  5. **check**:setImmediate 回调
  6. **close callbacks**:close 事件回调

  每个阶段切换之间清空 `process.nextTick` 队列 → 清空微任务队列。

  &lt;details&gt;

- **Q3**: Node 里 `setImmediate` 和 `setTimeout(fn, 0)` 谁先?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **在 I/O 回调内**:`setImmediate` 一定先(因为 check 阶段紧接 poll)
  - **在主模块顶层 / 非 I/O 上下文**:**顺序不确定**,取决于初始化耗时,timers 是否能在第一次循环就检测到到期

  生产代码不要依赖顺序;真要立刻执行用 `process.nextTick` 或 Promise。

  &lt;details&gt;

- **Q4**: `process.nextTick` 和 Promise 的优先级关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Node 在阶段切换之间会**先**清空 `nextTick` 队列,**再**清空微任务(Promise)队列。所以同时排队时 nextTick 先于 Promise.then 执行。

  ```js
  Promise.resolve().then(() => console.log('p'));
  process.nextTick(() => console.log('n'));
  // n, p
  ```

  &lt;details&gt;

- **Q5**: 渲染在事件循环什么位置?微任务里改 DOM 多次会引发多次渲染吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  浏览器渲染机会在**微任务清空之后、下一个宏任务之前**。所以:

  - 微任务里改了 N 次 DOM,只在本轮末尾**统一渲染一次**,看到的是最终状态
  - 渲染前还要看浏览器的"是否需要渲染"判断(60fps 节流、tab 后台时降频)
  - Node 没有渲染阶段,无此概念

  &lt;details&gt;

## 延伸资源

- [Node.js 文档: Event Loop, Timers, and process.nextTick](https://nodejs.org/zh-cn/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [HTML spec: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [Node.js: process.nextTick](https://nodejs.org/api/process.html#processnexttickcallback-args)

## (留白) 我的理解

> 这一段不强制填。

---

## 调用栈与事件循环基础

## TL;DR

> JS 引擎单线程跑同步代码;耗时操作(timer / I/O / fetch)交给宿主异步完成;完成后回调进入任务队列;事件循环不断"等调用栈空 → 取队列下一个任务",让单线程也能处理并发。

## 背景与动机

JS 当初被设计成浏览器脚本,主要任务是**操作 DOM**。如果允许多线程并发改 DOM,需要为每个 DOM 节点上锁,复杂度爆炸。设计选择:

- **JS 主线程单线程**:不可能两个 JS 代码片段同时跑
- **异步 I/O 由宿主完成**:网络、文件、定时器都丢给浏览器/Node,跑完用回调通知
- **事件循环串联两端**:连接"宿主完成的异步"和"主线程的执行"

后果:

- 写出"非阻塞"代码的关键是不要把耗时活塞进主线程
- 长任务(>50ms)会让页面卡顿、按钮按不动、动画掉帧
- 理解事件循环 = 理解 JS 在做什么、为什么这样、什么时候出问题

## 核心机制

### 三大组件

```
┌──────────────────┐   ┌──────────────────────────────────────────┐
│   Call Stack     │   │       Task Queue (FIFO)                  │
│   (LIFO 栈)      │◀──│  [ cb1 ][ cb2 ][ cb3 ] …                 │
│                  │   └──────────────────────────────────────────┘
│  当前调用链          │                ▲
│  fn → fn → fn    │                │ 异步完成后入队
└──────────────────┘                │
        ▲                ┌──────────────────────────────────────┐
        │                │  Web APIs / Host (浏览器 / Node 提供)  │
        │ 取下个任务        │  setTimeout, fetch, I/O, DOM event   │
        │                └──────────────────────────────────────┘
        │
   Event Loop
   while (true) {
     if (callStack.empty) {
       const task = taskQueue.dequeue();
       if (task) callStack.push(task);
     }
   }
```

### 一次"tick"做什么

1. 当前调用栈跑完(同步代码)
2. 检查微任务队列 → 清空(详见 `js-macro-microtask`)
3. (浏览器)如果到了渲染机会,做 style / layout / paint
4. 从宏任务队列取一个,推入调用栈,开始下一轮

### "阻塞"意味着什么

"阻塞主线程"= 调用栈一直不空 = 事件循环卡在第 1 步没法进入第 2-4 步。后果:

- Promise 回调晾着(微任务不被处理)
- 渲染晾着(60fps = 16.6ms 一帧,长任务 100ms 就掉 6 帧)
- UI 输入晾着(点击事件入队但永远等不到处理)

### 长任务定义

- Performance API 把**主线程上连续运行超过 50ms 的任务**定义为"long task"
- Lighthouse / Core Web Vitals 的 `TBT`(Total Blocking Time)、`INP`(Interaction to Next Paint)直接由长任务驱动
- 优化原则:把长任务**切片**(每 5-10ms 主动 `await Promise` 让出),或**搬到 Worker**

## 代码示例

```js
// 1. 单线程阻塞的典型反例
function blockFor(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {} // 死循环占用调用栈
}

document.getElementById('btn').onclick = () => {
  blockFor(3000); // 整页卡 3 秒,按钮按不动、动画停止
  console.log('done');
};

// 2. 让出主线程(微任务边界)
async function processBatch(items) {
  for (let i = 0; i < items.length; i++) {
    heavyWork(items[i]);
    if (i % 100 === 99) await Promise.resolve(); // 每 100 项让一次
  }
}
// await Promise.resolve() 会插入一次微任务边界,让事件循环有机会处理其他任务

// 3. 现代:scheduler.yield()(Chrome 129+)
async function processBatchModern(items) {
  for (let i = 0; i < items.length; i++) {
    heavyWork(items[i]);
    if (navigator.scheduling?.isInputPending()) {
      await scheduler.yield(); // 检测到用户输入待处理时主动让出
    }
  }
}
```

## 易错点 / 反例

### 1. `setTimeout(fn, 0)` 不是真的 0ms

浏览器嵌套超过 5 层 setTimeout 会强制把最小延迟提升到 **4ms**(HTML spec 规定,防止页面用 setTimeout 死循环烧电池)。

```js
function chain(n) {
  if (n === 0) return;
  setTimeout(() => chain(n - 1), 0);
}
chain(100);
// 实际每层间隔 ~4ms,100 层总耗时 ~400ms,不是 ~0ms
```

要"尽快但又让出主线程",用 `queueMicrotask` / `Promise.resolve().then` 通常更合适。

### 2. 长任务拖死帧率

```js
const arr = Array.from({ length: 1_000_000 }, (_, i) => i);
arr.forEach((x) => heavyWork(x)); // ❌ 一次性同步跑完,主线程卡 N 秒
```

**修复**:

- 时间分片:每 5ms 调一次 `await scheduler.yield()` / `await Promise.resolve()`
- Web Worker:把 CPU 密集任务搬到 Worker 线程,主线程零阻塞
- requestIdleCallback:把"不急的"工作排到空闲时间

### 3. 误以为 `setTimeout(fn, 100)` 一定 100ms 后执行

设的是**最早**执行时间,不是确切时间:

- 如果 100ms 后主线程还在跑别的同步代码 → 等
- 如果队列前面还有别的宏任务 → 排队
- 标签页在后台时浏览器会把最小间隔拉到 1000ms

`setTimeout` 给的是"不早于"承诺,**不是**实时调度。

### 4. 把 CPU 密集运算塞主线程

排序 100 万条、解析大 JSON、跑模型推理 → 全是长任务源头。

```js
// ✅ 用 Worker
const worker = new Worker('./heavy.js');
worker.postMessage(bigData);
worker.onmessage = (e) => use(e.data);
```

### 5. 同步代码间永远没有"事件循环让出点"

```js
console.log('A');
console.log('B');
console.log('C');
// A B C 之间不会插任何任务,即便队列里堆了 100 个 setTimeout(0)
```

**根因**: 调用栈不空,事件循环根本不进入"取下个任务"那一步。

## 高频面试题(5 题)

- **Q1**: JS 为什么是单线程?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  设计层面:JS 主战场是 DOM 操作,多线程改 DOM 必须给每个节点上锁,复杂度和性能代价都很大。设计者选择"主线程单线程 + 异步 I/O 由宿主线程做"的模型。

  现代 JS 仍可以并行:Web Worker / Service Worker / Worklet 都是真线程,但**不能直接操作 DOM**,数据通过 postMessage 传递。

  &lt;details&gt;

- **Q2**: 用一句话+一张图描述事件循环工作流程。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  "调用栈跑完同步 → 清空微任务队列 →(浏览器)渲染机会 → 从宏任务队列取下一个 → 推入栈 → 循环"。三大组件:Call Stack(LIFO,执行同步代码)、Task Queue(FIFO,放回调)、Event Loop(连接两端的调度器)。

  &lt;details&gt;

- **Q3**: `setTimeout(fn, 0)` 真的 0ms 后执行吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不。两个层面:

  - **HTML spec 规定**:嵌套超过 5 层时强制最小延迟 4ms
  - **实际执行时机**:回调入队后还要等调用栈空 + 微任务清空 + 队列前面的任务跑完;后台标签页最小间隔会被拉到 1000ms

  `setTimeout` 的承诺是"不早于",不是"恰好"。

  &lt;details&gt;

- **Q4**: 什么是 long task?为什么 50ms?有什么危害?如何切片?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  长任务 = 主线程上连续运行 >50ms 的任务,定义来自 Performance API / RAIL 模型。

  50ms 来源:60fps 一帧 16.6ms,留够给浏览器响应输入(50ms 内反应让用户感知"立即")。

  危害:渲染掉帧、输入延迟、Core Web Vitals 指标(TBT / INP)劣化。

  切片方法:

  - `await Promise.resolve()` / `queueMicrotask` 让出微任务边界
  - `await scheduler.yield()`(现代浏览器)显式礼让
  - 拆给 `requestIdleCallback`(不急任务)
  - 真正 CPU 密集的搬到 Worker

  &lt;details&gt;

- **Q5**: Web Worker 解决什么问题?和事件循环什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Worker 是**独立线程 + 独立事件循环**,有自己的 call stack 和 task queue。和主线程通过 postMessage 异步通信(消息进对方的事件队列)。

  用途:

  - CPU 密集任务(图像处理、大文件解析、ML 推理)
  - 后台轮询、数据同步
  - 隔离不可信代码

  限制:不能访问 DOM、window;通信成本(序列化、深拷贝);适合粗粒度任务而非高频小任务。

  &lt;details&gt;

## 延伸资源

- [MDN: Event loop](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop)
- [HTML spec: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- Philip Roberts "What the heck is the event loop anyway?"(JSConf EU 经典演讲)

## (留白) 我的理解

> 这一段不强制填。

---

## 宏任务 vs 微任务

## TL;DR

> 异步回调分两类:**宏任务**(来源于宿主,如 timer / I/O / UI 事件)和**微任务**(Promise / queueMicrotask / MutationObserver)。**每跑完一个宏任务,清空整个微任务队列才进入下一步**。

## 背景与动机

为什么要区分两类队列?直接一个 FIFO 不行吗?

行不通的原因:**Promise 链需要"高优先级"语义**。一段连续的 `.then(...).then(...)` 在语义上是一个"密切相关的逻辑组",如果中间被别的宏任务(如 setTimeout 回调)插队,逻辑就被打乱、变量被读到中间状态。

HTML spec 的解法:**微任务**这一专属"插队队列",每次宏任务结束后**整体清空**,把"紧密关联的连续操作"做完再让外部其他事件继续。

```
直觉(全是一个队列):
  [setTimeout cb][then1][setTimeout cb][then2]  ← Promise 链被 setTimeout 切断 ❌

实际(两个队列):
  宏队列: [setTimeout cb][setTimeout cb][input event]
  微队列: [then1][then2][then3]    ← 整体清空才让宏继续 ✅
```

## 核心机制

### 队列归属(浏览器视角)

| 任务源                               | 队列               |
| ------------------------------------ | ------------------ |
| `setTimeout` / `setInterval` 回调    | 宏                 |
| I/O 完成回调 / `fetch` 网络层        | 宏                 |
| `requestAnimationFrame`              | 宏(渲染阶段)       |
| UI 事件(click / input / message)     | 宏                 |
| `postMessage` / `MessageChannel`     | 宏                 |
| **`Promise.then / catch / finally`** | 微                 |
| **`queueMicrotask(fn)`**             | 微                 |
| **`MutationObserver`**               | 微                 |
| `process.nextTick`(Node 专属)        | 比普通微更高优先级 |

### 执行顺序公式

**同步代码 → 微任务队列清空 → 一个宏任务 → 微任务队列清空 → (渲染) → 一个宏任务 → ...**

注意细节:

- "清空"是"清到见底",包括处理过程中**新产生的微任务**也要继续清空
- `await` 后面的代码本质是微任务(被挂到 Promise 的 then 链上)
- 浏览器在每次宏任务后才做渲染机会,所以微任务里改 DOM **不会**触发额外渲染(本轮统一渲染)

### 微任务的递归"封顶"在哪

浏览器**不会**强制限制微任务队列大小;微任务里产生新微任务,本轮继续清。如果你写了个"微任务无限循环",浏览器会**永远卡死,渲染永远不发生**:

```js
function loop() {
  Promise.resolve().then(loop);
}
loop(); // ❌ 页面冻结,长任务 + 0 帧
```

对比:同样的逻辑用 `setTimeout` 不会卡死,因为宏任务之间有渲染机会。

### `queueMicrotask` vs `Promise.resolve().then`

两者**几乎等价**,都是把回调入微任务队列。差异:

- `queueMicrotask` 更直接,不创建中间 Promise,语义更清晰
- 错误处理:`queueMicrotask` 内抛错会冒泡到 `error` 事件而非变成 rejected Promise(没有 `.catch` 可接)
- 性能:`queueMicrotask` 略快(少一次 Promise 分配),但实际代码差异忽略不计

工程建议:**调度纯回调用 `queueMicrotask`,需要错误链/返回值时用 Promise**。

## 代码示例

### 经典输出题

```js
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

queueMicrotask(() => console.log('5'));

console.log('6');

// 输出: 1, 6, 3, 5, 4, 2
//
// 解析:
// 1. 同步代码:1, 6
// 2. 清微任务:3(进入 then2 → 4 入队);5;4
//    注意 3 和 5 入队的相对顺序:3 先,5 后 → 3 → 5;
//    然后 4 在 3 执行时入队,排在 5 之后 → 3, 5, 4
// 3. 取下一个宏任务:2
```

### `await` 之后的代码也是微任务

```js
async function f() {
  console.log('A');
  await 1; // await 同步值也会插入一次微任务边界
  console.log('B');
}

f();
console.log('C');
queueMicrotask(() => console.log('D'));

// 输出: A, C, B, D
//
// 解析:
// 1. f() 同步跑到 await,输出 A,函数暂停,B 被挂到微队列
// 2. 同步代码继续:C
// 3. queueMicrotask 入队 D(此时队列: B, D)
// 4. 清微队列:B, D
```

## 易错点 / 反例

### 1. `await` 之后的代码被误以为是同步

```js
async function f() {
  console.log('A');
  await 1;
  console.log('B'); // 这不是同步,是微任务
}
f();
console.log('C');
// 输出: A, C, B —— 不是 A, B, C
```

**根因**: async 函数遇到 await 暂停,把剩余代码挂到 Promise 的 then 链上。即便 await 的是同步值,**也会插入一次微任务调度**。

### 2. 微任务里改 DOM 不触发额外渲染

```js
button.addEventListener('click', () => {
  div.style.color = 'red';
  Promise.resolve().then(() => {
    div.style.color = 'blue'; // 用户看到的最终颜色是 blue
    // 中间的 red 永远不会被渲染
  });
});
```

点击事件回调跑完 → 清微任务 → 然后才渲染。所以微任务里改了多少次,渲染时只看最终状态。

### 3. 微任务无限循环卡死浏览器

```js
function loop() {
  Promise.resolve().then(loop);
}
loop();
// 页面冻结、键鼠失灵、需要强杀标签页
```

**对比**:用 setTimeout 不卡死,但 CPU 仍 100%。

```js
function tick() {
  setTimeout(tick, 0);
}
tick(); // 不卡死,但每秒消耗大量任务调度,电池/CPU 烧光
```

### 4. 误用 `Promise.resolve().then` 当 setTimeout 用

某些代码用 `Promise.resolve().then(() => doNext())` 想"让出一帧",其实只让出了微任务边界:

- 调用栈空 → 立即被这个 then 占住
- 不给宏任务/渲染机会
- 跟你想要的"明天再说"差很远

**修复**: 真要让出主线程让渲染先做,用 `setTimeout(fn, 0)` 或 `requestAnimationFrame`,别用微任务。

### 5. Node 里 `process.nextTick` 优先级 > 普通微任务

```js
// Node 环境
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('next'));
// 输出: next, promise (在 Node 里 nextTick 抢先)
```

浏览器没有 `process.nextTick`。这是 Node 的特殊机制,详见 `js-browser-vs-node-loop`。

## 高频面试题(5 题)

- **Q1**: 宏任务和微任务各有哪些来源?为什么要分两类?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **宏**:setTimeout / setInterval / I/O / UI 事件 / postMessage / MessageChannel
  **微**:Promise.then|catch|finally / queueMicrotask / MutationObserver / process.nextTick(Node)

  分两类是为了给"紧密关联的连续异步操作"(Promise 链)一个不被外部宏任务插队的环境 —— 每跑完一个宏,先清空整个微队列再做下一步。

  &lt;details&gt;

- **Q2**: 描述以下代码的输出顺序:

  ```js
  console.log(1);
  setTimeout(() => console.log(2), 0);
  Promise.resolve().then(() => console.log(3));
  console.log(4);
  ```

  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  输出:`1, 4, 3, 2`。

  - 同步:1, 4
  - 清微队列:3
  - 取宏:2

  &lt;details&gt;

- **Q3**: `await 1;` 这一行有没有让出主线程?之后的代码是什么时候执行的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  让出当前 async 函数的执行(挂起),**但不阻塞主线程**(主线程立刻继续跑同步代码)。await 之后的代码以**微任务**形式排队,等当前调用栈空 + 微队列轮到它时执行。

  即便 await 同步值(`await 1`),也会引入一次微任务调度,而不是"原地继续"。

  &lt;details&gt;

- **Q4**: `queueMicrotask` 和 `Promise.resolve().then` 有什么区别?什么时候用哪个?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  几乎等价,都进微队列。差异:

  - queueMicrotask 不创建 Promise,语义直接
  - queueMicrotask 内抛错冒泡到 error 事件(无 .catch);Promise.then 抛错变 rejection
  - 性能差异忽略

  调度纯回调用 queueMicrotask;需要错误传播链或返回值,用 Promise。

  &lt;details&gt;

- **Q5**: 为什么"微任务无限循环会卡死浏览器,setTimeout 无限循环不会"?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  本轮事件循环必须**清空整个微队列**才能进入下一个宏任务 + 渲染机会。微任务里递归塞新微任务,队列永远清不完 → 永远不进入渲染 → 页面冻结。

  setTimeout 是宏任务,每次只跑一个,后面有渲染机会,UI 仍能响应(但 CPU 持续 100%)。

  &lt;details&gt;

## 延伸资源

- [MDN: Microtask guide](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [MDN: queueMicrotask](https://developer.mozilla.org/zh-CN/docs/Web/API/queueMicrotask)
- [HTML spec: Microtask checkpoint](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint)

## (留白) 我的理解

> 这一段不强制填。

---

## 合成层与 GPU 加速

## TL;DR

> 浏览器把页面拆成若干**合成层**,每层独立 paint 到位图,GPU 在合成器线程把所有层拼到屏幕。提层能隔离重绘、用 GPU 加速 `transform/opacity`;但层多了反而拖累内存和合成开销 —— 即"层爆炸"。

## 背景与动机

为什么需要分层?

- 全页面只有一张位图 → 任何小修改都要重画整页,极慢
- 分层后:动画元素一层,其他不动元素一层 → 动画时只需合成,不需要重画其他层
- 合成器线程独立于主线程,即便主线程被 JS 阻塞,动画仍能跑(60fps 滚动 / transform 动画的根本来源)

但"分层"不是免费的:每层都要分配 GPU 内存(VRAM)、做合成开销。乱提层会让性能变差。

理解合成层是**回答"为什么 transform 比 left 快"**的真正答案,也是高级前端性能优化的分水岭。

## 核心机制

### 渲染管线里的合成阶段

```
Layout → Paint(per layer) → Composite(GPU)──► Display
                              ↑
                              │
                       合成器线程(compositor thread)
                       独立于主线程,自带帧调度
```

### 什么时候新建一个合成层(隐式提层条件)

- 3D transform(`translate3d`、`translateZ`、`rotate3d`)
- `opacity` 处于动画/过渡中
- `position: fixed`(部分浏览器)
- `filter` / `backdrop-filter`
- `&lt;video&gt;` / `&lt;canvas&gt;` / WebGL / iframe
- `will-change: transform | opacity | filter | top | left ...`
- 滚动容器(根据浏览器实现)
- `mask` / `clip-path`(部分)

### 显式提层:`will-change`

```css
.box.animating {
  will-change: transform; /* 告诉浏览器:这个元素马上要动 transform */
}
```

**正确用法**:

- 仅在元素**即将动**之前打开(JS 控制加上)
- 动画结束**立刻关闭**(removeProperty 或换 class)
- 不要静态地给所有元素加

**错误用法**:

```css
/* ❌ 全局滥用 */
* {
  will-change: transform;
} /* 层爆炸 */
.everything {
  will-change: all;
} /* 等于没说 */
```

### `translateZ(0)` / `translate3d(0,0,0)` 的"黑魔法"提层

ES6 之前用 `transform: translateZ(0)` 强制走 3D 通道触发提层(因为 3D 必然有独��层)。现在已被 `will-change` 替代,但**老代码 / 老兼容性**仍可见。差异:

- `will-change`:语义清晰,可被引擎更准确管理
- `translateZ(0)`:副作用大(字体抗锯齿可能改变),但兼容性更好(更老的浏览器)

### "层爆炸"(Layer Explosion)

- 一个元素提层后,可能让**它周围的兄弟节点**也被迫提层(为了正确叠加 z-index)
- 多个元素同时 will-change → 层数指数级增长
- 表现:内存暴涨、合成阶段变慢、滚动反而更卡

DevTools → More tools → Rendering / Layers 可视化每层。

### 合成阶段独立于主线程

```js
button.onclick = () => {
  blockMainThread(3000); // 卡主线程 3s
};
```

此时:

- DOM / JS 卡住
- 但已经在合成层上的 transform 动画**仍能流畅运行**(因为合成器线程独立)
- 滚动是合成器接管的(主线程不参与 fast scroll path)

这是为什么"transform 比 left 快"——不是 GPU 计算更快,而是**不走主线程**。

## 代码示例

### `will-change` 的正确生命周期

```js
const box = document.querySelector('.box');

function animate() {
  // 1. 动画前打开 will-change
  box.style.willChange = 'transform';

  // 2. 触发动画(下一帧)
  requestAnimationFrame(() => {
    box.style.transform = 'translateX(200px)';
  });

  // 3. 动画结束后关闭(transitionend)
  box.addEventListener('transitionend', function onEnd() {
    box.style.willChange = '';
    box.removeEventListener('transitionend', onEnd);
  });
}
```

### 用 DevTools 看层

1. 打开 DevTools → 三点菜单 → More tools → **Layers**
2. 看页面被分了多少层、每层占多大内存
3. 选中某层,看它的"Compositing Reasons"(为什么被提层)

或在 Rendering 面板开 **Layer borders** 在页面上可视化层边界。

## 易错点 / 反例

### 1. 给所有元素无脑加 `will-change`

```css
/* ❌ 层爆炸 */
* {
  will-change: transform;
}
```

**后果**:VRAM 占用暴涨、合成器线程变慢、低端设备直接卡死。

**正确**:只在动画即将开始前对**那一个元素**打开;不动画时关闭。

### 2. 把 `will-change` 当魔法咒语

新手"性能不好 → 加 will-change",反而更差。**will-change 是给浏览器的预告**,如果元素不会动,等于占着内存不办事。

### 3. transform 不在独立层时仍触发 paint

```css
.box {
  transform: translateX(100px);
} /* 静态 transform 不一定提层 */
```

- 静态 transform:可能不被提层,改变它仍触发 paint
- 动画 transform / `will-change: transform`:大概率提层,改变只合成

判别:DevTools Layers 看是否真的独立成层。

### 4. 字体 / 滤镜 / shadow 改变触发 paint 而非合成

```css
.box.hover {
  box-shadow: 0 0 20px red;
} /* hover 改 shadow → repaint */
.box.hover {
  filter: blur(4px);
} /* 改 filter → 至少 repaint */
```

即便元素在独立层,这类属性变化也要重画位图(paint),不能跳过。

### 5. `transform: translateZ(0)` 副作用

```css
.text {
  transform: translateZ(0);
} /* 触发 3D 通道,但字体可能变模糊 */
```

**根因**:3D 走 GPU 路径,文字抗锯齿算法可能切换为"subpixel → grayscale",看起来不锐利。**修复**:用 `will-change: transform` 代替。

## 高频面试题(5 题)

- **Q1**: 哪些 CSS 属性会触发新建合成层?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 3D transform(translate3d、translateZ、rotate3d 等)
  - 动画中的 opacity / transform / filter
  - `will-change: transform | opacity | filter | ...`
  - `position: fixed`(部分浏览器)
  - `filter` / `backdrop-filter` / `mask` / `clip-path`
  - `&lt;video&gt;` / `&lt;canvas&gt;` / iframe / WebGL
  - 滚动容器(部分实现)

  完整清单看 DevTools 的 Compositing Reasons。

  &lt;details&gt;

- **Q2**: `transform / opacity` 为什么走合成线程?前提是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  前提:**该元素必须在独立合成层**。一旦在独立层:

  - 改 transform / opacity 不影响其他层
  - 主线程只需告诉合成器线程"这一层换一个变换矩阵 / 透明度"
  - 合成器线程独立运行,即便主线程 JS 阻塞也不影响动画

  不在独立层时,改 transform/opacity 仍可能 paint。

  &lt;details&gt;

- **Q3**: `will-change` 怎么用最合理?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  生命周期:

  - **动画前**通过 JS 加上(`element.style.willChange = 'transform'`)
  - **动画结束**(transitionend / animationend)立刻清除

  禁忌:

  - 不要全局通用(`* { will-change }`)
  - 不要静态写死(让元素一直占内存)
  - 不要写 `will-change: all`(等同没写)

  &lt;details&gt;

- **Q4**: 层太多有什么问题?(层爆炸)
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 每层独立位图,占 GPU 内存(VRAM)和系统内存
  - 合成器要把所有层依次合成,层多 → 合成阶段也慢
  - 一个元素提层会影响 z-index 关系上的邻居,可能连锁触发更多层
  - 低端设备 / 移动端尤其敏感

  排查:DevTools Layers 面板看层数和内存占用;Rendering → Layer borders 可视化。

  &lt;details&gt;

- **Q5**: 怎么验证一个动画是否真的在合成线程跑?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  几种方法:

  1. DevTools Performance 录制 → 看是否有 main thread 上的 "Recalculate Style / Layout / Paint" 同步发生 → 没有则是合成动画
  2. 用 JS 阻塞主线程一段时间(`while(...){}`),看动画是否依然流畅 → 流畅 = 真合成
  3. Rendering 面板的 "FPS meter" 查看 GPU memory
  4. Layers 面板看动画元素是否在独立层、Compositing Reasons 是否含 `will-change` / `transform 3d`

  &lt;details&gt;

## 延伸资源

- [Chrome DevTools: Rendering](https://developer.chrome.com/docs/devtools/rendering)
- [web.dev: Animations guide](https://web.dev/articles/animations-guide)
- [Chromium: GPU-accelerated Compositing](https://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome/)

## (留白) 我的理解

> 这一段不强制填。

---

## 关键渲染路径(CRP)

## TL;DR

> 浏览器把 HTML → DOM,CSS → CSSOM,合并为 Render Tree → Layout 算几何 → Paint 上色 → Composite 合成上屏。理解这条管线是性能优化(尤其首屏)的地基。

## 背景与动机

页面"打开 → 看到内容"的过程不是一步,而是一条由多步组成的管线。每一步:

- 都有**阻塞条件**(CSS 阻塞渲染 / JS 阻塞解析 / CSSOM 阻塞 JS)
- 都消耗**时间**(首屏 LCP / FCP 指标就是它的延迟)

优化首屏 ≈ 缩短 CRP 总时长 + 让用户尽早看到第一帧。常见优化(预加载、defer/async、关键 CSS 内联、SSR、流式 HTML)都是针对 CRP 某个环节的针对手段。

不懂 CRP,只会"加点 link rel=preload 试试" —— 黑魔法堆砌而不知道在解决什么。

## 核心机制

### 完整管线

```
HTML 字节流 ──► 字符 ──► Tokens ──► Nodes ──► DOM
                                                │
                                                ▼
                                          Render Tree ──► Layout ──► Paint ──► Composite ──► 像素
                                                ▲
                                                │
CSS 字节流 ──► Tokens ──► Rules ──► CSSOM ──────┘

  脚本(&lt;script&gt;) ─── 默认阻塞 HTML 解析,且其执行等待 CSSOM 完成
```

### 各阶段做什么

1. **HTML 解析 → DOM 构建**(流式)
   - 边接收边解析,实时产出节点
   - 遇到普通 `&lt;script&gt;` 阻塞解析,直到脚本下载并执行完
   - 遇到 `<link rel="stylesheet">` 不阻塞解析(但阻塞渲染)
2. **CSS 解析 → CSSOM**
   - CSSOM 是"完整树",必须**全部**解析完才能用
   - 因此 **CSS 是 render-blocking 的**
3. **JS 执行**
   - 阻塞 HTML 解析(因为可能 `document.write` / DOM 操作)
   - **等待 CSSOM 完整**:因为 JS 可能读取计算样式(`getComputedStyle`)
4. **Render Tree** = DOM + CSSOM(可见部分)
   - 跳过 `&lt;head&gt;`、`display: none`、`&lt;script&gt;` 这类节点
   - `visibility: hidden` 仍占布局,会在树里
5. **Layout (Reflow)**
   - 自顶向下计算每个 box 的几何(x、y、width、height)
   - 受 viewport、字体、内容长度影响
6. **Paint**
   - 把每个 layer 的内容画到位图
7. **Composite**
   - 把 layer 按层级合成到屏幕

### `&lt;script&gt;` 三种加载方式对比

| 方式                 | 下载 | 执行时机                        | 是否阻塞解析            | 执行顺序               |
| -------------------- | ---- | ------------------------------- | ----------------------- | ---------------------- |
| `<script src>`       | 同步 | 下载完立即执行                  | **阻塞**(下载+执行期间) | 按出现顺序             |
| `<script src async>` | 异步 | 下载完立即执行                  | 仅执行阶段阻塞          | **不确定**(谁先到谁先) |
| `<script src defer>` | 异步 | DOM 完整后(DOMContentLoaded 前) | 不阻塞                  | 按出现顺序             |
| ESM(`type="module"`) | 异步 | 同 defer(默认 defer 语义)       | 不阻塞                  | 按依赖图               |

### 资源 Hint(优化首屏的工具)

- `<link rel="preconnect" href="...">` 提前 DNS + TCP + TLS
- `<link rel="dns-prefetch">` 仅 DNS
- `<link rel="preload" href="..." as="script|style|font">` 高优先级预取(自己控顺序)
- `<link rel="prefetch">` 低优先级,为将来导航准备
- `<link rel="modulepreload">` 预取 ESM 模块及其依赖

## 代码示例

```html
<!-- ❌ 旧式写法:JS 在 head 同步加载,阻塞所有解析 -->
&lt;head&gt;
  <script src="/app.js">&lt;script&gt;      <!-- 阻塞 HTML 解析 -->
  <link rel="stylesheet" href="/a.css"><!-- 阻塞渲染 -->
&lt;head&gt;

<!-- ✅ 现代写法 -->
&lt;head&gt;
  <link rel="preconnect" href="https://cdn.example.com">
  <link rel="stylesheet" href="/critical.css">      <!-- 关键 CSS,小且 inline 更好 -->
  <link rel="preload" href="/app.js" as="script">
  <script src="/app.js" defer>&lt;script&gt;             <!-- 不阻塞解析,DOM 完整后执行 -->
  <link rel="prefetch" href="/next-page.js">
&lt;head&gt;
```

## 易错点 / 反例

### 1. CSSOM 阻塞 JS 执行(很多人不知道)

```html
<link rel="stylesheet" href="/slow.css" />
<!-- 1s 才返回 -->
&lt;script&gt;console.log('hi');&lt;script&gt;
<!-- 即便不依赖 CSS,也要等 CSS 完 -->
```

**根因**:JS 可能调用 `getComputedStyle` / 读 className 后做布局判断,引擎不能赌"这段 JS 不读样式",**保守等 CSSOM 完整**。

**修复**:

- 关键 CSS inline
- 非关键 CSS 用 `media="print"` 标记 + JS 切回(或 onload 提速)
- JS 用 defer,这样它在 DOMContentLoaded 前才执行,自然在 CSSOM 之后

### 2. `async` 顺序不确定的坑

```html
<script src="/dep.js" async>&lt;script&gt;   <!-- 库 -->
<script src="/use-dep.js" async>&lt;script&gt;
<!-- 谁先到谁先执行,可能 use-dep 先跑 → ReferenceError -->
```

**修复**:有依赖关系的脚本用 `defer`(保持顺序);或合并构建产物。

### 3. `document.write` 在解析后调用会清空文档

```js
window.onload = () => {
  document.write('hi'); // ❌ load 后写,整个 document 被替换
};
```

**结论**:任何场景都不要用 `document.write`,旧广告脚本是重灾区。

### 4. 同步 XHR 阻塞主线程

```js
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api', false); // false 同步
xhr.send(); // ❌ 主线程冻结
```

浏览器现在大多警告这种用法,Chrome 109+ 在 unload 期间也禁止了。无脑用 fetch + await。

### 5. 误以为加了 `defer` 就万事大吉

defer 解决"不阻塞解析",但**不影响下载顺序**。如果脚本很大,下载本身慢,还是首屏卡。需要配合 code split + preload + dynamic import 等手段。

## 高频面试题(5 题)

- **Q1**: 浏览器从拿到 HTML 字节到屏幕看到内容,经历哪几个阶段?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  6 个阶段:

  1. **HTML 解析 → DOM**(流式)
  2. **CSS 解析 → CSSOM**(必须完整)
  3. **Render Tree 构建**(DOM + CSSOM,跳过不可见节点)
  4. **Layout**(算几何)
  5. **Paint**(每层画到位图)
  6. **Composite**(合成上屏)

  其中 JS 执行穿插在 DOM 构建中(阻塞解析,等 CSSOM 完整)。

  &lt;details&gt;

- **Q2**: `defer` 和 `async` 有什么区别?分别什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **async**:异步下载,**下载完立刻执行**(可能在 DOM 完整前);执行顺序**不可保证**;适合**独立**的脚本(统计、A/B 工具)
  - **defer**:异步下载,**DOM 解析完毕后**(DOMContentLoaded 前)按声明顺序执行;适合应用主脚本、需要保持依赖顺序的多个脚本
  - ESM(`type="module"`)默认 defer 语义,支持 import 依赖图

  二者都不阻塞 HTML 解析,但 async 的"执行"会临时阻塞解析。

  &lt;details&gt;

- **Q3**: CSS 为什么被称为 "render-blocking"?能解除吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  CSSOM 必须**整体完成**后才能构建 Render Tree,否则可能呈现"无样式闪烁"(FOUC)。所以 CSS 加载没完,渲染就不开始。

  解除/缓解:

  - 关键 CSS inline 在 `&lt;head&gt;`
  - 非关键 CSS 用 `media="print"` 然后 `onload="this.media='all'"` 让它非阻塞
  - HTTP/2 / HTTP/3 + 早期 server push / 103 Early Hints

  &lt;details&gt;

- **Q4**: 为什么 JS 执行要等 CSSOM 完整?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  脚本可能读取 `getComputedStyle` / `element.style` / `offsetWidth` 等依赖样式或布局的 API。引擎无法静态判断"这段 JS 不读样式",所以保守等 CSSOM 完整再执行。

  推论:在 CSS 之后的同步 `&lt;script&gt;`,即便 `console.log('hi')` 这种简单代码也会被 CSS 阻塞。

  &lt;details&gt;

- **Q5**: 从 CRP 角度,优化首屏 LCP 有哪些手段?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **缩短关键资源数量**:关键 CSS 内联 / 删冗余库
  - **缩短关键字节数**:压缩 / Tree-shaking / WebP/AVIF / Brotli
  - **缩短关键路径长度**:并行下载、HTTP/2、CDN
  - **使用 hint**:preconnect / preload / dns-prefetch
  - **JS 优化**:defer / async / dynamic import / 拆 chunk
  - **服务端**:SSR / 流式 HTML / 103 Early Hints
  - **图片**:`fetchpriority="high"` 给 LCP 图片;响应式 / lazy / decoding="async"

  &lt;details&gt;

## 延伸资源

- [MDN: Critical rendering path](https://developer.mozilla.org/zh-CN/docs/Web/Performance/Critical_rendering_path)
- [web.dev: Critical rendering path](https://web.dev/articles/critical-rendering-path)
- [HTML 规范: Parsing](https://html.spec.whatwg.org/multipage/parsing.html)

## (留白) 我的理解

> 这一段不强制填。

---

## 回流(reflow)与重绘(repaint)

## TL;DR

> 修改影响几何 → **reflow**(重新 layout,会顺带 paint);只影响外观 → **repaint**(跳过 layout 直接画);`transform / opacity` 走合成线程,既不 reflow 也不 paint(前提是元素在独立合成层)。

## 背景与动机

60fps = 一帧 16.6ms,其中浏览器需要把 layout / paint / composite 全做完。reflow 是最重的一环:

- 修改一个节点的几何 → 子树乃至父链都要重新计算
- 大列表 / 复杂表格 / flex/grid 嵌套尤其慢

99% 的 "动画卡顿 / 滚动掉帧 / 列表卡顿"都能追到 reflow / paint 上。掌握触发条件能让你:

- 写"零 reflow 动画"(transform + opacity)
- 把状态切换从"实时改属性"改成"批量改 className"
- 用 DevTools Performance 一眼看出问题在哪

## 核心机制

### 三类操作对比

| 操作类型            | 触发                              | 影响范围                    |
| ------------------- | --------------------------------- | --------------------------- |
| **Reflow / Layout** | 改几何属性 / 读布局属性           | 节点 + 子树 + 受影响的父链  |
| **Repaint**         | 改非几何样式(颜色、背景、outline) | 只重画相关层                |
| **Composite Only**  | 改 transform / opacity(独立层)    | 只合成阶段,主线程几乎无成本 |

### 触发 reflow 的"写"操作清单

- DOM 结构变更:appendChild / removeChild / innerHTML / replaceWith
- 几何样式变更:width / height / margin / padding / border / position
- 字体 / `display` 切换 / 内容长度变化
- 窗口 resize / 滚动条出现/消失

### 触发"强制同步布局"的"读"操作

读以下属性会让浏览器**立即**进行 layout(把待处理的写操作 flush 掉),被称为"强制同步布局 / layout thrashing":

- `offsetTop / offsetLeft / offsetWidth / offsetHeight / offsetParent`
- `clientTop / clientLeft / clientWidth / clientHeight`
- `scrollTop / scrollLeft / scrollWidth / scrollHeight`
- `getBoundingClientRect()` / `getClientRects()`
- `getComputedStyle()`(部分属性)
- `innerText`(它要算可见行)
- `focus()` / `scrollIntoView()`

(完整清单见 Paul Irish 的 gist,链接在末尾)

### "布局抖动"(Layout Thrashing)

在循环里**穿插写和读**,每次读都强制重新 layout:

```js
// ❌ 抖动版本
for (const el of items) {
  el.style.width = '100px'; // 写
  console.log(el.offsetWidth); // 读 → 强制 layout
}
// 等于做了 N 次 layout
```

正确做法:**先读后写**(批处理):

```js
// ✅ 批量版本
const widths = items.map((el) => el.offsetWidth); // 一次性读(只 layout 1 次)
items.forEach((el, i) => (el.style.width = widths[i] + 10 + 'px')); // 批量写
```

### 合成阶段的"零 reflow 动画"

```css
.box {
  transition:
    transform 0.3s,
    opacity 0.3s;
}
.box.show {
  transform: translateX(100px);
  opacity: 1;
}
```

- transform / opacity 走合成器线程
- 主线程几乎不参与,即便主线程 JS 卡住,动画仍能流畅
- 前提:该元素在**独立合成层**(详见 `browser-compositing-layers`)

## 代码示例

### 用 `requestAnimationFrame` 把"DOM 写"集中到一帧

```js
// ❌ 在事件回调里直接改样式 + 读尺寸,容易抖
button.onclick = () => {
  panel.style.width = '300px';
  const w = panel.offsetWidth; // 强制 layout
  panel.style.left = w + 10 + 'px';
};

// ✅ 用 rAF 把"写读写"放到同一帧的合适时机
button.onclick = () => {
  requestAnimationFrame(() => {
    panel.style.width = '300px';
    requestAnimationFrame(() => {
      // 此时 layout 已 flush,读不会抖
      const w = panel.offsetWidth;
      panel.style.left = w + 10 + 'px';
    });
  });
};
```

### 用 DocumentFragment 批量插入

```js
// ❌ 逐个 append 触发多次 reflow
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = i;
  ul.appendChild(li); // 每次都可能 reflow
}

// ✅ DocumentFragment 一次性插入
const frag = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = i;
  frag.appendChild(li); // 不在 DOM 树上,不 reflow
}
ul.appendChild(frag); // 1 次 reflow
```

## 易错点 / 反例

### 1. 循环里读 `offsetTop` 触发抖动

真实项目最常见。改成"先读完再写完"立刻有数倍提升。

### 2. 直接修改多个 `.style.X`,而不是切 className

```js
// ❌ 每行潜在触发 layout
el.style.width = '100px';
el.style.height = '100px';
el.style.margin = '10px';

// ✅ 一次切类
el.classList.add('big');
// .big { width:100px; height:100px; margin:10px; }
```

浏览器对样式批处理有优化,但 JS 在两条 `.style` 间插入"读" / `getBoundingClientRect` 仍会强制 flush。

### 3. table 一处改,全表 reflow

table 布局算法会让任一单元格变化触发整张表重新 layout,**且 reflow 范围比 flex / grid 大**。
**修复**:

- 用 `table-layout: fixed` 减小算法范围
- 大型数据展示用虚拟列表代替超长 table

### 4. 不知道哪些操作触发 layout

新手最容易在循环里写 `el.style.transform = ...; console.log(el.offsetTop)`。把读分离出来,养成"先读、批读、再写"的习惯。

### 5. 改 `top` / `left` 做动画

```css
.box {
  transition: left 0.3s;
}
.box.show {
  left: 100px;
}
```

**问题**:`left / top / margin` 触发 reflow,每帧都要 layout,在低端设备掉帧。
**修复**:改用 `transform: translateX(100px)`,走合成线程。

## 高频面试题(5 题)

- **Q1**: reflow 和 repaint 的区别?各自由哪些操作触发?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **reflow**:重新计算节点几何;由 DOM 改变 / 几何样式改变 / 读布局属性(强制同步布局)触发;会顺带 repaint
  - **repaint**:不改几何只重画(颜色 / background / outline / box-shadow 等)
  - **composite only**:transform / opacity(独立层) → 完全跳过 reflow + repaint

  代价:reflow > repaint > composite。

  &lt;details&gt;

- **Q2**: 为什么 `transform: translateX(100px)` 不触发 reflow,但 `left: 100px` 会?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `left / top / margin` 改变元素在文档流中的位置 → 影响兄弟节点排版 → 必须 reflow
  - `transform` 是"在合成阶段做的位移",几何 box 在文档流的位置不变,周围元素不知道它"动了" → 不需要 reflow,只需要在合成阶段重新合成该层

  前提:transform 的元素要在独立合成层(见 `browser-compositing-layers`),否则仍触发 paint。

  &lt;details&gt;

- **Q3**: 什么是"强制同步布局"(forced synchronous layout)?如何避免?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  写完几何属性后立刻读布局相关属性(offsetWidth / getBoundingClientRect / getComputedStyle 等),浏览器为了给出准确数据,必须**立即** flush 待处理的写操作,触发一次同步 layout。

  避免方法:

  - 把"读"集中到所有"写"之前
  - 用 requestAnimationFrame 调度 + 双 rAF 分离读写
  - 用 ResizeObserver / IntersectionObserver 替代轮询读

  &lt;details&gt;

- **Q4**: 怎么定位生产环境的 layout thrashing 问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Chrome DevTools Performance 面板:

  1. 录制一次交互
  2. 看时间轴上的紫色"Layout"块密度
  3. 展开调用链,定位是哪段 JS 触发的
  4. 检查面板里 "Forced synchronous layout" / "Layout shift" 警告

  Lighthouse / PerformanceObserver(`type: 'longtask'` / `'layout-shift'`)能持续监控线上 CLS / TBT。

  &lt;details&gt;

- **Q5**: 改写一个低性能函数,把"反复读写"改成"读写分离"。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```js
  // ❌ 抖动
  function resize(items, factor) {
    for (const el of items) {
      el.style.width = el.offsetWidth * factor + 'px';
    }
  }

  // ✅ 先读完再写完
  function resize(items, factor) {
    const widths = items.map((el) => el.offsetWidth); // 仅 1 次 layout
    items.forEach((el, i) => (el.style.width = widths[i] * factor + 'px'));
  }
  ```

  关键:在循环内"读"会与"写"互相打架,把读全部移到循环外。

  &lt;details&gt;

## 延伸资源

- [MDN: Reflow](https://developer.mozilla.org/zh-CN/docs/Web/Performance/Reflow)
- [Paul Irish: What forces layout / reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [web.dev: Avoid layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)

## (留白) 我的理解

> 这一段不强制填。

---

## CSP 与安全响应头(SRI / HSTS / COOP / COEP)

## TL;DR

> CSP(Content-Security-Policy) 通过响应头声明"哪些来源的资源可以加载/执行",是 XSS 的纵深防线 + 兜底。配合 SRI / HSTS / X-Frame-Options / Permissions-Policy / COOP / COEP 等头,组成现代 Web 安全基线。

## 背景与动机

XSS 防御靠输出编码,但实际工程里总有遗漏:

- 第三方依赖里塞了 `innerHTML`
- SSR 模板转义规则错配
- 老员工写的 `dangerouslySetInnerHTML` 没人审

CSP 是浏览器侧的**二道防线**:即便页面被注入了 XSS payload,浏览器也拒绝执行。CSP + 现代框架默认转义构成 2026 年防御 XSS 的实战组合。

**安全响应头**则解决另一类问题:浏览器有大量默认"宽松"行为(允许嵌入到任何 iframe、允许 HTTP 降级、允许跨源访问敏感 API)。这些行为通过响应头一键收紧。

## 核心机制

### CSP 的语法

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-xyz' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  report-uri /csp-report;
```

### 主要指令

| 指令                                 | 控制                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| `default-src`                        | 兜底,所有 \*-src 未指定时用                          |
| `script-src`                         | JS 加载和执行(包括内联 `&lt;script&gt;`、`onclick=`) |
| `style-src`                          | CSS 加载(包括内联 `style=` 和 `&lt;style&gt;`)       |
| `img-src` / `font-src` / `media-src` | 资源加载                                             |
| `connect-src`                        | fetch / XHR / WebSocket / EventSource                |
| `frame-src` / `frame-ancestors`      | 谁能 iframe 谁 / 本页能被谁 iframe                   |
| `object-src 'none'`                  | 禁用 `&lt;object&gt;` / `&lt;embed&gt;`              |
| `base-uri 'self'`                    | 防 `<base href>` 注入劫持相对路径                    |
| `form-action`                        | form 提交目标                                        |
| `report-uri` / `report-to`           | 违规上报                                             |

### 解决"内联脚本"的三种方式

| 方式               | 写法                                                           | 适合                                       |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------ |
| `'unsafe-inline'`  | `script-src 'unsafe-inline'`                                   | ❌ 等于没 CSP,**不要用**                   |
| **nonce**          | `script-src 'nonce-RANDOM'`&lt;br&gt;`<script nonce="RANDOM">` | 服务端每次生成,**推荐**                    |
| **hash**           | `script-src 'sha256-XXX'`                                      | 静态脚本(已知内容)                         |
| **strict-dynamic** | `script-src 'nonce-X' 'strict-dynamic'`                        | 允许 nonce 脚本动态加载子脚本,**现代推荐** |

### `strict-dynamic`(2026 推荐)

传统 CSP 必须列出所有 `https://cdn.x.com` 之类的来源,大型应用难维护。`strict-dynamic`:

- 信任 nonce 标记的"根脚本"
- 该根脚本动态 `document.createElement('script')` 加载的脚本也被信任
- 不再需要维护一长串 host 白名单

```http
Content-Security-Policy: script-src 'nonce-abc' 'strict-dynamic' 'unsafe-eval'
```

### Subresource Integrity(SRI)

防 CDN 被攻击或被替换:

```html
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-Hash-of-the-file-content..."
  crossorigin="anonymous"
>&lt;script&gt;
```

浏览器下载后校验哈希,不匹配就拒绝执行。**所有引入第三方 CDN 资源的项目都应加 SRI**。

### 其他关键安全头

| 头                                                                        | 作用                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` | HSTS,强制 HTTPS,杜绝 HTTP 降级                         |
| `X-Content-Type-Options: nosniff`                                         | 禁止浏览器猜 MIME,防 polyglot 文件攻击                 |
| `X-Frame-Options: DENY`                                                   | 防 ClickJacking(被 CSP `frame-ancestors` 取代但仍兼容) |
| `Referrer-Policy: strict-origin-when-cross-origin`                        | 限制 Referer 暴露                                      |
| `Permissions-Policy: camera=(), geolocation=()`                           | 控制敏感 API 的可用性                                  |
| `Cross-Origin-Opener-Policy: same-origin` (COOP)                          | 隔离 window.opener,防 tabnabbing                       |
| `Cross-Origin-Embedder-Policy: require-corp` (COEP)                       | 启用 SharedArrayBuffer / 高精度计时                    |
| `Cross-Origin-Resource-Policy: same-origin` (CORP)                        | 资源自身限制谁能加载它                                 |

COOP + COEP 是 Spectre 之后浏览器的高隔离模式("cross-origin isolated"),启用后可用 SharedArrayBuffer / `performance.now()` 高精度。

### report-only 模式(上线前必经)

```http
Content-Security-Policy-Report-Only: script-src 'self'; report-uri /csp-report
```

- **不阻断**,只把违规上报
- 用来"试探"CSP 配置是否破页
- 收集真实违规数据 → 完善白名单 → 切换为强制

## 代码示例

### 完整的"strict CSP"配置

```http
Content-Security-Policy:
  default-src 'none';
  script-src 'nonce-{RANDOM}' 'strict-dynamic';
  style-src 'self' 'nonce-{RANDOM}';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  report-uri /csp-report;
  report-to csp-endpoint;
```

### Express 中生成 nonce

```js
const crypto = require('crypto');

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  res.setHeader(
    'Content-Security-Policy',
    `script-src 'nonce-${res.locals.nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'self'`,
  );
  next();
});

// EJS / Pug 模板里
// <script nonce="<%= nonce %>">...&lt;script&gt;
```

## 易错点 / 反例

### 1. `'unsafe-inline'` / `'unsafe-eval'` 直接破防

```http
script-src 'self' 'unsafe-inline'    # ❌ 等同没 CSP
```

**修复**:用 nonce / hash 替代 inline;eval / new Function 在代码层去掉。

### 2. CSP 过严直接挂页面

```http
default-src 'none'
```

连 `<img src="data:...">` 都加载不出。**先用 report-only 试探**,收集真实违规,再切强制模式。

### 3. 老式行内事���被 CSP 拒

```html
<button onclick="doIt()">
  Go&lt;button&gt;
  <!-- ❌ CSP 默认禁内联事件 -->
</button>
```

**修复**:

```html
<button id="b">Go&lt;button&gt;
<script nonce="...">document.getElementById('b').onclick = doIt;&lt;script&gt;
```

### 4. CSP 不能防 CSRF

不要把 CSP 当 CSRF 防御。CSP 限制的是**资源加载和脚本执行**,CSRF 是**已建立的请求**(浏览器自动带 cookie 那一类),完全不同。

### 5. SRI 必须配 `crossorigin="anonymous"`

```html
<script src="https://cdn.x/a.js" integrity="sha384-...">&lt;script&gt;
<!-- ❌ 没 crossorigin → 浏览器不发 CORS 请求 → 无法读响应体计算 hash -->
```

**修复**:加 `crossorigin="anonymous"`,且 CDN 必须返回 `Access-Control-Allow-Origin: *`。

### 6. HSTS preload 是单向门

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

被列入浏览器 preload 列表后,**所有子域永远走 HTTPS**,即便你撤回也要等数月。误开会让没准备好 HTTPS 的子域不可访问。**确认所有子域都支持 HTTPS 后再加 preload**。

## 高频面试题(5 题)

- **Q1**: CSP 主要解决什么问题?和"输出编码"什么关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  CSP 主要解决 XSS:即便代码注入了 payload,浏览器也拒绝执行未经允许的脚本。它是输出编码(第一道线)失守后的**第二道线**。

  此外 CSP 还能限制:数据外传(`connect-src` 阻止恶意把数据传到攻击者 endpoint)、ClickJacking(`frame-ancestors`)、表单劫持(`form-action`)。

  &lt;details&gt;

- **Q2**: nonce / hash / strict-dynamic 三种方式的区别?现代推荐哪个?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **nonce**:服务端每次响应生成随机串,内联脚本必须带相同 nonce 才能执行 —— 动态站点首选
  - **hash**:`sha256-XXX` 对应脚本内容的哈希 —— 适合静态、内容不变的脚本
  - **strict-dynamic**:被 nonce/hash 信任的"根脚本"可以**动态加载**其他脚本,避免维护一长串 host 白名单

  现代推荐:`nonce + strict-dynamic`,这是 web.dev 的 "Strict CSP" 推荐姿势。

  &lt;details&gt;

- **Q3**: CSP 不能解决哪些问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **CSRF**:浏览器自动带 cookie 是它管不到的(CSP 管资源加载和脚本执行)
  - **数据外传**:可以限制 connect-src 但无法阻止合法域上的代理转发
  - **业务逻辑漏洞**:权限校验 / IDOR / 加密误用,CSP 无关
  - **客户端密钥泄漏**:JS 里有 secret 仍会被前端代码看到
  - **第三方 JS 内部漏洞**:CSP 允许某个域后,该域上脚本的漏洞同样致命

  &lt;details&gt;

- **Q4**: 常见安全响应头有哪些?各防什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Content-Security-Policy**:XSS / 数据外传 / ClickJacking 等
  - **Strict-Transport-Security (HSTS)**:防 HTTP 降级中间人
  - **X-Content-Type-Options: nosniff**:防 MIME sniffing 攻击
  - **X-Frame-Options / frame-ancestors**:防 ClickJacking
  - **Referrer-Policy**:控制 Referer 泄漏敏感 URL
  - **Permissions-Policy**:控制 camera / geolocation / payment 等敏感 API
  - **COOP / COEP / CORP**:跨源隔离,启用 SharedArrayBuffer 高隔离模式

  &lt;details&gt;

- **Q5**: CSP 上线流程应该怎么走?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. **report-only 模式**先上线,只收集违规不阻断
  2. 收集 N 周的 `report-uri` / `report-to` 数据,找出实际加载的所有合法资源
  3. 根据数据完善白名单 / nonce 注入
  4. 切换 `Content-Security-Policy`(强制模式)
  5. 持续监控 report,逐步收紧 → strict-dynamic + nonce 最终态
  6. 灰度发布,先小流量再全量,有问题立刻回滚到 report-only

  &lt;details&gt;

## 延伸资源

- [MDN: Content Security Policy](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)
- [web.dev: Strict CSP](https://web.dev/articles/strict-csp)
- [MDN: HTTP Headers](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers)

## (留白) 我的理解

> 这一段不强制填。

---

## CSRF(跨站请求伪造)

## TL;DR

> CSRF = 在受害者已登录某站的状态下,诱导其浏览器**自动**向该站发请求(因为 Cookie 会自动带上),从而以受害者身份执行操作。防御 = **SameSite Cookie + CSRF Token + Origin/Referer 校验 + 关键操作二次确认**。

## 背景与动机

CSRF 攻击利用浏览器一个"看似合理的便利":**跨站发请求时也会自动带上目标站的 Cookie**。

经典剧情:

1. 受害者登录 `bank.com`,浏览器存了 session cookie
2. 受害者在另一个浏览器标签打开 `evil.com`
3. evil.com 上有 `<img src="bank.com/transfer?to=attacker&amount=10000">`(或 form 自动 submit)
4. 浏览器发请求时**自动带上** bank.com 的 cookie → 银行后端以为是合法请求 → 完成转账

2020 年起 Chrome 默认 `SameSite=Lax`,大幅缓解但**未根除**:

- 老业务可能依赖跨站 Cookie 而显式设为 `None`
- 同站子域 / 同站不同端口的攻击仍存在
- JSON / XHR / form POST 在某些边界条件下仍能发出

CSRF 的核心议题:**不是"如何阻止请求发出"**,而是"如何让服务端识别这个请求不是用户主动发起的"。

## 核心机制

### 攻击载体

```html
<!-- 1. 图片(GET 触发) -->
<img src="https://bank.com/transfer?to=attacker&amount=10000" />

<!-- 2. 自动提交 form(POST 触发) -->
<form action="https://bank.com/transfer" method="POST" id="f">
  <input name="to" value="attacker" />
  <input name="amount" value="10000" />
  &lt;form&gt; &lt;script&gt;document.getElementById('f').submit();&lt;script&gt;

  <!-- 3. fetch(默认不带 cookie,除非 credentials: 'include' + 目标站 CORS 允许) -->
  &lt;script&gt; fetch('https://bank.com/transfer', { method: 'POST', credentials: 'include', // 必须显式,且服务端 CORS
  Allow-Credentials 才生效 body: JSON.stringify({...}), }); &lt;script&gt;
</form>
```

### 防御组合

#### 1. SameSite Cookie(浏览器层防线)

```http
Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Lax
```

| 值       | 含义                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| `Strict` | Cookie 仅同站请求才带 —— 从其他站点点链接过来都不带                           |
| `Lax`    | 多数跨站请求不带;但**顶级导航**(`&lt;a&gt;` / form GET / window.location)仍带 |
| `None`   | 任何跨站都带,**必须配 Secure**(浏览器 2020+ 强制)                             |

Chrome 80+ 默认 `Lax`,Firefox / Safari 跟进。

**关键边界**:Lax 不防"GET 触发的副作用",所以 GET 不该写。Strict 体验差(从邮件点链接到本站会变未登录)。

#### 2. CSRF Token

服务端每次发送页面时,在表单里嵌入一个不可预测的 token,与 session 绑定:

```html
&lt;form&gt;
<input type="hidden" name="csrf_token" value="random-256bit-string" />
... &lt;form&gt;
```

- 提交时服务端比对 token 是否匹配 session
- 攻击站点无法获取 token(同源策略限制读取),无法构造合法请求

#### 3. Double Submit Cookie

- token 同时存 Cookie 和 form/header
- 服务端校验两者是否一致
- 攻击者跨站发请求时,**能让浏览器带上 cookie,但不能读取 cookie 内容**,所以填不进 header

适合纯 API 后端(无 session 存储)。

#### 4. Origin / Referer 检���

服务端在收到非 GET 请求时,校验 `Origin` / `Referer` 头是否在白名单:

```js
function checkOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  return ALLOWED_ORIGINS.some((o) => origin?.startsWith(o));
}
```

- `Origin` 在 fetch / form POST 都带
- `Referer` 可能被代理 / 隐私设置删掉,只做兜底

#### 5. 关键操作二次确认

转账 / 删账号 / 改密码 → 再要密码 / OTP / Captcha。**最后一道防线**,即便前面全失守也兜底。

## 代码示例

### Express 服务端实现 Double Submit

```js
const crypto = require('crypto');

app.get('/page', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf', token, { sameSite: 'lax', secure: true });
  res.render('page', { csrfToken: token });
});

app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const cookieToken = req.cookies.csrf;
    const headerToken = req.headers['x-csrf-token'];
    if (!cookieToken || cookieToken !== headerToken) {
      return res.status(403).send('CSRF token mismatch');
    }
  }
  next();
});
```

### Axios 拦截器自动带 CSRF Token

```js
import axios from 'axios';

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(name + '='))
    ?.split('=')[1];
}

axios.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = getCookie('csrf');
  }
  return config;
});
```

## 易错点 / 反例

### 1. 以为"GET 不写库就安全"

理论上 GET 应该 idempotent / safe,但很多老项目用 GET 做副作用(`/delete?id=5`)。`SameSite=Lax` 对"顶级导航的 GET"是放行的 → 攻击者用 `<a href>` 触发就能成功。

**修复**:任何副作用都用 POST/PUT/DELETE,且严格走 CSRF 防御。

### 2. `SameSite=None` 没配 `Secure`

```http
Set-Cookie: x=1; SameSite=None    ❌ 浏览器拒绝(Chrome 80+)
Set-Cookie: x=1; SameSite=None; Secure  ✅
```

### 3. JSON API 以为天然免疫

有人以为"我用 fetch + JSON body,Content-Type: application/json,跨站请求会被预检挡住":

- 预检确实会挡住"非简单请求"
- 但**简单请求**(text/plain / form-urlencoded / multipart)的 POST 不预检,form 触发的 POST 仍可绕开
- 攻击者可以用 `Content-Type: text/plain` 把 JSON 字符串 POST 出去,绕过预检

**结论**:不要依赖预检做 CSRF 防御。

### 4. Token 放 URL 中

```
GET /transfer?to=x&csrf=abc123
```

- URL 出现在浏览器历史、Referer、access log、第三方分析里 → token 泄漏
- 放 header 或 form body

### 5. 单页应用以为 SameSite 万事大吉

SameSite=Lax 是默认,但:

- 子域名漏洞(`*.example.com` 中一个子域有 XSS,可能能读 cookie)
- 老浏览器(部分老 Safari、嵌入式 WebView)不支持 SameSite,需向下兼容
- 内部跨产品 SSO 场景可能强制 None,失去保护

**纵深防御**:SameSite + Token + Origin 检查,缺一不可。

### 6. XSS 能绕过任何 CSRF 防御

XSS 让攻击者在受害者页面跑 JS → 直接 fetch 自家域 → 浏览器带 cookie 也带 token(因为同域可以读 cookie / DOM) → **CSRF 防御失效**。

**含义**:CSRF 防御**假设你的页面没有 XSS**。XSS 必须独立解决,这是两条不同的攻击线。

## 高频面试题(5 题)

- **Q1**: 描述一次完整的 CSRF 攻击流程。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. 受害者登录 `bank.com`,浏览器持有 session cookie
  2. 受害者打开 `evil.com`
  3. evil.com 触发对 bank.com 的请求(img / form / fetch)
  4. 浏览器**自动带上 bank.com 的 cookie**
  5. bank.com 后端识别为合法 session,执行操作

  攻击成立的两个前提:**浏览器自动带 cookie** + **服务端只靠 cookie 鉴权,不验请求来源**。

  &lt;details&gt;

- **Q2**: `SameSite=Lax` 和 `Strict` 的差别?默认是哪个?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Lax**:多数跨站请求不带 cookie,但**顶级导航的 GET**(用户主动点链接)仍带。Chrome 80+ 默认值
  - **Strict**:所有跨站请求都不带 cookie。最严,但用户体验差(从外站点链接到本站后变未登录)

  实战:登录 / 鉴权 cookie 用 Strict;允许跨站跳转的(SSO / OAuth)用 Lax;真正第三方场景才 None(必须配 Secure)。

  &lt;details&gt;

- **Q3**: CSRF Token 怎么工作?为什么攻击站点拿不到?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  服务端每次发送页面时生成不可预测的 token,放在隐藏 input / meta tag / Cookie 中,与 session 绑定。客户端提交时回传,服务端比对。

  攻击站点拿不到的原因:**同源策略**禁止跨站读取目标站点的 DOM / Cookie。所以 evil.com 无法读 bank.com 页面里的 token,也无法读 SameSite=Strict 的 cookie。

  例外:XSS 漏洞让攻击代码在受害者同源页面执行 → CSRF 防御失效。所以 CSRF 假设无 XSS。

  &lt;details&gt;

- **Q4**: JSON API 是否天然免 CSRF?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **不是**。常见误解:"JSON API 用 `Content-Type: application/json`,跨站 fetch 会被预检挡住"。但:

  - 攻击者可以用 `Content-Type: text/plain` 把 JSON 字符串 POST 出去,绕过预检(simple request)
  - form 提交以 `application/x-www-form-urlencoded` 也是简单请求,不预检

  CORS 预检不是 CSRF 防御机制,而是浏览器对脚本读响应的保护。CSRF 防御必须独立做:SameSite / Token / Origin 校验。

  &lt;details&gt;

- **Q5**: CSRF 和 XSS 的关系?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  是两类独立的攻击,但 XSS 可以击溃所有 CSRF 防御:

  - **CSRF**:攻击者**站外**诱导浏览器发请求,不能读取目标页面任何内容
  - **XSS**:攻击者在目标页面**内**执行 JS,能读 DOM / cookie / 调任意 API

  一旦有 XSS,攻击代码就和受害者页面同源,能读 CSRF Token、cookie,绕过所有防御直接发请求。**因此 XSS 是更严重的漏洞,优先级高于 CSRF**。

  &lt;details&gt;

## 延伸资源

- [OWASP: CSRF](https://owasp.org/www-community/attacks/csrf)
- [OWASP Cheat Sheet: CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: SameSite cookies](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

## (留白) 我的理解

> 这一段不强制填。

---

## XSS(跨站脚本攻击)

## TL;DR

> XSS = 把恶意 JS 注入到他人浏览器里执行。按注入位置分 **反射 / 存储 / DOM 型**;核心防御 = **按上下文输出编码 + CSP + httpOnly Cookie + 用框架(React/Vue 默认转义)**。

## 背景与动机

XSS 是 OWASP Top 10 的常驻"嘉宾"。攻击者目标:

- 偷 Cookie / localStorage / session
- 以受害者身份发请求(伪造 API 调用)
- 改页面 UI(钓鱼登录框 / 改收款账号)
- 挂挖矿 / 弹窗 / 重定向到恶意站

XSS 之所以致命:**一旦你的页面里跑了攻击者的 JS,你能做什么,攻击者也能做什么**。所有"前端安全"措施都建立在"页面 JS 是可信代码"这个前提之上,XSS 直接捅穿这个前提。

## 核心机制

### 三种 XSS 类型

#### 1. 反射型(Reflected XSS)

攻击代码通过 **URL 参数 / 表单**进入,服务端在响应里 echo 回来:

```html
<!-- 服务端模板 -->
&lt;div&gt;搜索结果: {{ query }}&lt;div&gt;

<!-- 受害者点击 http://site.com/s?query=&lt;script&gt;steal()&lt;script&gt; -->
<!-- 渲染结果 -->
&lt;div&gt;搜索结果: &lt;script&gt;steal()&lt;script&gt;&lt;div&gt;
```

受害者**点了链接才中招**,常配合钓鱼邮件 / 短链使用。

#### 2. 存储型(Stored XSS)

攻击代码被持久化(数据库 / 文件),所有访问该页面的用户都中招:

- 评论区写 `&lt;script&gt;...&lt;script&gt;`
- 个人简介 / 昵称里塞 `<img src=x onerror=...>`
- 论坛、留言板、客服系统是重灾区

危害远大于反射型,**主动撒网式**感染。

#### 3. DOM 型(DOM XSS)

**完全发生在前端**,服务端不参与:

```js
// 危险代码
document.querySelector('#welcome').innerHTML = `欢迎 ${location.hash.slice(1)}`;

// 受害者打开 https://site.com/#<img src=x onerror=alert(1)>
// innerHTML 把 hash 当 HTML 解析 → 触发 onerror
```

关键:`innerHTML` / `outerHTML` / `document.write` / `eval` / `setAttribute('on*', ...)` 都能把字符串当代码执行。

### 防御金字塔(从上到下)

| 层级           | 措施                           | 说明                                             |
| -------------- | ------------------------------ | ------------------------------------------------ |
| 1. 框架默认    | React JSX / Vue 模板默认转义   | 80% 的注入点被自动处理                           |
| 2. 上下文编码  | HTML / JS / CSS / URL 各自规则 | 同一个值用在不同位置编码方式不同                 |
| 3. 净化富文本  | DOMPurify                      | 必须渲染用户提供的 HTML 时,白名单过滤            |
| 4. CSP         | 浏览器侧拒绝执行               | 即便代码注入了也不让跑(见 `browser-csp-headers`) |
| 5. Cookie 加固 | httpOnly + Secure + SameSite   | 减小 XSS 后果(偷不到 cookie)                     |
| 6. 监控告警    | report-only CSP / Sentry       | 上线前拦不住,上线后及时发现                      |

### 上下文敏感编码

| 输出位置                            | 编码方式             | 例子                                     |
| ----------------------------------- | -------------------- | ---------------------------------------- |
| HTML body                           | HTML 实体            | `<` → `&lt;`                             |
| HTML attribute                      | 引号+HTML 实体       | `attr="..."` 内的 `"` 转义               |
| `&lt;script&gt;` 内                 | JS string escape     | `\` `'` `"` 转义,**不要从字符串拼 JSON** |
| URL                                 | URL encode           | `encodeURIComponent`                     |
| CSS                                 | CSS escape           | 极少需要,优先避免                        |
| HTML attribute event(`onclick=...`) | **永远禁止用户输入** | 无安全的转义方式                         |

**关键认知**:同一个字符串放进 `innerHTML` 和放进 `href=`,需要的转义完全不同。**不能"一种全能编码包打天下"**。

## 代码示例

### 用 DOMPurify 净化富文本

```js
import DOMPurify from 'dompurify';

const dirty = `&lt;p&gt;hi&lt;p&gt;<img src=x onerror=alert(1)>`;
const clean = DOMPurify.sanitize(dirty);
// 输出: &lt;p&gt;hi&lt;p&gt;<img src="x">
document.getElementById('output').innerHTML = clean;
```

**注意**:即便用 DOMPurify,**只在必须保留 HTML 时**用;能用 `textContent` / 框架转义就别走这条路。

### React 中的危险点

```jsx
// 自动安全
&lt;div&gt;{userInput}&lt;div&gt;            // ✅ JSX 自动转义

// 危险点 1: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // ❌ 必须先 DOMPurify

// 危险点 2: href / src 协议
<a href={userUrl}>link&lt;a&gt;        // ❌ userUrl 可能是 'javascript:alert(1)'

// 修复:校验协议
function safeUrl(u) {
  try {
    const parsed = new URL(u, location.href);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? u : '#';
  } catch { return '#'; }
}
```

## 易错点 / 反例

### 1. `innerHTML` 拼用户输入(永远的坑)

```js
div.innerHTML = `&lt;p&gt;${userInput}&lt;p&gt;`; // ❌
// 修复
div.textContent = userInput; // ✅
```

### 2. `setAttribute('onclick', ...)` 仍然会执行

```js
el.setAttribute('onclick', userInput); // ❌ 等同 onclick="..."
```

**结论**:任何 `on*` 属性 + 用户输入 = XSS。

### 3. `javascript:` URL

```js
a.href = userInput; // ❌ 可能是 'javascript:steal()'
```

**修复**:协议白名单(见上面的 safeUrl)。

### 4. `eval / new Function / setTimeout(string)`

```js
setTimeout('do(' + userInput + ')', 0); // ❌ 字符串形式参数
```

**修复**:传函数而不是字符串。`new Function(str)` / `eval` 在业务代码里几乎没正当用例。

### 5. 框架以为安全,实际 `dangerously*` 没过滤

React 项目里 `dangerouslySetInnerHTML` 是最常见的"以为安全却没过滤"的入口。任何走它的内容,**必须先 DOMPurify**;或者重新审视:能不能用结构化数据 + 组件渲染替代?

### 6. JSON 嵌入 `&lt;script&gt;` 标签

```html
&lt;script&gt; const data = "${JSON.stringify(userInput)}"; // ❌ // userInput =
&lt;script&gt;&lt;script&gt;steal();&lt;script&gt; // → 标签被提前闭合,新的 script 执行 &lt;script&gt;
```

**修复**:对 `<` / `>` / `/` 做 JSON 序列化后再次转义,或用 `<script type="application/json">` + JS 读取。

## 高频面试题(5 题)

- **Q1**: XSS 有哪几种类型?各自的攻击路径?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **反射型**:攻击代码在 URL/表单 → 服务端 echo → 受害者点链接立即触发
  - **存储型**:攻击代码被存到 DB → 所有访问该页的用户中招(评论区 / 简介)
  - **DOM 型**:完全前端,通过 `innerHTML` / `eval` / `setAttribute('on*')` 把 location.hash / input value 当代码执行

  危害排序:存储型 > 反射型 ≈ DOM 型(但 DOM 型最难审计)。

  &lt;details&gt;

- **Q2**: 为什么"输出编码要按上下文"?HTML attr 和 JS string 转义规则一样吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  浏览器解析时,同一字符串在不同位置含义完全不同:

  - HTML body / attribute:`<` `>` `"` `'` `&` 需要 HTML 实体编码
  - JS string 内:`\` `'` `"` 换行需要 JS 转义
  - URL 内:特殊字符需要 `%xx` URL 编码
  - CSS / `style="..."`:CSS 字符串转义

  没有"万能转义",必须根据**最终落地的语法位置**选编码。所谓"前端框架默认转义"指的是 HTML body 上下文,**href / src / 内联 JS 仍需特殊处理**。

  &lt;details&gt;

- **Q3**: `httpOnly` Cookie 解决了什么?不能解决什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **解决**:JS 无法通过 `document.cookie` 读取该 Cookie,XSS 偷不到 session token。

  **不能解决**:

  - XSS 仍可通过 `fetch` / `XHR` 让浏览器自动带上 Cookie 发请求(攻击者无需偷 Cookie,直接发请求即可)
  - localStorage / sessionStorage 里的 token 仍裸奔
  - CSRF(httpOnly 不影响自动带 Cookie 这一行为)

  所以 httpOnly 是"减小爆炸半径",不是"消除 XSS"。

  &lt;details&gt;

- **Q4**: DOMPurify 和"自己写正则过滤 `&lt;script&gt;`"哪个安全?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  DOMPurify 远胜。HTML 解析是状态机,绕过正则的方式数以千计:

  - `&lt;SCRIPT&gt;` 大写
  - `<script\n>` 换行
  - `<img src=x onerror=alert(1)>` 不用 script 标签
  - `<svg onload=alert(1)>`
  - `<a href=javascript:alert(1)>`

  DOMPurify 用真实 HTML 解析 + 白名单(allowed tags/attrs/protocols),覆盖几乎所有已知 vector。**永远不要自己写 HTML 过滤**。

  &lt;details&gt;

- **Q5**: 框架(React / Vue)默认转义,XSS 是不是就不用担心了?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  不能松懈,框架默认转义只覆盖 80%。剩下 20% 是危险口子:

  - React `dangerouslySetInnerHTML` / Vue `v-html`(用户输入入口)
  - 动态 href / src(`javascript:` 协议)
  - 自己用 `document.createElement` + `innerHTML` 操作
  - 服务端模板(SSR 不一定自动转义,或转义规则与客户端不一致)
  - 第三方库内部 `innerHTML`
  - eval / new Function 在依赖里被调用

  XSS 防御是纵深防御:框架转义 + CSP + Cookie 加固 + 监控,**任何一环都不能单独承担全部责任**。

  &lt;details&gt;

## 延伸资源

- [OWASP: XSS](https://owasp.org/www-community/attacks/xss/)
- [OWASP Cheat Sheet: XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)

## (留白) 我的理解

> 这一段不强制填。

---

## 浏览器多层缓存(Memory / Disk / Push / SW)

## TL;DR

> HTTP 缓存命中位置有多层:**Service Worker → Memory Cache → Disk Cache → HTTP/2 Push Cache → 网络**。每层命中条件、生命周期、容量上限都不同;DevTools Network 的 Size 列直接告诉你命中哪层。

## 背景与动机

DevTools 经常看到:

- `(memory cache)` —— 关 tab 即失效
- `(disk cache)` —— 跨 session 持久
- `(service worker)` —— SW 拦截响应
- 一个普通的 304 / 200

它们都是 HTTP 缓存命中,但来源决定:能不能命中、什么时候过期、强刷会发生什么。掌握这些层级:

- 配 CI/CD 时知道为什么 deployment 后用户没刷新到新版
- 优化 LCP 时知道哪些资源能进 memory cache
- 调试"为什么 disable cache 没生效"

## 核心机制

### 请求时的查找顺序

```
fetch / 浏览器请求
   │
   ▼
1. 有 Service Worker 注册? ──► fetch 事件,SW 决定走 cache / network
   │
   ▼
2. Memory Cache (tab 内存)
   │
   ▼
3. Disk Cache (磁盘持久)
   │
   ▼
4. HTTP/2 Push Cache (session 内 server push)
   │
   ▼
5. 真正发起网络请求
```

### 各层对比

| 层                              | 持久性                    | 容量             | 速度       | 受 Cache-Control 影响                  |
| ------------------------------- | ------------------------- | ---------------- | ---------- | -------------------------------------- |
| **Memory Cache**                | tab 关闭即失效            | 通常 ~100MB      | 极快(纳秒) | **几乎不受**,主要看资源在不在 tab 内存 |
| **Disk Cache**                  | 跨 session                | 几百 MB ~ GB     | 慢(毫秒)   | 受 max-age / no-store 等控制           |
| **Push Cache**                  | 当前 session(HTTP/2)      | 小               | 快         | server push 时填入                     |
| **Service Worker CacheStorage** | 持久(直到 SW 注销 + ~24h) | 受 Storage Quota | 中等       | JS 显式 put/match                      |
| **HTTP/3 0-RTT**                | 见 TLS Session            | 协议层           | -          | -                                      |

### Memory Cache 的特殊性

- 浏览器自己决定哪些资源进入(看大小、类型、使用频率)
- **同一 tab 内**重复请求同 URL 极有可能直接命中 memory
- `Cache-Control: no-store` 仍可能进 memory(浏览器内部优化,关 tab 就清)
- DevTools "Disable cache" 勾选 → 跳过 memory & disk

### 强刷(Hard Reload)行为

| 操作                                                 | 行为                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| F5 / `location.reload()`                             | 常规请求,强缓存过期才协商                                                     |
| Cmd+Shift+R / Ctrl+F5                                | 自动加 `Cache-Control: no-cache` + `Pragma: no-cache`,**跳过强缓存**,仍走协商 |
| Cmd+Shift+R + DevTools "Disable cache"               | 跳过所有缓存,等于第一次访问                                                   |
| `immutable` 资源即便强刷也直接读本地副本(现代浏览器) | -                                                                             |

### Service Worker 的颠覆性

SW 注册后,**所有同源请求**(包括非 fetch 发出的)都先过 SW 的 fetch 事件。SW 可以:

- 走 network
- 走 CacheStorage
- 自造响应(完全离线)
- 合并多源(同时请求 + 选最快)

代价:SW 一旦失控(注册了不维护)用户会"被困"在旧版,详见 `browser-service-worker`。

### Storage Quota(浏览器分配的空间)

```js
const { usage, quota } = await navigator.storage.estimate();
// usage:已用字节,quota:可用上限
```

- 桌面 Chrome:默认 ~每个 origin 60% 总磁盘,共享 origin 间
- 移动端:更小且更激进的回收
- 申请持久化:`navigator.storage.persist()`(用户授权后免被自动清理)

## 代码示例

```js
// 看 Storage 占用
const { usage, quota } = await navigator.storage.estimate();
console.log(`${(usage / 1024 / 1024).toFixed(2)} MB used of ${(quota / 1024 / 1024).toFixed(2)} MB`);

// 申请持久化
const persisted = await navigator.storage.persist();
console.log(`Persistent: ${persisted}`);

// CacheStorage 基本用法(在 SW 或主线程都可用)
const cache = await caches.open('v1');
await cache.put('/api/me', new Response(JSON.stringify({...}), {
  headers: { 'Content-Type': 'application/json' },
}));

const cached = await caches.match('/api/me');
if (cached) console.log(await cached.json());
```

## 易错点 / 反例

### 1. memory cache 关 tab 就没

"我刚刚才打开过,为什么又请求了一遍?"

- 重新打开新 tab → memory cache 失效
- disk cache 仍可能命中(看 Cache-Control)

### 2. 强刷不等于"完全无缓存"

F5 / 普通刷新 vs Cmd+Shift+R 行为不同:

- 普通:仍读强缓存
- Hard reload:跳过强缓存但仍走协商
- "+ Disable cache":全跳过

调试时勾上 DevTools "Disable cache",别只靠快捷键。

### 3. 隐身模式磁盘缓存不持久

隐身窗口关闭后所有缓存清空。调试缓存策略时**不要用隐身模式**。

### 4. 跨源资源被 CORP 拒绝缓存

```http
Cross-Origin-Resource-Policy: same-origin
```

受此头保护的资源不能被跨源页面缓存或读取(Spectre 缓解)。SPA 引第三方资源时如遇到 net::ERR_BLOCKED_BY_RESPONSE,先看 CORP / COEP。

### 5. SW 一旦注册成"持久代理",卸载后还要 ~24h

SW 注册后,即便你 `unregister`,部分浏览器在 24 小时内仍可能用旧 SW 拦截。生产事故场景下要主动:

- 推送一个"自杀 SW"(install 后 unregister 所有 SW + 清 CacheStorage)
- 让用户清 origin 数据

### 6. `no-store` 在 memory cache 仍可能有

**规范允许浏览器在 tab 内存里短暂保留 no-store 资源**作为加速,关 tab 即清。所以"no-store 看到 from memory cache" 不是 bug。

## 高频面试题(5 题)

- **Q1**: memory cache 和 disk cache 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **memory cache**:进程内存,tab 关闭即失效;速度极快;浏览器自动管理,不完全遵守 Cache-Control(no-store 可能仍存,关 tab 清)
  - **disk cache**:磁盘持久,跨 session;速度较慢;严格遵守 Cache-Control;受 Storage Quota 限制

  请求时先查 memory,再查 disk,都没再走网络。

  &lt;details&gt;

- **Q2**: 普通刷新(F5)和强刷(Cmd+Shift+R)有什么差别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - F5 / `location.reload()`:正常缓存逻辑,强缓存有效就用,否则协商
  - Cmd+Shift+R / Ctrl+F5:自动加 `Cache-Control: no-cache`,**跳过强缓存**,但仍发协商(304 仍可命中)
  - 再加 DevTools 的 "Disable cache":跳过所有缓存,等同第一次访问

  注意:`immutable` 标记的资源即便强刷也直接读本地副本(现代浏览器)。

  &lt;details&gt;

- **Q3**: 怎么估算和管理应用的缓存空间?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```js
  const { usage, quota } = await navigator.storage.estimate();
  ```

  - usage:已用字节数(IndexedDB / CacheStorage / WebSQL / 文件系统 等)
  - quota:浏览器分配上限(桌面 Chrome 默认 ~ 总磁盘 60%)

  申请持久化:`navigator.storage.persist()`,用户授权后不会被自动清理。普通(best-effort)模式下浏览器在空间紧张时按 LRU 清。

  &lt;details&gt;

- **Q4**: Service Worker 的 CacheStorage 和 HTTP cache 谁优先?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Service Worker 是最先被命中的层 —— **任何同源请求**都先过 SW 的 fetch 事件。SW 可以决定:走 network、走 CacheStorage、合并、自造响应。

  HTTP cache(memory / disk)在 SW **未拦截或选择网络**时才参与。SW 注册后,你看到的 "from memory cache" 实际经过了 SW 的 fetch 然后才被浏览器优化命中。

  &lt;details&gt;

- **Q5**: 隐身模式下缓存行为有什么不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 隐身窗口的 disk cache 是临时的,关闭窗口后**全部清除**(浏览器实现为内存中的"伪磁盘缓存")
  - 隐身模式下 Service Worker 注册仅在该会话有效
  - LocalStorage / IndexedDB / Cookies 也是会话级,关闭即清

  含义:**调试缓存策略不要用隐身模式**;真实用户行为以普通窗口为准。

  &lt;details&gt;

## 延伸资源

- [Chrome DevTools: Network](https://developer.chrome.com/docs/devtools/network)
- [web.dev: Storage for the Web](https://web.dev/articles/storage-for-the-web)
- [MDN: CacheStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/CacheStorage)

## (留白) 我的理解

> 这一段不强制填。

---

## HTTP 缓存(强缓存 / 协商缓存)

## TL;DR

> HTTP 缓存两层:**强缓存**(Cache-Control / Expires,本地直接命中,不发请求) → **协商缓存**(ETag / Last-Modified,发条件请求,服务端 304 或返新内容)。强缓存未命中或过期才走协商。

## 背景与动机

缓存决定网站快不快:

- **强缓存命中**(memory / disk):0ms,根本不发请求
- **协商缓存命中**(304):省下响应体的传输
- **没缓存**:完整请求 + 响应

配错缓存的代价:

- 配过松 → 老版本死活刷不掉(发版后用户看旧 UI)
- 配过严 → 完全不缓存,带宽和延迟全负担
- 配得错 → 跨用户串数据(把 A 的私有响应给了 B)

理解 HTTP 缓存是性能优化、CI/CD 发布、API 设计绕不开的话题。

## 核心机制

### 缓存层级与决策流程

```
请求资源:
  ├─ 强缓存有效(max-age 未过) ──► 直接用本地副本 (status: 200 from cache,不发请求)
  └─ 强缓存失效:
       ├─ 带条件头(If-None-Match / If-Modified-Since)发请求
       │    ├─ 服务端比对一致 ──► 304 Not Modified (无 body,本地副本继续用)
       │    └─ 服务端比对不一致 ──► 200 OK + 新内容
```

### 强缓存:`Cache-Control`(HTTP/1.1)

| 值                | 含义                                                    |
| ----------------- | ------------------------------------------------------- |
| `max-age=N`       | N 秒内强缓存有效                                        |
| `s-maxage=N`      | 同 max-age 但只对**共享缓存**(CDN / 代理)生效           |
| `no-cache`        | 不走强缓存,**每次都协商**(可有效)                       |
| `no-store`        | 完全不缓存,每次重新下载                                 |
| `public`          | 任何缓存层(浏览器 + CDN + 代理)可缓                     |
| `private`         | 只允许**浏览器**缓存,共享缓存不能存(因为可能含用户隐私) |
| `immutable`       | 资源永不变化,浏览器不发协商请求(即便用户强刷)           |
| `must-revalidate` | 强缓存过期后必须重新验证,不能"在网络故障时用过期副本"   |

旧 HTTP/1.0:`Expires: <绝对时间>`,被 `Cache-Control: max-age` 取代,但服务端最好两个都发(兼容老代理)。

### 协商缓存:`ETag` vs `Last-Modified`

**ETag** —— 内容指纹(精确):

```
首次响应:
  ETag: "v3-abc123"

再次请求:
  If-None-Match: "v3-abc123"

服务端比对:相同 → 304;不同 → 200 + 新内容
```

**Last-Modified** —— 最后修改时间(秒级,粗糙):

```
首次响应:
  Last-Modified: Mon, 11 May 2026 10:00:00 GMT

再次请求:
  If-Modified-Since: Mon, 11 May 2026 10:00:00 GMT
```

| 维度           | ETag                                                 | Last-Modified               |
| -------------- | ---------------------------------------------------- | --------------------------- |
| 精度           | 哈希,字节级精确                                      | 秒级,文件 1s 内多次改测不到 |
| 生成成本       | 算哈希(可流式)                                       | 文件系统 mtime,几乎零成本   |
| 跨服务器一致性 | 必须确保多机生成的 ETag 一致(否则负载均衡后命中率低) | mtime 多机可能不一致        |
| 优先级         | 同时发就 ETag 优先                                   | -                           |

### `Vary` 头 —— 区分多份缓存

同 URL 不同响应(语言 / 设备 / 编码):

```http
Vary: Accept-Encoding, Accept-Language
```

缓存键不仅按 URL,还按这些 header 值。常见正确用法:`Vary: Accept-Encoding`(区分 gzip / br)。

**陷阱**:

```http
Vary: User-Agent   ❌
```

每个浏览器版本都是不同的缓存键,命中率几乎为 0。

### 推荐的资源策略

| 资源类型                          | 策略                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------- |
| 带 hash 的静态资源(`app.a3f8.js`) | `Cache-Control: public, max-age=31536000, immutable`(一年永不变)              |
| HTML 入口(`index.html`)           | `Cache-Control: no-cache`(走协商,带 ETag)                                     |
| 用户私有 API                      | `Cache-Control: private, no-store` 或短 max-age                               |
| 公共 API(可代理缓)                | `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600` |

`stale-while-revalidate` 是现代实战利器:返回过期副本同时后台刷新,用户感知 0 延迟。

## 代码示例

```http
# 静态 JS / CSS / 字体(带文件名 hash)
HTTP/1.1 200 OK
Cache-Control: public, max-age=31536000, immutable
ETag: "v3-abc123"

# HTML 入口
HTTP/1.1 200 OK
Cache-Control: no-cache, must-revalidate
ETag: "html-v3-xyz"

# 短缓存 + 后台刷新的 API
HTTP/1.1 200 OK
Cache-Control: public, max-age=60, stale-while-revalidate=600
ETag: W/"weak-789"

# 用户隐私数据
HTTP/1.1 200 OK
Cache-Control: private, no-store
```

## 易错点 / 反例

### 1. `max-age=0` vs `no-cache`

| 写法        | 强缓存           | 协商       |
| ----------- | ---------------- | ---------- |
| `max-age=0` | 立即过期(不命中) | **走协商** |
| `no-cache`  | 直接跳过强缓存   | **走协商** |
| `no-store`  | 不缓存           | 不缓存     |

两者**几乎等价**(都走协商),`no-cache` 语义更明显,推荐用它。

### 2. `private` 不只是"用户专属"

```
Cache-Control: private
```

意味着:

- 浏览器**可以**缓存
- 共享缓存(CDN / 代理)**不能**缓存

很多人以为 `private` 是"不缓存",其实**浏览器仍会缓存到磁盘**。真不想存用 `no-store`。

### 3. 文件名不带 hash + 强缓存 → 用户卡旧版

```html
<!-- ❌ -->
<script src="/app.js">&lt;script&gt;
<!-- HTTP 配 max-age=31536000 后,用户的浏览器一年内不更新 -->

<!-- ✅ -->
<script src="/app.a3f8c2.js">&lt;script&gt;
<!-- 文件名变了等于新 URL,自动绕开旧缓存 -->
```

**HTML 入口必须走协商**,静态资源走文件名 hash + 强缓存。

### 4. 用户强刷(Cmd+Shift+R)无视强缓存

浏览器强刷会自动把请求头加上 `Cache-Control: no-cache`,**绕开强缓存**(协商仍走)。

- `immutable` 关键字让强刷也直接读本地副本(2026 现代浏览器支持)
- 但更"狠"的 `Cmd+Shift+R + DevTools 勾选 Disable cache` 会一并绕过

### 5. `Vary: User-Agent` 让缓存命中率几乎为 0

每个浏览器版本是独立缓存键,CDN 几乎存不了:

```
✅ Vary: Accept-Encoding         (gzip / br 各一份)
✅ Vary: Accept-Language         (zh / en 各一份)
❌ Vary: User-Agent              (千万种 UA → 命中率灾难)
❌ Vary: Cookie                  (每个用户独立 → 几乎不缓存)
```

### 6. ETag 多机不一致

NGINX 默认 ETag 是 `inode-mtime-size`,多台机器的 inode 不同 → 同文件 ETag 不同 → 命中率低。
**修复**:配置内容哈希(`etag_hash`)或关闭 ETag 只用 Last-Modified。

## 高频面试题(5 题)

- **Q1**: 强缓存和协商缓存的区别和触发顺序?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **强缓存**:由 `Cache-Control: max-age` / `Expires` 控制;在有效期内直接用本地副本,**不发请求**(DevTools 显示 "from cache")
  - **协商缓存**:由 `ETag` / `Last-Modified` 控制;**发请求带条件头**,服务端比对一致返回 304(无 body),不一致返回 200 + 新内容

  顺序:先强缓存 → 强缓存过期/缺失 → 协商缓存 → 协商失败 → 完整下载。

  &lt;details&gt;

- **Q2**: `ETag` 和 `Last-Modified` 各有什么优劣?都发了谁优先?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **ETag**:内容哈希,字节级精确,但生成有成本,多服务器需要保证一致
  - **Last-Modified**:文件 mtime,几乎零成本,但**秒级**精度,1s 内多改测不到

  服务端同时返回,客户端再次请求时会同时发 `If-None-Match`(ETag) + `If-Modified-Since`(LM),**服务端优先校验 ETag**(规范规定)。

  &lt;details&gt;

- **Q3**: `Cache-Control: immutable` 有什么用?和 `max-age=31536000` 区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 普通 `max-age=31536000`:用户**强刷**(Cmd+Shift+R)时浏览器仍会发协商请求
  - `immutable`:告诉浏览器"内容永远不变",**连强刷都不发请求**,直接用本地副本

  适合带 hash 的静态资源(`app.a3f8.js`),因为文件名改了就是新 URL,根本不需要重新校验。

  &lt;details&gt;

- **Q4**: `Vary` 头作用?常见坑?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Vary 告诉缓存:同 URL 不同响应,按这些请求头区分缓存键。

  推荐:`Vary: Accept-Encoding`(gzip / br 各存一份)、`Vary: Accept-Language`。

  坑:`Vary: User-Agent`(每个 UA 一份,命中率为 0)、`Vary: Cookie`(每个用户一份,等同不缓存)、`Vary: *`(完全禁用缓存)。

  &lt;details&gt;

- **Q5**: 怎么为一个前端项目设计资源缓存策略?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  通用规则:**入口 HTML 走协商,静态资源走永久强缓存**。

  - `index.html`:`Cache-Control: no-cache` + ETag,确保拿到新版
  - 带 hash 的 JS / CSS / 字体 / 图片:`Cache-Control: public, max-age=31536000, immutable`
  - 不带 hash 的图片(用户上传):较短 max-age 或基于内容路径加版本号
  - API 看业务:可缓的加 `s-maxage` + `stale-while-revalidate`;私有的 `private, no-store`
  - 部署:CDN 边缘 + 浏览器双层,通过文件名 hash 实现"零失效"上线

  &lt;details&gt;

## 延伸资源

- [MDN: HTTP Caching](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)
- [web.dev: HTTP cache](https://web.dev/articles/http-cache)

## (留白) 我的理解

> 这一段不强制填。

---

## Service Worker 生命周期与缓存策略

## TL;DR

> Service Worker 是浏览器为每个 origin 注册的"网络代理 + 后台脚本",独立线程跑,可拦截 fetch、做离线缓存、推送通知。生命周期:**register → install → activate → idle → fetch/message → terminated**;更新时旧 SW 还在控制页面,新 SW 进入 waiting。

## 背景与动机

Service Worker 是把 Web 应用变得"像 native"的核心:

- **离线工作**:断网仍能打开应用
- **资源代理**:精细化控制每个请求(cache-first / network-first / 合并)
- **后台同步 / 推送**:Push API、Background Sync、Periodic Background Sync
- **基础**:PWA / 安装到桌面 / 离线游戏 / 离线编辑器

但 SW 也是双刃剑:**一旦失控,用户会被"困"在旧版**,因为 SW 拦截一切请求,可能永远返回缓存的旧资源。理解生命周期 + 正确更新流程是 SW 实战的核心。

## 核心机制

### 注册与作用域

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}
```

- **作用域**:默认为 sw.js 所在路径下;`scope: '/'` 必须 sw.js 在根目录,或服务端发 `Service-Worker-Allowed: /` 头
- **必须 HTTPS**(localhost 例外)
- 同源限制:跨域 sw.js 不行

### 生命周期

```
┌──────────┐  register()  ┌─────────┐  install 事件  ┌─────────┐
│   none   │ ───────────► │ parsed  │ ─────────────► │ install │
└──────────┘              └─────────┘                └────┬────┘
                                                          │ 旧 SW 仍在控制页面
                                                          ▼
                                                    ┌───────────┐
                                                    │  waiting  │  ← 等所有旧 client 关闭
                                                    └─────┬─────┘
                                                          │ activate 事件
                                                          ▼
                                                    ┌──────────┐  fetch/message  ┌────────────┐
                                                    │ activate │ ──────────────► │ idle/awake │
                                                    └──────────┘                 └────────────┘
                                                                                       │
                                                                                  ~30s 不忙
                                                                                       ▼
                                                                                ┌────────────┐
                                                                                │ terminated │
                                                                                └────────────┘
```

### 关键事件

```js
// sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('v1').then((cache) => cache.addAll(['/', '/app.js', '/style.css'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== 'v1').map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
```

### Workbox 缓存策略对照

| 策略                       | 流程                            | 适合                             |
| -------------------------- | ------------------------------- | -------------------------------- |
| **Cache First**            | 优先 cache,miss 才 network      | 不常变化的静态资源(字体、图标)   |
| **Network First**          | 优先 network,fail 才 cache      | HTML / API,要求新鲜              |
| **Stale While Revalidate** | 返回 cache 的同时后台更新 cache | 偶尔变化但能接受旧版(头像、评论) |
| **Network Only**           | 永远走网络                      | 实时数据 / POST                  |
| **Cache Only**             | 永远走 cache                    | 已知离线资源                     |

### 更新流程(用户卡旧版的源头)

默认行为:新 SW install 完成后进入 **waiting** 状态,等所有控制的 client(tab)关闭才 activate。如果用户一直开着 tab,新 SW 永远 waiting。

**解法**:

```js
// sw.js
self.addEventListener('install', () => {
  self.skipWaiting(); // 立刻进入 activate,不等老 client 关闭
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // 立刻接管所有现有 client
});
```

但这会让旧 tab 突然换 SW,**可能与正在跑的旧代码不兼容** —— 需要配合"主线程检测更新 + 提示用户刷新"。

### "自杀 SW"(紧急止血)

```js
// emergency-sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.navigate(c.url))),
  );
});
```

把 sw.js 替换成这段,所有用户访问后会自动注销旧 SW + 刷新页面。生产事故时的最后手段。

## 代码示例

### 主线程:检测更新并提示用户

```js
async function setupSW() {
  const reg = await navigator.serviceWorker.register('/sw.js');

  reg.addEventListener('updatefound', () => {
    const newSW = reg.installing;
    newSW.addEventListener('statechange', () => {
      if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
        // 新版准备好了,提示用户
        showUpdatePrompt(() => {
          newSW.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// sw.js
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
```

### Workbox 速成

```js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 })],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api', networkTimeoutSeconds: 3 }),
);
```

## 易错点 / 反例

### 1. 注册了 SW 但没维护,用户被困旧版

项目下线 / SW 文件路径变更后,老用户的浏览器继续用旧 SW 拦截请求,返回缓存的旧版 HTML / JS。修不动也卸不掉。
**修复**:任何上线 SW 的项目都必须有"自杀 SW"备用方案。

### 2. activate 阶段没删旧 cache

```js
// ❌ 只创建新 cache,不删旧的
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.open('v2'));
});
// 后果:磁盘里 v1 / v2 / v3 / ... 全留,占满 Quota
```

**修复**:activate 时按版本名删旧 cache(见前面示例)。

### 3. `skipWaiting` 让旧 tab 用错代码

立即激活意味着旧 tab 里跑着旧版 JS,但发请求被新 SW 拦截 → 拿到新版资源 → 可能 schema 不兼容。
**修复**:跟用户确认后再 skipWaiting + reload。

### 4. fetch 拦截了不该拦截的请求

SW fetch 拦截**所有同源请求**,包括第三方分析、广告、第三方字体。某些请求需要透传不要走 cache:

```js
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // 不拦截 POST
  if (!event.request.url.startsWith(self.origin)) return; // 不拦截跨源
  // ...
});
```

### 5. 必须 HTTPS,但开发环境用 localhost 例外

- production: 必须 HTTPS,否则 register 失败
- 开发: `http://localhost` / `http://127.0.0.1` 允许
- 局域网调试(`http://192.168.x.x`): 不允许,只能 HTTPS / `chrome://flags` 临时放开

### 6. SW 不能直接操作 DOM

SW 跑在独立线程,**没有 window / document**。要影响页面必须通过 postMessage 通知主线程,或在主线程里订阅 `controllerchange` 事件。

## 高频面试题(5 题)

- **Q1**: Service Worker 的生命周期是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```
  register → parsed → install → (waiting) → activate → idle → fetch/message → terminated
  ```

  - **install**:首次注册时触发,通常在这预缓存资源
  - **waiting**:新 SW 已 install,但旧 SW 还在控制 client,新 SW 等待
  - **activate**:接管,通常清理旧 cache
  - **idle/awake**:正常工作,空闲 ~30s 后被 terminate(节省资源)

  默认更新需要等所有旧 client 关闭,可用 `self.skipWaiting()` + `self.clients.claim()` 强制立即接管。

  &lt;details&gt;

- **Q2**: Workbox 的 Cache First / Network First / SWR 各适合什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Cache First**:静态资源(字体 / 图标 / 长期 JS),只要在 cache 就直接用,网络只在 miss 时启动
  - **Network First**:HTML / 实时 API,优先拿新版本,失败回退 cache(可能加 networkTimeout 限定回退时机)
  - **Stale While Revalidate**:先返回 cache 让用户立刻看到内容,同时后台 fetch 更新 cache,下次访问就是新版 —— 适合"可以接受暂时旧版"的资源(头像、列表)

  &lt;details&gt;

- **Q3**: SW 更新流程是什么?为什么用户会"卡在旧版"?怎么破?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  默认行为:新 SW install 后进入 waiting,等所有旧 client(tab)关闭才 activate。用户一直开着 tab → 新 SW 永远等待。

  破法:

  - sw.js 里 `self.skipWaiting()` 立即激活(但旧 tab 可能与新 SW 冲突)
  - `self.clients.claim()` 立即接管
  - 主线程监听 `updatefound`,提示用户"有新版,刷新页面",用户确认后再 skipWaiting + reload
  - 紧急情况:推"自杀 SW",注销旧 SW + 清缓存 + 强制刷新

  &lt;details&gt;

- **Q4**: 为什么 Service Worker 必须 HTTPS?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  SW 是一个"持久的、跨页面的中间人",一旦攻击者通过 HTTP 中间人注入恶意 SW,可以**永久接管整个 origin** 的所有请求(直到用户主动清缓存)。HTTPS 保证传输完整性,排除注入攻击。

  例外:localhost / 127.0.0.1 视为安全 context(便于开发)。

  &lt;details&gt;

- **Q5**: Service Worker 和 Web Worker 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  | 维度     | Service Worker                       | Web Worker        |
  | -------- | ------------------------------------ | ----------------- |
  | 用途     | 网络代理 + 后台                      | 主线程外跑计算    |
  | 生命周期 | 跨 tab / 跨 session 持久             | 跟当前 tab 绑定   |
  | API      | fetch 事件、CacheStorage、Push、Sync | 计算 / Worker API |
  | 数量     | 每个 origin 一个                     | 一个 tab 可有多个 |
  | DOM 访问 | 不能                                 | 不能              |
  | 通信     | postMessage / Channel                | postMessage       |

  SW 是"网络层中间件",Web Worker 是"计算线程",定位完全不同。

  &lt;details&gt;

## 延伸资源

- [MDN: Service Worker API](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
- [web.dev: Service Worker Lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [Workbox 文档](https://developer.chrome.com/docs/workbox/)

## (留白) 我的理解

> 这一段不强制填。

---

## CORS(跨源资源共享)

## TL;DR

> CORS 通过响应头 `Access-Control-Allow-*` 让目标服务器声明"允许哪些源、方法、header"。**简单请求**直接发,**非简单请求**先发 OPTIONS 预检;带 cookie(credentials)时 `Allow-Origin` 不能用 `*`。

## 背景与动机

SOP 默认禁止跨源读响应,CORS 提供受控放行机制:

- 浏览器替开发者把"安全检查"做了(对比 fetch / XHR 默认就报错)
- 由**目标服务器**(被请求方)决定是否允许,而不是发起方
- 配合"预检"让服务器对潜在危险的请求(自定义 header / 非幂等方法)有先验告知机会

学好 CORS 的标志:

- 看 DevTools 一眼判断哪条头缺了
- 知道为什么 `Allow-Origin: *` 不能配 credentials
- 知道为什么 fetch 报"CORS error",JS 里 catch 拿不到具体 status

## 核心机制

### 简单请求(simple request)— 不预检直接发

全部满足才算简单:

- 方法: `GET` / `HEAD` / `POST`
- 自定义 header **不超出**[CORS-safelisted](https://fetch.spec.whatwg.org/#cors-safelisted-request-header) 范围(Accept / Accept-Language / Content-Language / Content-Type / Range)
- `Content-Type` 只能是: `text/plain` / `application/x-www-form-urlencoded` / `multipart/form-data`
- 不附 ReadableStream body
- (Fetch 后期补充)不带某些事件监听器

**任何**不满足 → 升级为非简单请求,要发预检。

### 非简单请求 — 预检 OPTIONS

浏览器先发:

```http
OPTIONS /api HTTP/1.1
Origin: https://a.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: x-auth, content-type
```

服务器响应:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: x-auth, content-type
Access-Control-Max-Age: 86400
```

合规 → 浏览器再发真请求;不合规 → fetch reject "CORS error"。

### 关��响应头

| 头                                           | 出现在    | 含义                                         |
| -------------------------------------------- | --------- | -------------------------------------------- | ---------------------------------- |
| `Access-Control-Allow-Origin: &lt;origin&gt; | \*`       | 简单/预检都需要                              | 允许的源;带 credentials 时不能 `*` |
| `Access-Control-Allow-Methods`               | 预检      | 允许的方法                                   |
| `Access-Control-Allow-Headers`               | 预检      | 允许的自定义请求头                           |
| `Access-Control-Allow-Credentials: true`     | 简单/预检 | 允许带 cookie                                |
| `Access-Control-Max-Age: 86400`              | 预检      | 预检结果缓存(s),不重复预检                   |
| `Access-Control-Expose-Headers`              | 简单      | JS 可读的额外响应头(默认只能读"safelisted")  |
| `Vary: Origin`                               | 简单      | 缓存按 Origin 区分(防止 CDN 把 A 的响应给 B) |

### credentials 模式(带 cookie)

```js
fetch('https://api.b.com/me', { credentials: 'include' });
```

要让请求带 cookie 并允许 JS 读响应,服务端必须:

```http
Access-Control-Allow-Origin: https://a.com    # ⚠ 不能是 *
Access-Control-Allow-Credentials: true
Vary: Origin                                   # 必加,缓存隔离
```

- `credentials: 'include'` 任何源都带
- `'same-origin'`(默认): 同源带,跨源不带
- `'omit'`: 永远不带

### 浏览器自动遮蔽 status 与 body

跨源 fetch 失败时(CORS error / 网络层失败 / 协议错):

- `Promise.reject(TypeError)`
- **JS 拿不到 status / body**,只看到 "Failed to fetch"
- 真实错误在浏览器 DevTools 的 Console + Network 标签里

这是为安全(防止时序探测 / 内网扫描),代价是 debug 不便。

### `Access-Control-Max-Age` 减少预检

每个非简单请求都发预检会浪费一次往返。`Max-Age` 让浏览器缓存"这一对 origin+endpoint+方法"的预检结果若干秒,期间不再预检。

**Chrome 上限 7200s (2h),Firefox 24h**。配 86400 在 Chrome 仍被截为 7200。

## 代码示例

### Express CORS 中间件(手写)

```js
function cors(req, res, next) {
  const origin = req.headers.origin;
  const allowed = ['https://a.com', 'https://b.com'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth');
    res.setHeader('Access-Control-Max-Age', '7200');
    return res.status(204).end();
  }
  next();
}
```

### 客户端读取自定义响应头

```js
const res = await fetch('/api', { headers: { 'x-trace': 'abc' } });
const trace = res.headers.get('x-server-trace'); // ❌ null,默认看不到

// 修复:服务端添加
// Access-Control-Expose-Headers: X-Server-Trace
```

## 易错点 / 反例

### 1. `Allow-Origin: *` + credentials → 浏览器拒绝

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true     # ❌ 互斥,浏览器报错
```

**修复**:把 `*` 换成具体 origin(动态根据请求 origin echo 回去)。

### 2. CORS error 看不到具体原因(只在 JS 里 catch)

```js
try {
  const res = await fetch('https://api.b.com/x');
} catch (e) {
  // e 只是 TypeError: Failed to fetch
  // 真正原因要看 DevTools Network → 选中请求 → Console 错误信息
}
```

**记忆**:CORS 错误**永远在 DevTools 看**,不要在 JS 里靠 catch 调试。

### 3. 误以为 CORS 防 CSRF

**CORS 是发起方端的限制**(JS 读不到响应),不阻止请求发出。`&lt;form&gt;` 跨源 POST、`<img src>` GET 仍然发出且带 cookie。
**结论**:CSRF 必须独立防(SameSite + Token + Origin 校验)。

### 4. Authorization / Cookie / Set-Cookie 默认不暴露给 JS

```js
const res = await fetch('/api');
res.headers.get('Authorization'); // ❌ null
```

**修复**:服务端 `Access-Control-Expose-Headers: Authorization`(但 Cookie / Set-Cookie 永远不能被 JS 读,无视任何 Expose)。

### 5. 通配符 `Allow-Headers: *` 在 credentials 模式下不工作

```http
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: *           # ❌ 在 credentials 模式下 * 不视为通配
```

**修复**:在 credentials 模式必须显式列出 header(逐个写明)。

### 6. 没加 `Vary: Origin` → CDN 把 A 的响应给 B

```http
Access-Control-Allow-Origin: https://a.com
# 没加 Vary: Origin
```

CDN 按 URL 做缓存键,把 `Allow-Origin: a.com` 的响应缓存,后续 b.com 命中后**收到 a 的 origin header** → b 浏览器报 CORS 错误。
**修复**:动态 echo origin 时**必须** `Vary: Origin`。

## 高频面试题(5 题)

- **Q1**: 简单请求和非简单请求有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **简单请求**(全部满足):

  - GET / HEAD / POST
  - Content-Type 仅限 text/plain / application/x-www-form-urlencoded / multipart/form-data
  - 不带自定义 header(只允许 CORS-safelisted 范围内)
  - 不附 ReadableStream

  **非简单请求**:任何条件不满足都升级,浏览器先发 `OPTIONS` 预检,服务端响应 `Access-Control-Allow-*` 合规才发真请求。

  &lt;details&gt;

- **Q2**: `Access-Control-Allow-Origin: *` 有什么限制?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - 不能与 `Access-Control-Allow-Credentials: true` 共存(浏览器拒绝)
  - 不能用于带 cookie 的请求(`credentials: 'include'`)
  - 不能让 JS 读到 `Authorization` 等敏感响应头(需具体 origin + Expose-Headers)

  生产推荐:服务端动态读 request 的 `Origin` 头 → 校验白名单 → echo 回去 + 加 `Vary: Origin`。

  &lt;details&gt;

- **Q3**: `credentials: 'include'` 需要服务端怎么配?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  服务端必须返回:

  - `Access-Control-Allow-Origin: <具体 origin>`(不能是 `*`)
  - `Access-Control-Allow-Credentials: true`
  - 推荐 `Vary: Origin`(防止 CDN 缓存混淆)

  客户端要带 `credentials: 'include'`(fetch)或 `xhr.withCredentials = true`。三方任一缺一就不带 cookie。

  &lt;details&gt;

- **Q4**: 预检结果怎么缓存?能缓多久?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  服务端响应 `Access-Control-Max-Age: <秒数>`,浏览器在该时间内对同 origin + endpoint + 方法的非简单请求**不再发预检**。

  上限:

  - Chrome: 7200s (2h)
  - Firefox: 24h
  - Safari: 看版本

  Max-Age 是优化往返的关键 —— 大流量项目里能砍掉一半 OPTIONS 请求。

  &lt;details&gt;

- **Q5**: CORS error 怎么排查?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. DevTools Network 找到失败请求,看 Console 红字提示(浏览器会写明具体原因:缺哪个头 / 哪个不匹配)
  2. 检查 OPTIONS 预检的响应头是否包含:
     - `Access-Control-Allow-Origin`(且匹配请求的 Origin)
     - `Access-Control-Allow-Methods`(包含真请求的方法)
     - `Access-Control-Allow-Headers`(包含所有自定义 header)
  3. 带 cookie 时:检查 `Allow-Credentials: true` + `Allow-Origin` 不是 `*`
  4. 跨子域时:检查 `Vary: Origin` 是否加,CDN 是否错乱缓存
  5. 真请求被防火墙 / 网关挡也会显示 CORS error(因为缺响应头),先看响应是不是 200

  &lt;details&gt;

## 延伸资源

- [MDN: CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [Fetch spec: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [Chrome: Private Network Access](https://developer.chrome.com/blog/private-network-access-preflight)

## (留白) 我的理解

> 这一段不强制填。

---

## 跨源通信手段(JSONP / 代理 / postMessage / WebSocket / document.domain)

## TL;DR

> CORS 之外的跨源通道:**JSONP**(古老,只 GET,XSS 风险) / **反向代理**(工程最常用,nginx / vite proxy) / **postMessage**(窗口 / iframe 双向通信) / **WebSocket / SSE**(协议层,服务端验 Origin) / **document.domain**(已废弃)。

## 背景与动机

虽然 CORS 是标准方案,但实战里经常遇到:

- 后端不归你管,改不动 CORS 头
- 测试环境域名一堆,挨个配 CORS 烦
- 子域之间已合作多年但没 CORS

这时需要其他跨源通道。掌握每种方式的适用场景、限制、安全坑,能让你不被 "CORS 报错" 困住。

## 核心机制

### 1. JSONP(史前方案,几乎已退役)

原理:利用 `<script src>` **不受 SOP 限制**:

```html
<!-- 1. 全局定义 callback -->
&lt;script&gt;
  function onUserLoaded(user) { console.log(user); }
&lt;script&gt;
<!-- 2. 加载跨源脚本,服务端返回 onUserLoaded({...}) -->
<script src="https://api.other.com/user?callback=onUserLoaded">&lt;script&gt;
```

服务端响应是 **JS 代码**(`onUserLoaded({"name":"Alice"})`),浏览器执行就触发 callback。

**限制**:

- 只能 GET(因为是 script src)
- 没有规范的错误处理(脚本加载失败拿不到 status)
- **XSS 重大风险**:接口控制 JS 代码,攻击者控 endpoint 等于完全控你

**现代地位**:CORS 普及后基本不用。第三方库可能还会"如果不支持 fetch / CORS,fallback JSONP",检查依赖时遇到注意。

### 2. 反向代理(工程实战首选)

让前端只发同源请求,后端转发到真实 API:

```
浏览器 ── /api/x ──► 前端服务器(nginx) ── (转发) ──► api.b.com/x
        ◄────响应───◄────────────────────◄──────────────
        (浏览器看是同源,完全绕过 CORS)
```

#### Vite / Webpack 开发代理

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.b.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
};
```

**注意**:**开发服务器代理生产无效**,生产要在 nginx / Cloudflare Workers / CDN 边缘配。

#### Nginx 反代

```nginx
location /api/ {
  proxy_pass https://api.b.com/;
  proxy_set_header Host api.b.com;
  proxy_set_header X-Real-IP $remote_addr;
}
```

**优点**:完全绕过 CORS、可统一鉴权、可加缓存。
**代价**:多一跳网络、需要服务端运维。

### 3. postMessage(窗口 / iframe 通信)

唯一受 SOP **允许**的跨源 DOM 通信通道:

```js
// 父页面
iframe.contentWindow.postMessage({ type: 'sync', data: ... }, 'https://child.com');

// 子页面
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://parent.com') return;   // ⚠ 必须验
  // ...
});
```

**变体**:

- **MessageChannel**:建立私有信道(两个 port),避免广播被截
- **BroadcastChannel**:同源多 tab 广播(不跨源)
- **SharedWorker**:多 tab 共享一个 Worker 实例

详细安全规范见 `browser-same-origin-policy`。

### 4. WebSocket / SSE(协议层跨源)

WebSocket 握手时浏览器自动加 `Origin` 头:

```http
GET /ws HTTP/1.1
Host: ws.b.com
Upgrade: websocket
Origin: https://a.com
```

**服务端**决定是否接受;无 CORS 预检,无 `Access-Control-*` 头。WebSocket 完全在 SOP 之外。

类似地,**Server-Sent Events** (`EventSource`) 走的是 HTTP,但**不受 CORS 限制的"读响应"约束**(浏览器允许 JS 读 SSE 流),前提是服务端响应 `Content-Type: text/event-stream` 并允许 origin。

**意味着**:WebSocket / SSE 的"防 CSRF / 防滥用"完全由服务端在握手时校验 `Origin` 头实现,不能依赖浏览器 SOP。

### 5. `document.domain`(2025+ 已废弃)

传统做法:同 site 的多个子域显式声明同一个 `document.domain`:

```js
// 在 sub.a.com 和 www.a.com
document.domain = 'a.com';
// 之后 iframe / window.opener 可互相读 DOM
```

**2022+ Chrome 默认 Origin-Agent-Cluster**,`document.domain = ...` 静默失效。
**替代**:用 `postMessage` 或同源化部署(部署到同一域)。

### 6. CORS 模式下的图片 / 音视频(跨源资源 CORS)

`&lt;img&gt;` / `&lt;video&gt;` 默认跨源加载但 canvas 导出会 taint:

```html
<img src="https://other.com/a.png" crossorigin="anonymous" id="i" />
```

- 服务端 `Access-Control-Allow-Origin: *` → 浏览器允许"完全访问像素"。
  否则导出 ImageData 时报 SecurityError(tainted canvas)。

## 代码示例

### Express 简单代理(生产慎用)

```js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://api.b.com',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  }),
);
app.listen(3000);
```

### postMessage 实战:父窗口和 iframe 双向同步

```js
// 父
const channel = new MessageChannel();
iframe.contentWindow.postMessage({ type: 'INIT' }, 'https://child.com', [channel.port2]);
channel.port1.onmessage = (e) => console.log('from child:', e.data);
channel.port1.postMessage({ hello: 'world' });

// 子
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://parent.com') return;
  const port = e.ports[0];
  port.onmessage = (msg) => {
    port.postMessage({ echo: msg.data });
  };
});
```

## 易错点 / 反例

### 1. JSONP 接 untrusted endpoint = XSS

服务端返回 JS 直接执行,如果 endpoint 被攻击或本身就是恶意,等同于在你站点跑任意脚本。**只对完全可信的服务用 JSONP**(现代项目基本没场景)。

### 2. webpack/vite 开发代理生产环境无效

新人最常见的"开发能跑生产挂":

- 开发:`/api/x` → vite proxy → api.b.com,无 CORS
- 生产:`/api/x` 直接 fetch 自家域,nginx 没配代理 → 404 或 CORS

**修复**:确保**生产部署链路**有同样的反向代理(nginx / CDN 边缘 / API Gateway),不要把 vite proxy 当生产方案。

### 3. postMessage 不校验 origin

```js
window.addEventListener('message', (e) => {
  doSomething(e.data); // ❌ 任意 iframe 都能控你
});
```

详细安全规范见 `browser-same-origin-policy`。

### 4. WebSocket 服务端不校验 Origin

WebSocket 协议自带 `Origin` 头,但**协议本身不强制服务端校验**。攻击者用其他源的页面发起 WebSocket 连接,浏览器会带上受害者 cookie,服务端如果不验 Origin → CSRF over WebSocket。
**修复**:服务端在 `wss://` 握手时白名单 Origin。

### 5. SSE 用 `EventSource` 不支持 credentials 简写

```js
const es = new EventSource('https://api.b.com/stream'); // ❌ 默认不带 cookie
const es2 = new EventSource(url, { withCredentials: true }); // ✅
```

对应服务端要 CORS 配置(同 fetch credentials)。

### 6. document.domain 在新 Chrome 静默不生效

2022+ Chrome 默认 Origin-Agent-Cluster,`document.domain = 'a.com'` 不报错但不起作用。新代码不要写;老代码迁移到 postMessage。

## 高频面试题(5 题)

- **Q1**: JSONP 的工作原理?为什么不安全?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  原理:利用 `<script src>` 标签不受 SOP 限制,前端预定义 callback 函数,服务端返回 `callback({...})` 形式的 JS 代码,浏览器执行触发 callback。

  不安全原因:

  - 服务端控制 JS 代码,等同于注入第三方 JS。endpoint 被攻击 / 内容篡改 → XSS
  - 只能 GET,无错误处理
  - CSRF 风险(GET 跨源带 cookie)

  现代项目几乎不再使用,CORS / 反向代理是标准方案。

  &lt;details&gt;

- **Q2**: 怎么用反向代理"解决"跨源?有什么坑?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  做法:前端发请求到自己域(如 `/api/x`),服务端 nginx / API Gateway 转发到真实后端。浏览器看是同源,完全绕过 CORS。

  坑:

  - 开发用 vite/webpack proxy,**生产必须**单独配 nginx,否则部署后 404
  - 代理多一跳网络延迟,大流量要考虑性能
  - 鉴权 cookie 传递要确认(`changeOrigin` + `proxy_set_header Host`)
  - 长连接 / WebSocket 代理要单独配 `proxy_http_version 1.1` + Upgrade 头

  &lt;details&gt;

- **Q3**: postMessage 安全使用清单?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  发送端:

  - `targetOrigin` 必须指定具体源,不要 `*`
  - 不要把敏感数据放进可被截获的渠道

  接收端:

  - 校验 `event.origin` 在白名单
  - 校验 `event.data` 结构(用 schema)
  - 用 `MessageChannel` 建立私有信道,避免被旁路监听
  - 不在 message handler 里调 eval / innerHTML

  &lt;details&gt;

- **Q4**: WebSocket 是否走 CORS 预检?跨源时怎么受控?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  WebSocket **不走 CORS 预检**,浏览器握手时自动加 `Origin` 头,**由服务端**决定是否接受连接。

  这意味着:

  - 没有 `Access-Control-Allow-Origin` 概念
  - 跨源攻击防护**完全在服务端**:必须校验 `Origin` 白名单,否则 CSRF over WebSocket 风险

  Server-Sent Events(EventSource)是 HTTP,但浏览器允许跨源读取流,前提是服务端正确配 CORS(类似 fetch)。

  &lt;details&gt;

- **Q5**: `document.domain` 现状如何?新项目该用什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **已废弃**:2022+ Chrome 默认 Origin-Agent-Cluster,`document.domain = 'x.com'` 不报错但不起作用;Firefox / Safari 跟进中。

  原因:document.domain 让原本不同源的子域成"同源",绕过本应的隔离,Spectre 之后被视为漏洞。

  替代方案:

  - 子域间通信:postMessage / BroadcastChannel
  - 共享状态:同域部署 / 共享后端 + 短鉴权 token
  - 已有依赖 document.domain 的旧代码:逐步迁出,设 `Origin-Agent-Cluster: ?0` 暂时禁用 Cluster 隔离

  &lt;details&gt;

## 延伸资源

- [MDN: postMessage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)
- [Vite: server.proxy](https://vite.dev/config/server-options#server-proxy)
- [Nginx: proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

## (留白) 我的理解

> 这一段不强制填。

---

## 同源策略(SOP)

## TL;DR

> 同源 = **scheme + host + port** 三者全同;SOP 防止 a.com 的脚本读取 b.com 的 DOM / Cookie / 响应。例外:`&lt;script&gt;` / `&lt;img&gt;` / `&lt;iframe&gt;` 等标签可加载跨源,但 JS 拿不到内容详情。`postMessage` 是跨源的合法窗口。

## 背景与动机

1995 年网景引入 SOP,是 Web 安全的**第一块基石**。没有它:

- 任何站点的 JS 都能读取你银行的 Cookie
- 钓鱼网站能 fetch 你邮箱的内容
- 嵌入恶意 iframe 能读父页的表单数据

SOP 的核心比喻是"领土主权":每个 origin 是独立国家,JS 在自己国家有完全权限,但**不能跨境读取**别国数据。

SOP 不是单一规则,而是**一组针对不同资源类型的限制**。理解每条限制 + 何时可以放行(CORS / postMessage / 反向代理)是写跨域代码的基础。

## 核心机制

### "同源"的精确定义

**scheme + host + port 三者必须完全相同**:

| URL A               | URL B                | 是否同源                       |
| ------------------- | -------------------- | ------------------------------ |
| `https://a.com/foo` | `https://a.com/bar`  | ✅                             |
| `https://a.com`     | `http://a.com`       | ❌ scheme 不同                 |
| `https://a.com`     | `https://a.com:8443` | ❌ port 不同(默认 443 vs 8443) |
| `https://a.com:443` | `https://a.com`      | ✅ port 443 是 https 默认,等价 |
| `https://a.com`     | `https://sub.a.com`  | ❌ host 不同(但**同站**)       |
| `https://a.com`     | `https://www.a.com`  | ❌ 严格不同源                  |

### SOP 限制的行为(跨源时禁止)

| 资源                                              | 跨源能做         | 跨源不能做                             |
| ------------------------------------------------- | ---------------- | -------------------------------------- |
| DOM                                               | -                | 读父/子页 DOM(除非同源)                |
| Cookie / localStorage / IndexedDB                 | -                | 读取另一 origin 的存储                 |
| `fetch` / `XHR`                                   | 发请求           | 读响应体(除非 CORS)                    |
| `<script src>`                                    | 加载 + 执行      | 读源码                                 |
| `&lt;img&gt;` / `&lt;audio&gt;` / `&lt;video&gt;` | 加载 + 显示      | 读像素(`canvas.getImageData` 会 taint) |
| `<link rel="stylesheet">`                         | 加载 + 应用      | 读规则(CSSOM 跨源限制)                 |
| `&lt;iframe&gt;`                                  | 嵌入             | 读 iframe 内容 / DOM                   |
| `&lt;canvas&gt;`                                  | 把跨源图片画上去 | 之后导出像素(被 taint)                 |

### "同源" vs "同站"(SameSite)

**同站**(same-site)宽于同源:scheme 相同 + **eTLD+1**(可注册域名)相同即可。

| URL A                 | URL B                 | 同源         | 同站                          |
| --------------------- | --------------------- | ------------ | ----------------------------- |
| `https://a.com`       | `https://a.com`       | ✅           | ✅                            |
| `https://a.com`       | `https://sub.a.com`   | ❌           | ✅                            |
| `https://www.a.com`   | `https://api.a.com`   | ❌           | ✅                            |
| `https://a.com`       | `https://a.org`       | ❌           | ❌                            |
| `https://a.com`       | `http://a.com`        | ❌           | ❌ scheme 不同                |
| `https://github.io/x` | `https://github.io/y` | ❌(顶级独立) | ❌(因为 github.io 是公共后缀) |

- **SOP** 用 origin
- **SameSite Cookie** 用 same-site
- **fetch** 用 origin(默认 cross-origin 即禁读)
- 现代浏览器还有 **same-site cookie** + **same-origin iframe** 等细分概念

### 跨源通信的合法通道

1. **CORS**(详见 `browser-cors`)— 服务器声明允许的跨源 fetch
2. **postMessage** — 窗口 / iframe 之间显式通信
3. **WebSocket** / SSE — 协议层,服务端验 Origin 头决定
4. **反向代理** — 前端发到自己域,后端转发(从浏览器角度是同源,详见 `browser-cross-origin-tricks`)

### `postMessage`(跨源通信的标准方式)

```js
// 父页面
iframe.contentWindow.postMessage({ type: 'hi', data: 1 }, 'https://child.com');

// iframe 内
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://parent.com') return; // ⚠ 必须验 origin
  if (event.data.type === 'hi') {
    // ...
  }
});
```

**安全清单**:

- 发送端必须指定 targetOrigin(不要用 `*`)
- 接收端必须校验 `event.origin`
- 校验 `event.data` 的格式(防止恶意结构)
- 用 `MessageChannel` 建立"私有信道",避免广播被截

### `document.domain`(已废弃)

传统上多子域可设 `document.domain = 'a.com'` 强制"同源":

```js
// 在 sub.a.com 和 www.a.com 两边都设
document.domain = 'a.com';
// 之后两边可互相读 DOM
```

**2025+ Chrome 默认废弃**:Origin-Agent-Cluster 默认开启,document.domain 无效。**新代码不要用**,改 postMessage。

### tabnabbing(target="\_blank" 漏洞)

```html
<a href="https://evil.com" target="_blank">点这里&lt;a&gt;</a>
```

新标签里的 evil.com 可以通过 `window.opener.location = 'fake-login.com'` **改原标签**(navigation 不受 SOP 限制)。

**修复**:`rel="noopener noreferrer"`(现代浏览器对 target="\_blank" 已默认 noopener,但写出来更稳)。

## 代码示例

### 安全的 postMessage 模板

```js
// 父页面: parent.com
const iframe = document.createElement('iframe');
iframe.src = 'https://child.com/widget';
iframe.onload = () => {
  iframe.contentWindow.postMessage(
    { type: 'INIT', token: 'abc' },
    'https://child.com', // ⚠ 指定 origin
  );
};

// iframe: child.com
const ALLOWED_ORIGINS = ['https://parent.com'];
window.addEventListener('message', (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) return;
  if (typeof event.data !== 'object' || !event.data.type) return;

  switch (event.data.type) {
    case 'INIT':
      // 安全使用 event.data.token
      break;
  }
});
```

## 易错点 / 反例

### 1. 误以为"同站点 = 同源"

`sub.a.com` 和 `www.a.com` **不同源**(SOP 严格);但**同站**(SameSite Cookie 视角)。

- 想跨子域共享 cookie:Cookie 设 `Domain=.a.com`
- 想跨子域跨源 fetch:仍需 CORS

### 2. postMessage 不验 origin → 全站洞

```js
window.addEventListener('message', (e) => {
  doSomething(e.data); // ❌ 任何 iframe / popup 都能控你
});

// 修复
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://trusted.com') return;
  doSomething(e.data);
});
```

### 3. postMessage 发敏感数据用 `*`

```js
otherWindow.postMessage(secretToken, '*'); // ❌ 任意窗口能截获
otherWindow.postMessage(secretToken, 'https://trusted.com'); // ✅
```

### 4. 修改 document.domain "解决"跨子域

```js
document.domain = 'a.com'; // 2025+ Chrome 默认禁用
```

**修复**:改 postMessage ��� BroadcastChannel(同源跨 tab)。

### 5. tabnabbing(老代码到处都是)

```html
<a href="https://x.com" target="_blank"
  >link&lt;a&gt;
  <!-- ❌ -->
  <a href="https://x.com" target="_blank" rel="noopener noreferrer"
    >link&lt;a&gt;
    <!-- ✅ --></a
  ></a
>
```

现代浏览器对 `target="_blank"` 已默认 noopener,但显式写更安全(老浏览器 + window.open 通道仍要手动)。

### 6. `&lt;img&gt;` 跨源加载后画到 canvas → taint

```js
const img = new Image();
img.src = 'https://other.com/img.png';
img.onload = () => {
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, 1, 1); // ❌ SecurityError: tainted canvas
};

// 修复:img 配 crossorigin + 服务端 CORS 允许
img.crossOrigin = 'anonymous';
```

## 高频面试题(5 题)

- **Q1**: "同源"的精确定义?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **scheme + host + port 三者完全相同**:

  - `https://a.com` 和 `http://a.com` 不同(scheme)
  - `https://a.com` 和 `https://a.com:8443` 不同(port)
  - `https://a.com` 和 `https://sub.a.com` 不同(host)

  注意:`https://a.com:443` 等价于 `https://a.com`(443 是 https 默认端口)。"同源"严于"同站"。

  &lt;details&gt;

- **Q2**: SOP 限制了哪些行为?哪些"看似跨源但其实允许"?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **限制**:跨源读 DOM / Cookie / localStorage、跨源 fetch 读响应体、跨源读 iframe 内容、跨源画到 canvas 后导出像素

  **允许**:`<script src>` / `&lt;img&gt;` / `<link rel=stylesheet>` / `&lt;iframe&gt;` 加载跨源资源(但 JS 拿不到响应详情)、表单 POST 到跨源、`&lt;a&gt;` 链接跨源跳转

  这种"宽松加载 + 严格读取"的设计兼顾了内容嵌入和数据隔离。

  &lt;details&gt;

- **Q3**: postMessage 安全使用清单?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  发送端:

  - `targetOrigin` **必须**指定具体源,不要用 `*`(防止数据被任意窗口截获)

  接收端:

  - 校验 `event.origin` 在白名单内
  - 校验 `event.data` 类型 / 结构(防止 polyglot 攻击)
  - 复杂场景用 `MessageChannel` 建立私有信道

  进一步:用 schema 校验(zod / json-schema)给 message 数据加结构约束。

  &lt;details&gt;

- **Q4**: "同源(origin)" 和 "同站(SameSite)" 有什么区别?用在哪?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **同源** = scheme + host + port 全同
  - **同站** = scheme + eTLD+1(可注册域名)相同,允许子域差异

  用场景:

  - **同源**:SOP / CORS / iframe DOM 访问
  - **同站**:SameSite Cookie / 一些"宽松"的浏览器行为(history 共享、storage 隔离)

  `sub.a.com` 和 `api.a.com`:不同源但同站。

  &lt;details&gt;

- **Q5**: tabnabbing 是什么?怎么防?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `target="_blank"` 打开的新标签里的页面,可通过 `window.opener` 改原标签 URL(navigation 不受 SOP 限制),实现"原标签被劫持到钓鱼登录页"。

  防御:

  - `rel="noopener noreferrer"`(opener 为 null)
  - 现代浏览器对 `target="_blank"` 已默认 noopener,但显式写更稳
  - `window.open` 也要手动 `win.opener = null`

  &lt;details&gt;

## 延伸资源

- [MDN: Same-origin policy](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [HTML spec: Origin](https://html.spec.whatwg.org/multipage/origin.html)
- [web.dev: same-site / same-origin](https://web.dev/articles/same-site-same-origin)

## (留白) 我的理解

> 这一段不强制填。

---

## 小程序双线程架构与 setData 通信

## TL;DR

> 微信小程序不是普通 H5。它采用**逻辑层 JSCore + 视图层 WebView** 的双线程架构,两层通过 Native bridge 通信。`setData` 是逻辑层驱动视图更新的核心通道,也是性能瓶颈高发点。

## 背景与动机

小程序运行在宿主 App 里,目标是:

- 比 H5 更安全,不能随便操作 DOM / BOM
- 比原生开发更轻量,用前端语法写界面和逻辑
- 能调用宿主能力,如扫码、支付、位置、文件等
- 多端一致,由微信客户端统一管理运行环境

因此小程序没有直接给开发者浏览器 DOM 权限,而是拆成两层:

- **逻辑层**:运行 JS,处理数据、事件、API 调用
- **视图层**:渲染 WXML / WXSS,展示 UI

两层不在同一个 JS 上下文里,必须通过宿主 Native 做中转。

## 核心机制

### 双线程模型

```text
┌──────────────────────── 微信客户端 Native ────────────────────────┐
│                                                                    │
│  ┌───────────────┐        bridge         ┌───────────────────────┐ │
│  │ 逻辑层 JSCore  │  ────────────────▶   │ 视图层 WebView          │ │
│  │ App/Page JS    │  ◀────────────────   │ WXML/WXSS 渲染          │ │
│  └───────────────┘        事件回传        └───────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

特点:

- 逻辑层不能直接操作 DOM
- 视图层不能直接访问业务 JS 变量
- 数据从逻辑层到视图层靠 `setData`
- 用户事件从视图层传回逻辑层
- 宿主 Native 负责转发、序列化、调度和能力调用

### 逻辑层

逻辑层负责:

- 执行 `app.js`、页面 JS、组件 JS
- 管理页面生命周期
- 处理事件回调
- 调用 `wx.*` API
- 执行 `setData` 更新视图数据

页面示例:

```js
Page({
  data: {
    count: 0,
  },
  add() {
    this.setData({ count: this.data.count + 1 });
  },
});
```

`this.data` 是逻辑层的数据快照,模板里用到的数据要通过 `setData` 同步到视图层。

### 视图层

视图层负责:

- 根据 WXML / WXSS 渲染界面
- 响应用户触摸、输入、滚动等事件
- 把事件传给逻辑层
- 根据逻辑层传来的 data patch UI

模板示例:

```xml
&lt;view&gt;{{ count }}&lt;view&gt;
<button bindtap="add">+1&lt;button&gt;
```

这里 `bindtap="add"` 不是 DOM 的 addEventListener,而是小程序事件系统把点击事件封装后传给逻辑层的 `add` 方法。

### `setData` 的本质

`setData` 做两件事:

1. 修改逻辑层 `this.data` 中对应字段
2. 把变更数据序列化后通过 bridge 发送给视图层

```js
this.setData({
  'user.name': 'Alice',
  list: newList,
});
```

注意:只有 `setData` 才会触发视图更新。直接改 `this.data` 不会更新界面:

```js
this.data.count += 1; // ❌ 逻辑层变了,视图层不知道
this.setData({ count: 1 }); // ✅ 同步到视图层
```

### bridge 通信成本

因为逻辑层和视图层隔离,`setData` 不是内存里普通赋值,而是跨上下文通信。成本来自:

- 数据序列化 / 反序列化
- Native bridge 转发
- 视图层接收后 patch
- 大数据可能阻塞渲染和交互

所以小程序性能优化里第一条通常是:**减少 setData 次数和单次数据量。**

### 多 WebView 页面栈

小程序页面通常由多个 WebView 承载。页面跳转时:

- 新页面入栈
- 旧页面可能保留
- 返回时旧页面恢复

这解释了为什么小程序有页面栈限制、页面生命周期和普通 SPA 路由不一样。

## 代码示例

### 正确:只传变化字段

```js
Page({
  data: {
    user: { name: 'Alice', age: 18 },
    list: [],
  },
  updateName() {
    this.setData({
      'user.name': 'Bob',
    });
  },
});
```

不要每次传整个大对象:

```js
this.setData({
  user: { ...this.data.user, name: 'Bob' },
});
```

如果 `user` 很大,这会造成不必要的 bridge 数据量。

### 合并多次更新

```js
// ❌ 多次跨 bridge
this.setData({ a: 1 });
this.setData({ b: 2 });
this.setData({ c: 3 });

// ✅ 一次跨 bridge
this.setData({ a: 1, b: 2, c: 3 });
```

## 易错点 / 反例

### 1. 直接改 `this.data`

```js
this.data.count++;
```

这只改逻辑层数据,不会通知视图层。必须用 `setData`。

### 2. 一次 `setData` 传巨大列表

```js
this.setData({ list: tenThousandItems });
```

大数据跨 bridge 会明显卡顿。应分页、虚拟列表、只传必要字段或局部路径更新。

### 3. 高频事件里频繁 `setData`

```js
onPageScroll(e) {
  this.setData({ scrollTop: e.scrollTop });
}
```

滚动事件触发频繁,每次跨 bridge 会拖慢页面。应节流或只在必要节点更新。

### 4. 把小程序当普通浏览器写

小程序没有直接 DOM API,也不能依赖 window / document。需要使用小程序提供的组件、选择器查询和 `wx.*` API。

### 5. 数据字段过深过杂

模板绑定一个巨大复杂对象,会让维护和更新都变重。页面 data 应只放渲染所需数据,非渲染状态放普通实例字段。

## 高频面试题(5 题)

- **Q1**: 小程序为什么采用双线程架构?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  为了安全、管控和跨端一致。逻辑层运行 JS,视图层负责渲染,两者隔离后开发者不能直接操作 DOM / BOM,宿主可以统一转发事件、控制渲染、提供 Native 能力。

  &lt;details&gt;

- **Q2**: `setData` 做了什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `setData` 同时更新逻辑层 `this.data` 和视图层数据。它会把变更对象序列化,通过 Native bridge 发给视图层,视图层再根据新数据更新 UI。

  &lt;details&gt;

- **Q3**: 为什么直接修改 `this.data` 不会刷新页面?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  因为视图层和逻辑层不在同一个上下文。直接改 `this.data` 只影响逻辑层内存,没有通过 bridge 通知视图层,所以 UI 不会更新。

  &lt;details&gt;

- **Q4**: 小程序性能为什么经常卡在 `setData`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `setData` 是跨线程 / 跨上下文通信,涉及序列化、Native bridge 转发和视图层 patch。调用过频或数据过大都会阻塞渲染和交互。

  &lt;details&gt;

- **Q5**: 小程序和普通 H5 的最大架构差异是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  H5 通常 JS 和 DOM 在同一浏览器上下文中,可直接操作 DOM。小程序逻辑层和视图层隔离,开发者不能直接操作 DOM,必须通过数据绑定和 `setData` 驱动视图。

  &lt;details&gt;

## 延伸资源

- [微信小程序开发指南](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信小程序运行机制](https://developers.weixin.qq.com/miniprogram/dev/framework/MINA.html)
- [Page API](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)

## (留白) 我的理解

> 这一段不强制填。

---

## 小程序页面 / 组件生命周期与通信

## TL;DR

> 小程序由 **Page 页面** 和 **Component 自定义组件** 组成。页面生命周期管理页面栈和展示状态,组件生命周期管理组件实例创建、挂载、移动和销毁;组件通信主要靠 `properties` 向下传值、`triggerEvent` 向上通知。

## 背景与动机

小程序不是单页 React/Vue 应用,它有自己的页面栈和组件系统:

- 页面由 `Page()` 注册
- 自定义组件由 `Component()` 注册
- 页面跳转会触发页面栈变化
- 组件实例随页面渲染创建和销毁
- 页面生命周期和组件生命周期交织执行

理解生命周期能解决很多问题:

- 数据应该在 `onLoad` 取还是 `onShow` 取
- 返回页面为什么没有重新 `onLoad`
- 组件什么时候能读 properties
- 什么时候可以查询节点尺寸
- 父子组件如何同步状态

## 核心机制

### Page 生命周期

常见页面生命周期:

| 生命周期        | 触发时机                            | 常见用途                    |
| --------------- | ----------------------------------- | --------------------------- |
| `onLoad(query)` | 页面加载,一个页面实例只调用一次     | 读取路由参数、初始化数据    |
| `onShow()`      | 页面显示 / 从后台切回 / 返回当前页  | 刷新可能变化的数据          |
| `onReady()`     | 页面初次渲染完成,一次               | 节点查询、创建动画 / canvas |
| `onHide()`      | 页面隐藏,如跳到新页面或切后台       | 暂停定时器、停止音视频      |
| `onUnload()`    | 页面卸载,如 redirect / navigateBack | 清理资源、取消请求          |

示例:

```js
Page({
  data: { id: '', detail: null },

  onLoad(query) {
    this.setData({ id: query.id });
    this.fetchDetail(query.id);
  },

  onShow() {
    // 返回本页时可能需要刷新轻量状态
  },

  onUnload() {
    this.abortController?.abort();
  },
});
```

### `onLoad` vs `onShow`

| 场景                   | 用哪个     |
| ---------------------- | ---------- |
| 读取页面参数           | `onLoad`   |
| 首次初始化稳定数据     | `onLoad`   |
| 每次页面显示都要刷新   | `onShow`   |
| 从详情页返回列表后刷新 | `onShow`   |
| 清理页面级资源         | `onUnload` |

常见错误是所有请求都写在 `onShow`,导致每次返回页面都重复请求。也不要把必须刷新的状态只写在 `onLoad`,否则返回页面时数据旧。

### Component 基本结构

```js
Component({
  properties: {
    title: String,
    count: {
      type: Number,
      value: 0,
    },
  },

  data: {
    internalOpen: false,
  },

  methods: {
    handleTap() {
      this.triggerEvent('change', { value: this.data.count + 1 });
    },
  },
});
```

对应使用:

```xml
<counter-card title="计数" count="{{count}}" bind:change="onCounterChange" />
```

### Component 生命周期

新写法推荐用 `lifetimes`:

```js
Component({
  lifetimes: {
    created() {
      // 组件实例刚创建,不能 setData
    },
    attached() {
      // 组件进入页面节点树,可初始化
    },
    ready() {
      // 组件布局完成,可查询节点
    },
    detached() {
      // 组件离开页面节点树,清理资源
    },
  },
});
```

常见生命周期:

| 生命周期   | 含义         | 注意                       |
| ---------- | ------------ | -------------------------- |
| `created`  | 实例刚创建   | 不能调用 `setData`         |
| `attached` | 进入节点树   | 可读 properties,常做初始化 |
| `ready`    | 组件布局完成 | 可查询节点尺寸             |
| `moved`    | 组件被移动   | 少见                       |
| `detached` | 离开节点树   | 清定时器 / 事件监听        |
| `error`    | 组件方法抛错 | 错误处理                   |

### 页面生命周期进入组件

组件可以通过 `pageLifetimes` 感知所在页面状态:

```js
Component({
  pageLifetimes: {
    show() {
      this.refresh();
    },
    hide() {
      this.pause();
    },
    resize(size) {
      this.relayout(size);
    },
  },
});
```

适合组件内部需要响应页面显示 / 隐藏的场景,比如播放器、图表、定位组件。

### 父子通信

#### 父 → 子:properties

```xml
<user-card user="{{user}}" />
```

```js
Component({
  properties: {
    user: Object,
  },
});
```

#### 子 → 父:triggerEvent

```js
Component({
  methods: {
    select() {
      this.triggerEvent('select', { id: this.data.id });
    },
  },
});
```

```xml
<user-card bind:select="onSelectUser" />
```

#### 获取组件实例:selectComponent

```js
const child = this.selectComponent('#child');
child.open();
```

这种方式耦合高,适合调用命令式方法,不要当常规数据流。

### behaviors:复用组件逻辑

```js
const selectable = Behavior({
  data: { selected: false },
  methods: {
    toggle() {
      this.setData({ selected: !this.data.selected });
    },
  },
});

Component({
  behaviors: [selectable],
});
```

behavior 类似 mixin,可复用 properties、data、methods、lifetimes。缺点是来源隐式,复杂项目要谨慎使用。

## 代码示例

### 列表页返回后刷新

```js
Page({
  data: { list: [] },
  needRefresh: false,

  onLoad() {
    this.fetchList();
  },

  onShow() {
    if (!this.needRefresh) return;
    this.needRefresh = false;
    this.fetchList();
  },

  goDetail(e) {
    this.needRefresh = true;
    wx.navigateTo({ url: `/pages/detail/index?id=${e.currentTarget.dataset.id}` });
  },
});
```

### 组件事件向上传递

```js
Component({
  properties: {
    value: Number,
  },
  methods: {
    add() {
      this.triggerEvent('change', { value: this.properties.value + 1 });
    },
  },
});
```

```xml
<counter value="{{count}}" bind:change="onChange" />
```

## 易错点 / 反例

### 1. 把所有请求都放在 `onShow`

`onShow` 每次页面显示都会触发,包括从子页面返回、从后台切回。重请求可能造成闪烁和浪费。首次初始化优先 `onLoad`,确实要每次刷新才放 `onShow`。

### 2. 在组件 `created` 里 `setData`

`created` 时组件还未进入节点树,不能调用 `setData`。初始化渲染数据放 `data` 默认值或 `attached`。

### 3. 组件直接修改父页面数据

子组件不应该通过 `getCurrentPages()` 找父页面再改 data。正确方式是 `triggerEvent` 通知父组件,由父组件更新自己的状态。

### 4. 滥用 `selectComponent`

命令式调用会让父组件强依赖子组件内部方法。普通数据流用 properties + event,只有弹窗 open/close 这类命令适合实例调用。

### 5. behavior 过度复用

behavior 会把字段和方法混入组件,来源不明显,命名冲突也难追踪。简单重复逻辑可以复用,复杂业务不要堆 behavior。

### 6. 忘记清理定时器和监听

页面 `onUnload` / 组件 `detached` 里应清理定时器、全局事件、长连接,否则页面销毁后仍可能执行回调。

## 高频面试题(5 题)

- **Q1**: `onLoad` 和 `onShow` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `onLoad` 是页面实例加载时触发,一个页面实例只执行一次,适合读路由参数和初始化。`onShow` 是页面每次显示时触发,包括返回页面和从后台切回,适合刷新会变化的数据。

  &lt;details&gt;

- **Q2**: 小程序组件怎么做父子通信?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  父传子用 `properties`,子传父用 `triggerEvent` + 父组件 `bind:event`。需要调用子组件命令式方法时可用 `selectComponent`,但不适合做常规数据同步。

  &lt;details&gt;

- **Q3**: 组件 `created`、`attached`、`ready` 分别适合做什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `created` 实例刚创建,不能 setData;`attached` 进入节点树,可读取 properties 并初始化;`ready` 布局完成,适合查询节点尺寸、初始化依赖布局的逻辑。

  &lt;details&gt;

- **Q4**: `pageLifetimes` 有什么用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `pageLifetimes` 让组件感知所在页面的 show / hide / resize 等生命周期。适合播放器、图表、定位组件这类需要随页面显示隐藏暂停和恢复的组件。

  &lt;details&gt;

- **Q5**: behaviors 和 Vue mixin / React custom hook 相比有什么风险?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  behaviors 会把 data、methods、lifetimes 混入组件,复用方便但来源隐式,可能命名冲突、逻辑难追踪。复杂业务过度使用会降低可维护性。

  &lt;details&gt;

## 延伸资源

- [微信小程序 Page 参考](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)
- [微信小程序自定义组件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/)
- [组件生命周期](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html)

## (留白) 我的理解

> 这一段不强制填。

---

## 小程序性能优化(setData / 分包 / 渲染)

## TL;DR

> 小程序性能核心抓三件事:**少传 setData、少阻塞首屏、少渲染无用节点**。因为逻辑层和视图层跨 bridge 通信,大数据和高频更新比普通 Web 更容易造成卡顿。

## 背景与动机

小程序性能问题常见表现:

- 首次打开慢
- 页面切换卡
- 滚动掉帧
- 输入延迟
- 长列表卡顿
- 点击后 UI 反馈慢
- 低端机更明显

根因通常不是单点,而是多因素叠加:

- 包体积大,下载和解析慢
- 首屏请求串行太多
- `setData` 数据量大或频率高
- WXML 节点过多
- 图片未压缩或尺寸过大
- 长列表一次性渲染
- 页面生命周期里重复请求和重复渲染

## 核心机制

### 优化优先级

```text
启动 / 首屏
  ├─ 控制主包体积
  ├─ 分包和预下载
  ├─ 减少首屏同步逻辑
  └─ 图片和静态资源优化

运行时
  ├─ setData 次数和数据量
  ├─ 长列表渲染
  ├─ 高频事件节流
  └─ 避免无用节点和复杂样式
```

先优化首屏和 setData,收益通常最大。

### `setData` 优化

原则一:只传变化字段。

```js
// ❌ 传整个对象
this.setData({ user: nextUser });

// ✅ 只传变化路径
this.setData({ 'user.name': nextName });
```

原则二:合并多次更新。

```js
// ❌ 多次 bridge 通信
this.setData({ loading: true });
this.setData({ list });
this.setData({ loading: false });

// ✅ 一次更新最终状态
this.setData({ loading: false, list });
```

原则三:非渲染数据不要放 data。

```js
Page({
  data: {
    list: [], // 模板要用,放 data
  },
  rawMap: null, // 模板不用,放实例字段
});
```

`data` 里的字段会进入视图层同步链路。纯逻辑缓存、请求控制器、临时 map 不要放进 data。

### 高频事件节流

滚动、触摸、输入都可能高频触发:

```js
onPageScroll(e) {
  if (Date.now() - this.lastUpdate < 100) return;
  this.lastUpdate = Date.now();
  this.setData({ scrollTop: e.scrollTop });
}
```

更好的做法是尽量避免把每一帧滚动位置同步进 data,只在跨阈值时更新:

```js
onPageScroll(e) {
  const showBackTop = e.scrollTop > 600;
  if (showBackTop === this.data.showBackTop) return;
  this.setData({ showBackTop });
}
```

### 长列表优化

长列表问题:

- WXML 节点多
- setData 数据大
- 图片多
- 滚动时 layout 和渲染压力大

常见策略:

- 分页加载,不要一次性渲染全部
- 只保留必要字段
- 图片懒加载
- item 组件化,减少页面复杂度
- 虚拟列表 / recycle-view 方案
- 使用稳定 key,避免重复重建

```xml
<image lazy-load src="{{item.cover}}" />
```

### 分包加载

小程序有主包和分包:

- 主包放启动必需页面和公共资源
- 分包放非首屏、低频功能
- 用户进入分包页面时再加载对应分包

配置示例:

```json
{
  "pages": ["pages/home/index"],
  "subPackages": [
    {
      "root": "packageShop",
      "pages": ["pages/detail/index", "pages/order/index"]
    }
  ]
}
```

原则:

- 首页、登录、核心 tab 留主包
- 活动页、详情页、后台管理类页面进分包
- 大型依赖尽量只被分包引用,避免进主包

### 分包预下载

用户进入某些页面后,可预下载后续高概率访问的分包:

```json
{
  "preloadRule": {
    "pages/home/index": {
      "network": "wifi",
      "packages": ["packageShop"]
    }
  }
}
```

预下载不是越多越好,否则浪费流量和资源。只预下载高概率路径。

### 首屏优化

首屏优化 checklist:

- 主包体积尽量小
- 首屏只请求必要接口
- 非关键数据延后请求
- 骨架屏先展示结构
- 图片使用合适尺寸和压缩格式
- 避免 `onLoad` 同步执行重计算
- 首屏组件不要一次性挂太多

错误示例:

```js
onLoad() {
  this.fetchUser();
  this.fetchBanner();
  this.fetchRecommend();
  this.fetchAllProducts();
  this.fetchUnreadMessages();
}
```

如果只有 user 和 banner 是首屏必要,其他应延后或懒加载。

### WXS 的使用边界

WXS 可以在视图层执行部分轻量逻辑,减少逻辑层和视图层通信:

```xml
<wxs module="format">
module.exports.price = function(value) {
  return '¥' + value.toFixed(2)
}
&lt;wxs&gt;
&lt;view&gt;{{format.price(price)}}&lt;view&gt;
```

适合轻量格式化,不适合复杂业务逻辑。复杂逻辑仍应放 JS 逻辑层。

## 代码示例

### 只在阈值变化时 setData

```js
Page({
  data: { fixedHeader: false },

  onPageScroll(e) {
    const fixedHeader = e.scrollTop > 120;
    if (fixedHeader === this.data.fixedHeader) return;
    this.setData({ fixedHeader });
  },
});
```

### 非渲染缓存不进 data

```js
Page({
  data: {
    visibleList: [],
  },
  fullList: [],

  async onLoad() {
    this.fullList = await fetchLargeList();
    this.setData({ visibleList: this.fullList.slice(0, 20) });
  },
});
```

### 分页追加时只传新增后的轻量列表

```js
Page({
  data: { list: [] },

  async loadMore() {
    const next = await fetchNextPage();
    const list = this.data.list.concat(
      next.map(({ id, title, cover }) => ({
        id,
        title,
        cover,
      })),
    );
    this.setData({ list });
  },
});
```

## 易错点 / 反例

### 1. 把接口原始大对象整个放 data

接口返回 100 个字段,模板只展示 5 个字段。应映射成视图模型再 `setData`,减少 bridge 传输和模板复杂度。

### 2. 高频滚动持续 setData

每次 `onPageScroll` 都更新 `scrollTop` 是典型性能坑。多数场景只需要判断是否超过阈值。

### 3. 主包塞进所有页面和依赖

主包越大,冷启动越慢。低频页面、活动页、大型业务模块应拆分包。

### 4. 分包拆了但公共依赖仍进主包

如果大依赖被主包页面 import,即使分包页面也用它,它仍可能进入主包。要检查依赖引用路径。

### 5. 首屏请求串行瀑布

```js
const user = await fetchUser();
const config = await fetchConfig(user.id);
const list = await fetchList(config.type);
```

没有真实依赖关系的请求应并行。非首屏数据应延后。

### 6. Skeleton 尺寸不稳定

骨架屏如果和真实内容高度差太大,加载完成后会明显跳动。应保持布局尺寸一致。

## 高频面试题(5 题)

- **Q1**: 小程序性能优化最核心的点是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  控制主包和首屏加载、优化 `setData`、减少无用渲染。尤其是 `setData` 跨逻辑层和视图层 bridge 通信,调用频繁或数据过大会造成明显卡顿。

  &lt;details&gt;

- **Q2**: `setData` 应该怎么优化?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  合并多次调用、只传变化字段、避免传大对象、非渲染数据不放 data、高频事件节流、列表分页 / 虚拟化。核心是减少调用次数和单次数据量。

  &lt;details&gt;

- **Q3**: 小程序分包解决什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  分包把非首屏和低频页面从主包拆出去,减少主包下载、解析和启动成本。用户访问分包页面时再加载对应代码,也可以按高概率路径做预下载。

  &lt;details&gt;

- **Q4**: 长列表为什么容易卡?怎么优化?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  长列表会带来大量 WXML 节点、大量图片、大数据 setData 和滚动渲染压力。优化包括分页、懒加载图片、只保留必要字段、组件化、虚拟列表 / 回收列表、减少频繁更新。

  &lt;details&gt;

- **Q5**: 哪些数据不应该放到页面 data 里?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  模板不需要渲染的数据不应放 data,如请求控制器、Map 缓存、原始大对象、临时计算中间值、定时器 id。它们放实例字段即可,避免进入 setData / 视图同步链路。

  &lt;details&gt;

## 延伸资源

- [微信小程序性能优化指南](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/)
- [小程序分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html)
- [小程序按需注入 / 用时注入](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/lazyload.html)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
