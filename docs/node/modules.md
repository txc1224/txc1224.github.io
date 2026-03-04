---
title: '模块系统'
order: 2
---

# 模块系统

> Node.js 支持 CommonJS（CJS）和 ES Modules（ESM）两套模块系统，理解它们的差异和互操作是避免 "require/import 地狱" 的关键。

---

## CJS vs ESM 深度对比

| 特性         | CommonJS (CJS)               | ES Modules (ESM)             |
| ------------ | ---------------------------- | ---------------------------- |
| 语法         | `require` / `module.exports` | `import` / `export`          |
| 加载时机     | 同步，运行时加载             | 异步，编译时静态分析         |
| 文件后缀     | `.js`（默认）/ `.cjs`        | `.mjs` 或 `"type": "module"` |
| `__dirname`  | 内置可用                     | 需用 `import.meta` 替代      |
| `__filename` | 内置可用                     | 需用 `import.meta.url` 替代  |
| Tree Shaking | 不支持                       | 支持（静态分析）             |
| 顶层 await   | 不支持                       | 支持                         |
| 条件导入     | `if (x) require('y')`        | 需用动态 `import()`          |
| `this` 指向  | `module.exports`             | `undefined`                  |

---

## CommonJS 基础

```js
// 导出
module.exports = { foo, bar }; // 整体导出
exports.baz = baz; // 单个属性导出

// 导入
const fs = require('fs'); // 整体导入
const { readFile } = require('fs'); // 解构导入
const config = require('./config'); // 相对路径

// 条件导入
if (process.env.DB === 'mysql') {
  module.exports = require('./mysql-driver');
} else {
  module.exports = require('./pg-driver');
}
```

---

## ES Modules 基础

```js
// 命名导出
export const API_URL = 'https://api.example.com';
export function fetchData() {
  /* ... */
}

// 默认导出
export default class UserService {
  /* ... */
}

// 导入
import UserService from './service.js'; // 默认导入
import { API_URL, fetchData } from './config.js'; // 命名导入
import * as utils from './utils.js'; // 命名空间导入
import { readFile as read } from 'fs'; // 重命名

// 动态导入（ESM 和 CJS 都支持）
const module = await import('./module.js');

// ESM 中获取 __dirname（常用模式）
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## require 加载机制

```
require('foo') 的查找顺序：

1. 核心模块（fs, path, http...）→ 直接返回
2. 以 ./ 或 ../ 开头 → 作为文件/目录查找
   ├─ foo.js → foo.json → foo.node
   └─ foo/package.json#main → foo/index.js
3. node_modules 逐层向上查找
   ├─ ./node_modules/foo/
   ├─ ../node_modules/foo/
   └─ ...直到文件系统根目录
4. NODE_PATH 环境变量指定的目录
```

```js
// require 缓存机制
const a = require('./module'); // 首次加载，执行模块代码
const b = require('./module'); // 从缓存读取，a === b

// 查看缓存
console.log(require.cache);

// 清除缓存（慎用，主要用于热更新）
delete require.cache[require.resolve('./module')];
```

---

## 循环依赖

```js
// ❌ CJS 循环依赖 — 拿到不完整的导出
// a.js
const b = require('./b'); // b 还没执行完
console.log('a 中的 b:', b); // { partialExport }

// b.js
const a = require('./a'); // a 还没执行完
console.log('b 中的 a:', a); // {} 空对象！
module.exports = { partialExport: true };
```

```js
// ✅ 解决方案 1：延迟 require
// a.js
exports.getB = () => require('./b'); // 调用时才加载

// ✅ 解决方案 2：提取公共模块打破循环
// shared.js → a.js 和 b.js 都依赖 shared.js

// ✅ 解决方案 3：使用 ESM（处理更合理，但仍需注意）
```

---

## package.json 条件导出

```jsonc
// package.json — 控制模块入口
{
  "name": "my-lib",
  "type": "module", // 整个包使用 ESM
  "exports": {
    ".": {
      "import": "./dist/index.mjs", // ESM 入口
      "require": "./dist/index.cjs", // CJS 入口
      "types": "./dist/index.d.ts", // TypeScript 类型
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs",
    },
  },
  "main": "./dist/index.cjs", // 旧版 Node.js 兼容
  "module": "./dist/index.mjs", // 打包工具使用
  "files": ["dist"], // 发布时包含的文件
}
```

---

## 常见陷阱

```js
// ❌ CJS 中用 require 导入 ESM 包 — 会报错
const pkg = require('esm-only-package');
// Error: require() of ES Module not supported

// ✅ 使用动态 import()
const pkg = await import('esm-only-package');
```

```js
// ❌ ESM 中使用 __dirname — 不存在
console.log(__dirname); // ReferenceError: __dirname is not defined

// ✅ 使用 import.meta
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
```

```js
// ❌ exports 和 module.exports 混用
exports.foo = 'bar';
module.exports = { baz: 'qux' }; // exports.foo 被丢弃！

// ✅ 只用一种方式
module.exports = { foo: 'bar', baz: 'qux' };
```

```js
// ❌ ESM 中忘记写文件后缀
import { helper } from './utils'; // ERR_MODULE_NOT_FOUND

// ✅ ESM 必须写完整路径（包括后缀）
import { helper } from './utils.js';
```
