# HTTP 模块

## createServer / 路由 / 解析 body

```js
import http from 'http';
import { URL } from 'url';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 路由
  if (pathname === '/api/users' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [] }));
    return;
  }

  if (pathname === '/api/users' && req.method === 'POST') {
    // 解析 body
    const body = await parseBody(req);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ created: body }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// 解析请求 body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
}

server.listen(3000, () => console.log('Server running on port 3000'));
```
