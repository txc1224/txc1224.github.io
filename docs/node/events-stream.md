# EventEmitter + Buffer & Stream

## EventEmitter

```js
import { EventEmitter } from 'events';

class MyService extends EventEmitter {
  async processData(data) {
    this.emit('start', data);
    try {
      const result = await doWork(data);
      this.emit('success', result);
    } catch (err) {
      this.emit('error', err); // error 事件必须有监听器，否则抛出异常
    }
  }
}

const svc = new MyService();
svc.on('start', (data) => console.log('Started:', data));
svc.on('success', (result) => console.log('Done:', result));
svc.on('error', (err) => console.error('Error:', err)); // ⚠️ 必须监听 error

// 只监听一次
svc.once('start', handler);

// 移除监听
svc.off('start', handler);
// 或
svc.removeAllListeners('start');

// ⚠️ 默认最多 10 个监听器（超过警告内存泄漏）
svc.setMaxListeners(20); // 按需调整
EventEmitter.defaultMaxListeners = 20; // 全局修改
```

---

## Buffer & Stream

### Buffer

```js
// 创建 Buffer
const buf = Buffer.from('Hello', 'utf8');
const buf2 = Buffer.alloc(10); // 10字节，全零
const buf3 = Buffer.allocUnsafe(10); // 10字节，不初始化（快但有脏数据）

buf.toString('utf8'); // 'Hello'
buf.toString('hex'); // 十六进制
buf.toString('base64'); // Base64

// Buffer 拼接（⚠️ 不要用 += 字符串拼接二进制）
const chunks = [];
stream.on('data', (chunk) => chunks.push(chunk));
stream.on('end', () => {
  const result = Buffer.concat(chunks);
});
```

### Stream

```js
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises'; // Node 15+
import { createGzip } from 'zlib';

// ✅ 用 pipeline 处理流（自动错误处理和资源清理）
await pipeline(createReadStream('input.txt'), createGzip(), createWriteStream('output.txt.gz'));

// 自定义可读流
import { Readable } from 'stream';
const readable = new Readable({
  read() {}, // 必须实现
});
readable.push('Hello');
readable.push(' World');
readable.push(null); // 结束标志

// 背压（Backpressure）处理
const writable = createWriteStream('output.txt');
function write(data) {
  const ok = writable.write(data);
  if (!ok) {
    // ⚠️ 缓冲区满，暂停写入
    writable.once('drain', () => write(nextChunk));
  }
}
```
