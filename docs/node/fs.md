---
title: 'fs 文件系统'
order: 9
---

# fs 文件系统

> fs 模块提供文件和目录的读写操作，支持回调、同步、Promise 三种风格，推荐使用 `fs/promises` 配合 async/await。

---

## 三种风格对比

| 风格             | 导入方式                            | 用法                      | 适用场景       |
| ---------------- | ----------------------------------- | ------------------------- | -------------- |
| 回调（Callback） | `import fs from 'node:fs'`          | `fs.readFile(path, cb)`   | 旧代码兼容     |
| 同步（Sync）     | `import fs from 'node:fs'`          | `fs.readFileSync(path)`   | 脚本、配置加载 |
| Promise          | `import fs from 'node:fs/promises'` | `await fs.readFile(path)` | 推荐，日常开发 |

```js
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';

// ✅ Promise 风格（推荐）
const data = await fs.readFile('./config.json', 'utf8');

// 同步风格（仅用于启动时加载配置等场景）
const config = JSON.parse(readFileSync('./config.json', 'utf8'));

// 回调风格（旧代码，不推荐新代码使用）
// fs.readFile('./config.json', 'utf8', (err, data) => {})
```

---

## 文件操作速查

| 操作     | Promise API                    | 说明                     |
| -------- | ------------------------------ | ------------------------ |
| 读文件   | `fs.readFile(path, encoding?)` | 返回 string 或 Buffer    |
| 写文件   | `fs.writeFile(path, data)`     | 覆盖写入                 |
| 追加     | `fs.appendFile(path, data)`    | 末尾追加                 |
| 删除     | `fs.unlink(path)`              | 删除文件                 |
| 复制     | `fs.copyFile(src, dest)`       | 复制文件                 |
| 重命名   | `fs.rename(old, new)`          | 重命名/移动              |
| 文件信息 | `fs.stat(path)`                | 大小、修改时间等         |
| 是否存在 | `fs.access(path)`              | 存在不报错，不存在抛异常 |

```js
import fs from 'node:fs/promises';

// 读写文件
const content = await fs.readFile('./data.txt', 'utf8');
await fs.writeFile('./output.txt', '新内容');
await fs.appendFile('./log.txt', '追加一行\n');

// 文件信息
const stat = await fs.stat('./data.txt');
console.log(`大小: ${stat.size} 字节`);
console.log(`修改时间: ${stat.mtime}`);
console.log(`是文件: ${stat.isFile()}`);
console.log(`是目录: ${stat.isDirectory()}`);

// 判断文件是否存在
try {
  await fs.access('./config.json');
  console.log('文件存在');
} catch {
  console.log('文件不存在');
}
```

---

## 目录操作

```js
import fs from 'node:fs/promises';
import path from 'node:path';

// 创建目录（recursive 自动创建父目录）
await fs.mkdir('./logs/2024', { recursive: true });

// 读取目录内容
const files = await fs.readdir('./src'); // ['app.js', 'utils.js']
const entries = await fs.readdir('./src', { withFileTypes: true });
for (const entry of entries) {
  console.log(`${entry.name} — ${entry.isDirectory() ? '目录' : '文件'}`);
}

// 递归读取目录（Node 18.17+）
const allFiles = await fs.readdir('./src', { recursive: true });

// 删除目录（recursive 递归删除）
await fs.rm('./temp', { recursive: true, force: true });

// 遍历目录树（自定义递归）
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}
```

---

## 文件监听

| 方法             | 机制                     | 跨平台         | 推荐         |
| ---------------- | ------------------------ | -------------- | ------------ |
| `fs.watch()`     | 系统原生事件             | 行为因平台而异 | 一般场景     |
| `fs.watchFile()` | 轮询（stat 对比）        | 一致           | 网络文件系统 |
| `chokidar`       | 封装 fs.watch + 轮询兜底 | 最佳           | 生产环境推荐 |

```js
import fs from 'node:fs';

// fs.watch — 基于系统事件，效率��
const watcher = fs.watch('./src', { recursive: true }, (event, filename) => {
  console.log(`${event}: ${filename}`);
});

// 停止监听
watcher.close();

// chokidar — 生产环境推荐（第三方库）
// import chokidar from 'chokidar'
// chokidar.watch('./src').on('change', (path) => console.log(`变更: ${path}`))
```

---

## glob 模式匹配（Node 22+）

```js
import { glob, globSync } from 'node:fs';

// Node 22+ 内置 glob
const jsFiles = await glob('**/*.js', { cwd: './src' });
// 旧版本使用第三方包
// import { glob } from 'glob'
// const files = await glob('src/**/*.{ts,tsx}')
```

---

## 大文件处理（流式读写）

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { Transform } from 'node:stream';

// 流式复制大文件（不会一次性读入内存）
await pipeline(createReadStream('./huge-file.log'), createWriteStream('./huge-file-copy.log'));

// 流式压缩
await pipeline(createReadStream('./huge-file.log'), createGzip(), createWriteStream('./huge-file.log.gz'));

// 流式逐行处理（配合 readline）
import { createInterface } from 'node:readline';

const rl = createInterface({
  input: createReadStream('./big-data.csv'),
  crlfDelay: Infinity,
});

let lineCount = 0;
for await (const line of rl) {
  lineCount++;
  // 逐行处理，内存恒定
}
console.log(`共 ${lineCount} 行`);
```

---

## 常见陷阱

```js
// ❌ 大文件用 readFile — 内存爆炸
const data = await fs.readFile('./10GB.log', 'utf8'); // 全部读入内存

// ✅ 大文件用流式处理
const stream = createReadStream('./10GB.log');
for await (const chunk of stream) {
  process(chunk);
}
```

```js
// ❌ 路径拼接用字符串 — 跨平台不兼容
const filePath = dir + '/' + filename; // Windows 上路径分隔符是 \

// ✅ 使用 path.join
import path from 'node:path';
const filePath = path.join(dir, filename);
```

```js
// ❌ 用户输入直接拼接路径 — 目录遍历攻击
const file = `./uploads/${req.query.filename}`; // ../../etc/passwd

// ✅ 校验路径在允许范围内
const safePath = path.resolve('./uploads', req.query.filename);
if (!safePath.startsWith(path.resolve('./uploads'))) {
  throw new Error('非法路径');
}
```

```js
// ❌ 先检查再操作 — 竞态条件（TOCTOU）
if (existsSync('./file.txt')) {
  // 在这个间隙，文件可能被其他进程删除
  const data = readFileSync('./file.txt');
}

// ✅ 直接操作，用 try/catch 处理错误
try {
  const data = await fs.readFile('./file.txt', 'utf8');
} catch (err) {
  if (err.code === 'ENOENT') console.log('文件不存在');
  else throw err;
}
```
