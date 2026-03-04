---
title: 'EventEmitter / Buffer & Stream'
order: 5
---

# EventEmitter 与 Stream

> EventEmitter 是 Node.js 事件驱动架构的核心基类，Stream 是处理大数据的流式抽象，两者共同构成了 Node.js 高效 I/O 的基础。

---

## EventEmitter 核心 API

| 方法                         | 说明                      | 返回值                  |
| ---------------------------- | ------------------------- | ----------------------- |
| `on(event, fn)`              | 添加监听器                | `this`                  |
| `once(event, fn)`            | 添加一次性监听器          | `this`                  |
| `emit(event, ...args)`       | 触发事件                  | `boolean`（有无监听器） |
| `off(event, fn)`             | 移除指定监听器            | `this`                  |
| `removeAllListeners(event?)` | 移除所有监听器            | `this`                  |
| `listenerCount(event)`       | 监听器数量                | `number`                |
| `setMaxListeners(n)`         | 设置监听器上限（默认 10） | `this`                  |
| `prependListener(event, fn)` | 添加到监听器队列头部      | `this`                  |

```js
import { EventEmitter } from 'node:events';

class OrderService extends EventEmitter {
  async createOrder(data) {
    const order = await db.insert(data);
    this.emit('created', order); // 触发事件
    return order;
  }
}

const service = new OrderService();

// 监听事件
service.on('created', (order) => {
  sendEmail(order.userId); // 发邮件
});
service.on('created', (order) => {
  updateInventory(order.items); // 扣库存
});

// error 事件必须有监听器，否则抛出异常导致进程崩溃
service.on('error', (err) => {
  console.error('订单服务错误:', err);
});
```

---

## 事件模式最佳实践

```js
// ✅ 使用 once 监听一次性事件
server.once('listening', () => console.log('服务已启动'));

// ✅ 使用 events.once() 将事件转为 Promise
import { once } from 'node:events';

const server = http.createServer(handler);
server.listen(3000);
await once(server, 'listening'); // 等待事件触发
console.log('服务已启动');

// ✅ 使用 on() 将事件转为 AsyncIterator（Node 16+）
import { on } from 'node:events';

for await (const [req, res] of on(server, 'request')) {
  res.end('Hello');
}

// ✅ 及时移除监听器，避免内存泄漏
const handler = (data) => console.log(data);
emitter.on('data', handler);
// 不再需要时
emitter.off('data', handler);
```

---

## Stream 四种类型

| 类型        | 说明               | 示例                  | 核心方法            |
| ----------- | ------------------ | --------------------- | ------------------- |
| `Readable`  | 可读流             | 文件读取、HTTP 请求体 | `read()` / `pipe()` |
| `Writable`  | 可写流             | 文件写入、HTTP 响应体 | `write()` / `end()` |
| `Duplex`    | 双工流（读写独立） | TCP Socket、WebSocket | 同时有读写方法      |
| `Transform` | 转换流（读写关联） | zlib 压缩、加密       | `_transform()`      |

```js
import { Readable, Writable, Transform } from 'node:stream';

// 自定义 Readable
const readable = new Readable({
  read() {}, // 必须实现（推模式可为空）
});
readable.push('Hello ');
readable.push('World');
readable.push(null); // null 表示流结束

// 自定义 Transform
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  },
});
```

---

## pipeline vs pipe

| 特性         | `stream.pipe()`        | `stream.pipeline()`        |
| ------------ | ---------------------- | -------------------------- |
| 错误处理     | 不自动处理，需手动监听 | 自动传播错误               |
| 资源清理     | 不自动销毁流           | 自动销毁所有流             |
| Promise 支持 | 不支持                 | `stream/promises` 版本支持 |
| 推荐程度     | 不推荐                 | 推荐                       |

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';

// ❌ pipe — 错误不会传播，流不会自动销毁
createReadStream('input.txt').pipe(createGzip()).pipe(createWriteStream('output.gz'));
// 如果读取失败，写入流不会被关闭 → 资源泄漏

// ✅ pipeline — 自动错误处理和资源清理
await pipeline(createReadStream('input.txt'), createGzip(), createWriteStream('output.gz'));
console.log('压缩完成');

// 解压
await pipeline(createReadStream('output.gz'), createGunzip(), createWriteStream('output.txt'));
```

---

## 背压（Backpressure）

```
生产者(Readable) → 消费者(Writable)

当消费者处理速度 < 生产者产出速度时：
  1. writable.write() 返回 false → 内部缓冲区满
  2. 生产者应暂停发送
  3. 消费者 drain 事件触发 → 缓冲区已排空
  4. 生产者恢复发送
```

```js
import { createWriteStream } from 'node:fs';

const writable = createWriteStream('huge-file.txt');

function writeData(data) {
  const canContinue = writable.write(data);
  if (!canContinue) {
    // 缓冲区满，暂停写入，等待 drain
    writable.once('drain', () => {
      writeData(nextChunk()); // drain 后继续
    });
  }
}

// ✅ pipeline 自动处理背压，无需手动控制
await pipeline(readableSource, transformStep, writable);
```

---

## Buffer 常用操作

```js
// 创建
const buf1 = Buffer.from('Hello', 'utf8');
const buf2 = Buffer.alloc(10); // 10 字节，初始化为 0
const buf3 = Buffer.allocUnsafe(10); // 10 字节，不初始化（快但有脏数据）

// 转换
buf1.toString('utf8'); // 'Hello'
buf1.toString('hex'); // '48656c6c6f'
buf1.toString('base64'); // 'SGVsbG8='

// 拼接（流式读取常用）
const chunks = [];
stream.on('data', (chunk) => chunks.push(chunk));
stream.on('end', () => {
  const result = Buffer.concat(chunks);
});
```

---

## 常见陷阱

```js
// ❌ EventEmitter 监听器不断添加 — 内存泄漏
function handleRequest(req) {
  emitter.on('data', (d) => req.send(d)); // 每次请求都添加监听器！
}

// ✅ 使用 once 或在适当时机移除
function handleRequest(req) {
  const handler = (d) => req.send(d);
  emitter.on('data', handler);
  req.on('close', () => emitter.off('data', handler)); // 请求结束时移除
}
```

```js
// ❌ 没有监听 error 事件 — 进程崩溃
const emitter = new EventEmitter();
emitter.emit('error', new Error('boom')); // 没有监听器 → 抛出异常

// ✅ 始终监听 error 事件
emitter.on('error', (err) => console.error('捕获错误:', err));
```

```js
// ❌ 二进制数据用字符串拼接 — 多字节字符被截断
let data = '';
stream.on('data', (chunk) => (data += chunk)); // chunk 是 Buffer，隐式转 string

// ✅ 用 Buffer.concat 拼接后统一转换
const chunks = [];
stream.on('data', (chunk) => chunks.push(chunk));
stream.on('end', () => {
  const data = Buffer.concat(chunks).toString('utf8');
});
```
