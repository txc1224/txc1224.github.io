# 内置模块速查

## 模块一览

| 模块             | 主要用途                            |
| ---------------- | ----------------------------------- |
| `fs`             | 文件读写、目录操作                  |
| `path`           | 路径拼接、解析                      |
| `http` / `https` | HTTP 服务器 / 客户端                |
| `os`             | 操作系统信息（CPU、内存、platform） |
| `crypto`         | 哈希、加密、随机数                  |
| `events`         | EventEmitter 基类                   |
| `stream`         | 可读/可写/双工流                    |
| `buffer`         | 二进制数据处理                      |
| `url`            | URL 解析（WHATWG API）              |
| `util`           | promisify、inspect、类型检查        |
| `child_process`  | 执行系统命令、子进程                |
| `worker_threads` | 多线程 CPU 密集计算                 |

## path

```js
import path from 'path';
path.join('/foo', 'bar', '../baz'); // '/foo/baz'
path.resolve('foo', 'bar'); // 从 CWD 开始的绝对路径
path.extname('index.html'); // '.html'
path.basename('/foo/bar.js', '.js'); // 'bar'
```

## os

```js
import os from 'os';
os.cpus().length; // CPU 核心数
os.totalmem(); // 总内存字节
os.homedir(); // 用户 home 目录
os.platform(); // 'darwin' | 'linux' | 'win32'
```

## crypto

```js
import crypto from 'crypto';
crypto.randomUUID(); // 生成 UUID v4
crypto.createHash('sha256').update('data').digest('hex'); // SHA256 哈希
```
