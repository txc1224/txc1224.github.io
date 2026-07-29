---
title: 'process 与环境变量'
order: 6
---

# process 与子进程

> process 是 Node.js 的全局对象，提供进程信息、环境变量、信号处理等能力；子进程模块用于执行外部命令和多进程架构。

---

## process 核心属性速查

| 属性/方法               | 说明           | 示例                                     |
| ----------------------- | -------------- | ---------------------------------------- |
| `process.env`           | 环境变量对象   | `process.env.NODE_ENV`                   |
| `process.argv`          | 命令行参数数组 | `['node', 'app.js', '--port=3000']`      |
| `process.cwd()`         | 当前工作目录   | `/Users/dev/project`                     |
| `process.pid`           | 进程 ID        | `12345`                                  |
| `process.platform`      | 操作系统平台   | `'darwin'` / `'linux'` / `'win32'`       |
| `process.version`       | Node.js 版本   | `'v20.10.0'`                             |
| `process.uptime()`      | 运行时长（秒） | `123.456`                                |
| `process.memoryUsage()` | 内存使用情况   | `{ rss, heapTotal, heapUsed, external }` |
| `process.exit(code)`    | 退出进程       | `0` 正常 / `1` 异常                      |
| `process.nextTick(fn)`  | 微任务队列执行 | 优先于 Promise.then                      |

```js
// 环境变量与命令行参数
const port = process.env.PORT ?? 3000;
const args = process.argv.slice(2); // 去掉 node 和脚本路径

// 内存监控
const { heapUsed, heapTotal } = process.memoryUsage();
console.log(`内存: ${(heapUsed / 1024 / 1024).toFixed(1)}MB / ${(heapTotal / 1024 / 1024).toFixed(1)}MB`);
```

---

## 信号处理

| 信号      | 触发场景               | 默认行为   |
| --------- | ---------------------- | ---------- |
| `SIGTERM` | `kill` 命令 / 容器停止 | 终止进程   |
| `SIGINT`  | Ctrl+C                 | 终止进程   |
| `SIGUSR1` | 用户自定义             | 启动调试器 |
| `SIGUSR2` | 用户自定义             | 无默认行为 |
| `SIGHUP`  | 终端关闭               | 终止进程   |

```js
// 优雅退出：收到终止信号后清理资源再退出
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM，开始优雅关闭...');
  await server.close(); // 停止接收新请求
  await db.disconnect(); // 断开数据库连接
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nCtrl+C，正在关闭...');
  process.exit(0);
});

// 未捕获异常 — 记录日志后退出
process.on('uncaughtException', (err) => {
  console.error('未捕获异常:', err);
  process.exit(1); // 必须退出，状态可能已损坏
});

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
```

---

## 子进程对比

| 方法       | 输出方式             | 适用场景                 | Shell |
| ---------- | -------------------- | ------------------------ | ----- |
| `exec`     | 缓冲到内存，回调返回 | 短命令，输出量小         | 是    |
| `execFile` | 缓冲到内存，回调返回 | 执行可执行文件，更安全   | 否    |
| `spawn`    | 流式输出             | 长时间运行、大输出       | 可选  |
| `fork`     | 流式 + IPC 通信      | Node.js 子进程，父子通信 | 否    |

```js
import { exec, spawn, fork } from 'child_process';

// exec：简单命令，输出缓冲在内存
exec('ls -la', (err, stdout, stderr) => {
  if (err) return console.error(err);
  console.log(stdout);
});

// spawn：流式处理大输出
const child = spawn('find', ['.', '-name', '*.js']);
child.stdout.on('data', (data) => console.log(data.toString()));
child.on('close', (code) => console.log(`退出码: ${code}`));

// fork：Node.js 子进程 + IPC 通信
const worker = fork('./worker.js');
worker.send({ task: 'compute', data: [1, 2, 3] }); // 发送消息
worker.on('message', (result) => console.log('结果:', result));
```

---

## cluster 多进程模式

```js
import cluster from 'cluster';
import os from 'os';
import http from 'http';

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  console.log(`主进程 ${process.pid}，启动 ${cpuCount} 个 worker`);

  for (let i = 0; i &lt; cpuCount; i++) {
    cluster.fork(); // 创建工作进程
  }

  cluster.on('exit', (worker, code) =&gt; {
    console.log(`Worker ${worker.process.pid} 退出(${code})，重启中...`);
    cluster.fork(); // 自动重启
  });
} else {
  http
    .createServer((req, res) => {
      res.end(`Worker ${process.pid} 处理请求\n`);
    })
    .listen(3000);
}
```

---

## 优雅退出最佳实践

```js
// 完整的优雅退出模板
function gracefulShutdown(signal) {
  console.log(`收到 ${signal}，开始优雅关闭...`);
  const timeout = setTimeout(() => {
    console.error('关闭超时，强制退出');
    process.exit(1);
  }, 10_000); // 10 秒超时保护

  server.close(async () => {
    clearTimeout(timeout);
    await db.disconnect();
    await cache.quit();
    console.log('资源清理完成，退出');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

## 常见陷阱

```js
// ❌ 未捕获异常后继续运行 — 状态可能已损坏
process.on('uncaughtException', (err) => {
  console.error(err); // 仅记录，没有退出
});

// ✅ 记录日志后必须退出进程
process.on('uncaughtException', (err) => {
  console.error('致命错误:', err);
  process.exit(1);
});
```

```js
// ❌ 同步代码中直接 process.exit() — 可能丢失异步操作
app.post('/data', (req, res) => {
  saveToDb(req.body); // 异步操作还没完成
  process.exit(0); // 数据可能丢失
});

// ✅ 等待异步操作完成后再退出
app.post('/data', async (req, res) => {
  await saveToDb(req.body);
  res.send('ok');
});
```

```js
// ❌ process.env 读到的值都是字符串
if (process.env.DEBUG === true) {
  /* 永远不会进入 */
}

// ✅ 显式转换类型
if (process.env.DEBUG === 'true') {
  /* 正确 */
}
const port = Number(process.env.PORT) || 3000;
```
