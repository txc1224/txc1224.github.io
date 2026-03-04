---
title: 'HTTP 模块'
order: 4
---

# HTTP 模块

> Node.js 内置 HTTP 模块可以创建服务器和发起请求，是理解 Express/Koa 等框架底层原理的基础。

---

## HTTP 核心 API 速查

| API                            | 说明                     | 常用场景             |
| ------------------------------ | ------------------------ | -------------------- |
| `http.createServer(handler)`   | 创建 HTTP 服务器         | Web 服务             |
| `server.listen(port, cb)`      | 监听端口                 | 启动服务             |
| `req.method`                   | 请求方法                 | 路由判断             |
| `req.url`                      | 请求路径（含查询参数）   | 路由解析             |
| `req.headers`                  | 请求头对象（全小写键名） | 读取 Content-Type 等 |
| `res.writeHead(code, headers)` | 设置状态码和响应头       | 返回 JSON/HTML       |
| `res.setHeader(name, value)`   | 设置单个响应头           | CORS 等              |
| `res.write(data)`              | 写入响应体（可多次调用） | 流式响应             |
| `res.end(data?)`               | 结束响应                 | 每个请求必须调用     |

---

## 创建 HTTP 服务器

```js
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // 路由分发
  if (method === 'GET' && pathname === '/api/users') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [] }));
    return;
  }

  if (method === 'POST' && pathname === '/api/users') {
    const body = await parseBody(req);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ created: body }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(3000, () => console.log('服务运行在 http://localhost:3000'));
```

---

## 请求体解析

```js
// 通用 body 解析（支持 JSON 和表单）
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('无效 JSON'));
        }
      } else {
        // 表单数据 → URLSearchParams 解析
        resolve(Object.fromEntries(new URLSearchParams(raw)));
      }
    });
    req.on('error', reject);
  });
}
```

---

## HTTPS 配置

```js
import https from 'node:https';
import fs from 'node:fs';

const options = {
  key: fs.readFileSync('./ssl/private-key.pem'),
  cert: fs.readFileSync('./ssl/certificate.pem'),
};

const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('Hello HTTPS');
});

server.listen(443, () => console.log('HTTPS 服务已启动'));
```

---

## 流式响应（SSE）

```js
// Server-Sent Events — 服务器推送
const server = http.createServer((req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // 定时推送数据
    const timer = setInterval(() => {
      res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`);
    }, 1000);

    req.on('close', () => {
      clearInterval(timer); // 客户端断开时清理
    });
    return;
  }

  res.writeHead(404);
  res.end();
});
```

---

## fetch API（Node 18+）

| 特性          | `http.request` | `fetch`（Node 18+） |
| ------------- | -------------- | ------------------- |
| API 风格      | 回调/流式      | Promise/async-await |
| 学习成本      | 较高           | 低（与浏览器一致）  |
| 流式处理      | 原生支持       | 需手动读取 body     |
| 代理/高级控制 | 灵活           | 有限                |
| 推荐场景      | 底层控制、流式 | 日常 HTTP 请求      |

```js
// fetch：简洁的 HTTP 客户端（Node 18+ 内置）
const res = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'test' }),
  signal: AbortSignal.timeout(5000), // 5 秒超时
});

if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
```

```js
// http.request：底层控制（适合流式场景）
import http from 'node:http';

const req = http.request(
  'http://example.com/api',
  {
    method: 'GET',
    timeout: 5000,
  },
  (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      console.log(JSON.parse(body));
    });
  },
);

req.on('timeout', () => {
  req.destroy(new Error('请求超时'));
});
req.on('error', (err) => console.error(err));
req.end();
```

---

## 常见陷阱

```js
// ❌ 忘记调用 res.end() — 客户端一直等待
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.write('Hello');
  // 忘了 res.end()，连接永远不会结束
});

// ✅ 始终调用 res.end()
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello');
});
```

```js
// ❌ 请求体不设大小限制 — 内存耗尽攻击
req.on('data', (chunk) => (body += chunk)); // body 可以无限大

// ✅ 限制请求体大小
let body = '';
const MAX_SIZE = 1024 * 1024; // 1MB
req.on('data', (chunk) => {
  body += chunk;
  if (body.length > MAX_SIZE) {
    res.writeHead(413); // Payload Too Large
    res.end('请求体过大');
    req.destroy();
  }
});
```

```js
// ❌ 未设置请求超时 — 慢请求耗尽连接
const server = http.createServer(handler);

// ✅ 设置超时
const server = http.createServer(handler);
server.timeout = 30_000; // 30 秒响应超时
server.keepAliveTimeout = 5_000; // Keep-Alive 超时
server.headersTimeout = 10_000; // 请求头接收超时
```
