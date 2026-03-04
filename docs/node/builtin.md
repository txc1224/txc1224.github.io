---
title: '内置模块速查'
order: 3
---

# 内置模块速查

> Node.js 核心模块无需安装即可使用，推荐使用 `node:` 前缀导入（如 `import path from 'node:path'`）以明确区分内置与第三方模块。

---

## 核心模块一览

| 模块             | 主要用途             | 常用方法                                       |
| ---------------- | -------------------- | ---------------------------------------------- |
| `path`           | 路径拼接、解析       | `join` / `resolve` / `basename` / `extname`    |
| `os`             | 操作系统信息         | `cpus` / `totalmem` / `platform` / `homedir`   |
| `url`            | URL 解析与构建       | `new URL()` / `URLSearchParams`                |
| `crypto`         | 哈希、加密、随机数   | `createHash` / `randomUUID` / `createCipheriv` |
| `util`           | 工具函数             | `promisify` / `inspect` / `types`              |
| `querystring`    | 查询字符串解析（旧） | 推荐用 `URLSearchParams` 替代                  |
| `buffer`         | 二进制数据处理       | `Buffer.from` / `alloc` / `concat`             |
| `child_process`  | 执行系统命令         | `exec` / `spawn` / `fork`                      |
| `worker_threads` | 多线程 CPU 密集计算  | `Worker` / `parentPort` / `workerData`         |

---

## path — 路径处理

### join vs resolve

| 特性     | `path.join()`            | `path.resolve()`               |
| -------- | ------------------------ | ------------------------------ |
| 作用     | 拼接路径片段             | 解析为绝对路径                 |
| 起点     | 不考虑 CWD               | 从右向左解析，遇到绝对路径停止 |
| 返回值   | 相对或绝对（取决于输入） | 始终返回绝对路径               |
| 典型用途 | 拼接相对路径             | 获取文件绝对路径               |

```js
import path from 'node:path';

// join：简单拼接，自动处理分隔符和 ..
path.join('/foo', 'bar', '../baz'); // '/foo/baz'
path.join('a', 'b', 'c'); // 'a/b/c'

// resolve：从右向左解析为绝对路径
path.resolve('foo', 'bar'); // '/当前CWD/foo/bar'
path.resolve('/foo', '/bar', 'baz'); // '/bar/baz'（遇到 /bar 停止）

// 常用方法
path.basename('/foo/bar.js'); // 'bar.js'
path.basename('/foo/bar.js', '.js'); // 'bar'
path.extname('index.html'); // '.html'
path.dirname('/foo/bar/baz.js'); // '/foo/bar'
path.parse('/foo/bar.js'); // { root, dir, base, ext, name }
path.sep; // '/'(Unix) 或 '\\'(Windows)
```

---

## url — 新旧 API 对比

| 特性       | 旧 API (`url.parse`) | 新 API (`new URL`)     |
| ---------- | -------------------- | ---------------------- |
| 标准       | Node.js 自有         | WHATWG 标准            |
| 状态       | 已弃用               | 推荐使用               |
| 查询参数   | 字符串或手动解析     | `URLSearchParams` 对象 |
| 浏览器兼容 | 不兼容               | 完全兼容               |

```js
import { URL, URLSearchParams } from 'node:url';

// 新 API（推荐）
const url = new URL('https://example.com:8080/path?id=1&name=test');
url.hostname; // 'example.com'
url.port; // '8080'
url.pathname; // '/path'
url.searchParams.get('id'); // '1'
url.searchParams.set('page', '2');
url.toString(); // 'https://example.com:8080/path?id=1&name=test&page=2'

// URLSearchParams 单独使用
const params = new URLSearchParams({ page: '1', size: '10' });
params.append('sort', 'date');
params.toString(); // 'page=1&size=10&sort=date'
```

---

## crypto — 加密与哈希

```js
import crypto from 'node:crypto';

// UUID 生成
crypto.randomUUID(); // 'a1b2c3d4-e5f6-...'

// 随机字节
crypto.randomBytes(16).toString('hex'); // 32位十六进制随机字符串

// 哈希（SHA256）
crypto.createHash('sha256').update('hello').digest('hex');

// HMAC 签名
crypto.createHmac('sha256', 'secret-key').update('data').digest('hex');

// 对称加解密（AES-256-GCM）
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// 加密
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update('敏感数据', 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

// 解密
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8'); // '敏感数据'
```

---

## os — 系统信息

```js
import os from 'node:os';

os.cpus().length; // CPU 核心数
os.totalmem(); // 总内存（字节）
os.freemem(); // 空闲内存（字节）
os.homedir(); // 用户 home 目录
os.tmpdir(); // 临时文件目录
os.platform(); // 'darwin' | 'linux' | 'win32'
os.arch(); // 'x64' | 'arm64'
os.hostname(); // 主机名
os.networkInterfaces(); // 网络接口信息
os.uptime(); // 系统运行时长（秒）
os.EOL; // 换行符: '\n'(Unix) 或 '\r\n'(Windows)
```

---

## util — 工具函数

```js
import util from 'node:util';
import { exec } from 'node:child_process';

// promisify：将回调函数转为 Promise
const execAsync = util.promisify(exec);
const { stdout } = await execAsync('ls -la');

// inspect：对象格式化输出（深层嵌套）
console.log(util.inspect(deepObj, { depth: null, colors: true }));

// 类型检查
util.types.isDate(new Date()); // true
util.types.isRegExp(/test/); // true
util.types.isPromise(Promise.resolve()); // true

// 格式化字符串
util.format('Hello %s, you have %d items', 'Alice', 5);
```

---

## 常见陷阱

```js
// ❌ path.join 和 path.resolve 混淆 — 跨平台出问题
const filePath = '/data' + '/' + filename; // 手动拼接，Windows 不兼容

// ✅ 始终使用 path 模块处理路径
import path from 'node:path';
const filePath = path.join('/data', filename);
```

```js
// ❌ 使用已弃用的 url.parse
const url = require('url');
const parsed = url.parse(req.url); // 旧 API，已弃用

// ✅ 使用 WHATWG URL API
const url = new URL(req.url, `http://${req.headers.host}`);
```

```js
// ❌ URL 特殊字符未编码
const url = `https://api.com/search?q=${userInput}`; // 注入风险

// ✅ 使用 URLSearchParams 自动编码
const params = new URLSearchParams({ q: userInput });
const url = `https://api.com/search?${params}`;
```
