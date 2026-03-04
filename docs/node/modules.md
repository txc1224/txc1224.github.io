# 模块系统

## CommonJS vs ESM

|              | CommonJS (CJS)                | ES Modules (ESM)            |
| ------------ | ----------------------------- | --------------------------- |
| 语法         | `require` / `module.exports`  | `import` / `export`         |
| 加载时机     | 同步、运行时                  | 异步、编译时静态分析        |
| 默认后缀     | `.js`（package.json 无 type） | `.mjs` 或 `"type":"module"` |
| `__dirname`  | ✅ 可用                       | ❌ 需用 `import.meta.url`   |
| Tree Shaking | ❌                            | ✅                          |

```js
// CommonJS
const fs = require('fs');
const { readFile } = require('fs');
module.exports = { foo, bar };
exports.baz = baz; // 不要混用 exports 和 module.exports

// ESM
import fs from 'fs';
import { readFile } from 'fs';
export const foo = () => {};
export default class Foo {}

// ESM 中获取 __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 动态导入（ESM 和 CJS 都支持）
const module = await import('./module.js');
```

---

## 模块解析顺序

```
require('foo')
  1. 核心模块（fs, path, http…）
  2. ./node_modules/foo/
  3. ../node_modules/foo/
  4. …向上直到根目录
  5. 全局 NODE_PATH
```
