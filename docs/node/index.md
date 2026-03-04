---
title: '概览 & Event Loop'
order: 1
---

# Node.js 核心知识

> 服务端 JavaScript 运行时 —— 核心概念、常用模块与最佳实践备忘。

## 目录

- [模块系统](./modules)
- [内置模块速查](./builtin)
- [HTTP 模块](./http)
- [EventEmitter + Buffer & Stream](./events-stream)
- [process 与环境变量](./process)
- [npm / pnpm 常用命令](./npm)
- [调试技巧](./debug)
- [fs 模块](./fs)

---

## Node.js 核心概念

### 运行模型

Node.js 是**单线程、非阻塞 I/O、事件驱动**的运行时，基于 V8 引擎和 libuv 实现。

```
      ┌─────────────────┐
      │   你的 JS 代码   │  ← 单线程执行（V8）
      └────────┬────────┘
               │ 异步操作（I/O、网络、定时器…）
      ┌────────▼────────┐
      │   Event Loop    │  ← libuv 管理
      └────────┬────────┘
               │
      ┌────────▼────────────────────────────┐
      │  线程池（libuv）/ 系统内核异步 API   │  ← 真正的并发
      └─────────────────────────────────────┘
```

- **单线程**：JS 代码串行执行，无需锁
- **非阻塞 I/O**：I/O 操作委托给系统/线程池，完成后回调
- **适合场景**：高并发 I/O 密集型（Web API、BFF）
- **不适合场景**：CPU 密集型计算（用 worker_threads 或子进程）

---

## Event Loop 阶段

```
timers → pending callbacks → idle/prepare → poll → check → close callbacks
  ↑                                                              ↓
  └──────────────────────────────────────────────────────────────┘
```

| 阶段   | 处理内容                      |
| ------ | ----------------------------- |
| timers | setTimeout / setInterval 回调 |
| poll   | 等待 I/O 事件，执行 I/O 回调  |
| check  | setImmediate 回调             |

```js
// 执行顺序
setImmediate(() => console.log('setImmediate')); // check 阶段
setTimeout(() => console.log('setTimeout'), 0); // timers 阶段
Promise.resolve().then(() => console.log('Promise')); // 微任务（每阶段后执行）
process.nextTick(() => console.log('nextTick')); // 微任务（最高优先级）

// 输出：nextTick → Promise → setTimeout/setImmediate（顺序不定）
```
