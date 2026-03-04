---
title: '调试技巧'
order: 8
---

# 调试与性能分析

> Node.js 提供多种调试方式，从简单的 console 到 Chrome DevTools 和 VS Code 调试器，掌握合适的工具能大幅提升排查效率。

---

## 调试方式对比

| 方式            | 启动方式             | 断点             | 性能分析 | 适用场景             |
| --------------- | -------------------- | ---------------- | -------- | -------------------- |
| `console.log`   | 无需配置             | 不支持           | 不支持   | 快速排查简单问题     |
| `debugger` 语句 | 代码中插入           | 支持             | 不支持   | 配合检查器使用       |
| `--inspect`     | `node --inspect`     | 支持             | 支持     | Chrome DevTools 调试 |
| `--inspect-brk` | `node --inspect-brk` | 支持（首行暂停） | 支持     | 调试启动阶段代码     |
| VS Code 调试器  | launch.json 配置     | 支持             | 支持     | 日常开发首选         |
| `node --watch`  | `node --watch`       | 不支持           | 不支持   | 开发阶段自动重启     |

---

## --inspect 与 --inspect-brk

```bash
# --inspect：启动调试器，代码正常执行
node --inspect app.js
# Debugger listening on ws://127.0.0.1:9229/...

# --inspect-brk：启动调试器，在第一行暂停等待连接
node --inspect-brk app.js

# 指定端口和地址（多进程调试）
node --inspect=0.0.0.0:9230 app.js

# 调试 TypeScript（通过 tsx）
node --inspect --import tsx app.ts
```

> 打开 Chrome 输入 `chrome://inspect`，点击 **Open dedicated DevTools for Node** 连接调试。

---

## Chrome DevTools 调试流程

```
1. 启动：node --inspect-brk app.js
2. 打开：Chrome → chrome://inspect → 点击 inspect
3. 功能：
   ├─ Sources 面板 → 断点、单步执行、查看变量
   ├─ Console 面板 → 在断点上下文中执行表达式
   ├─ Memory 面板 → 堆快照、分配时间线
   └─ Performance 面板 → CPU 火焰图
```

---

## VS Code 调试配置

```jsonc
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "调试当前文件",
      "type": "node",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"], // 跳过 Node 内部代码
    },
    {
      "name": "附加到进程",
      "type": "node",
      "request": "attach",
      "port": 9229, // 连接到 --inspect 进程
    },
  ],
}
```

---

## 性能分析

| 工具             | 用途         | 命令/用法                           |
| ---------------- | ------------ | ----------------------------------- |
| `--prof`         | V8 CPU 分析  | `node --prof app.js`                |
| `--prof-process` | 解析分析日志 | `node --prof-process isolate-*.log` |
| `perf_hooks`     | 代码段计时   | `performance.now()`                 |
| `clinic.js`      | 可视化诊断   | `npx clinic doctor -- node app.js`  |
| `0x`             | 火焰图生成   | `npx 0x app.js`                     |

```js
import { performance, PerformanceObserver } from 'perf_hooks';

// 精确计时
performance.mark('start');
await doHeavyWork();
performance.mark('end');
performance.measure('heavy-work', 'start', 'end');

// 监听性能测量结果
const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });
```

```bash
# V8 CPU 性能分析
node --prof app.js                    # 生成 isolate-*.log
node --prof-process isolate-*.log     # 解析为可读文本

# clinic.js 可视化诊断
npx clinic doctor -- node app.js      # 自动诊断性能瓶颈
npx clinic flame -- node app.js       # 生成火焰图
npx clinic bubbleprof -- node app.js  # 分析异步流
```

---

## 内存泄漏排查

| 常见原因          | 说明                               | 解决方案                   |
| ----------------- | ---------------------------------- | -------------------------- |
| ���局变量积累     | 数组/对象不断增长                  | 设置上限或定期清理         |
| 闭包持有大对象    | 函数引用导致 GC 无法回收           | 及时解除引用               |
| EventEmitter 泄漏 | 监听器不断添加不移除               | `removeListener` / `once`  |
| 定时器未清除      | `setInterval` 没有 `clearInterval` | 退出时清除                 |
| 缓存无限增长      | Map/Object 做缓存不清理            | 使用 `WeakMap` 或 LRU 缓存 |

```js
// 内存快照分析
import v8 from 'v8';
import fs from 'fs';

// 生成堆快照（可在 Chrome DevTools Memory 面板加载）
const snapshotFile = `heap-${Date.now()}.heapsnapshot`;
const stream = v8.writeHeapSnapshot(snapshotFile);
console.log(`堆快照已保存: ${snapshotFile}`);

// 监控内存使用趋势
setInterval(() => {
  const { heapUsed } = process.memoryUsage();
  const mb = (heapUsed / 1024 / 1024).toFixed(1);
  console.log(`堆内存: ${mb}MB`);
}, 5000);
```

---

## 常见陷阱

```js
// ❌ 生产环境留下 console.log — 影响性能和安全
console.log('用户数据:', userData); // 可能泄露敏感信息

// ✅ 使用日志库，按级别输出，生产环境自动关闭 debug
import pino from 'pino';
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
logger.debug({ userData }, '用户数据'); // 生产环境不会输出
```

```js
// ❌ 生产环境开启 --inspect 监听 0.0.0.0
// node --inspect=0.0.0.0:9229 app.js  ← 任何人都能连接调试

// ✅ 仅监听本地，或通过 SSH 隧道访问
// node --inspect=127.0.0.1:9229 app.js
// ssh -L 9229:localhost:9229 user@server
```

```js
// ❌ 用 console.time 做性能分析 — 精度不够且不支持并发
console.time('work');
await doWork();
console.timeEnd('work');

// ✅ 使用 perf_hooks，支持多个并发测量
import { performance } from 'perf_hooks';
const start = performance.now();
await doWork();
console.log(`耗时: ${(performance.now() - start).toFixed(2)}ms`);
```
