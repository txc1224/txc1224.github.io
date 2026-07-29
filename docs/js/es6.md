---
title: 'ES6+ / 函数技巧'
order: 4
---

# ES6+ / 函数技巧

> ES6+ 引入了大量语法糖和新 API，掌握解构、展开、可选链、模块等特性是现代 JS 开发的基础。

---

## ES6+ 核心特性速查

| 特性              | 版本   | 说明                  |
| ----------------- | ------ | --------------------- | ------ | -------- |
| `let` / `const`   | ES6    | 块级作用域            |
| 箭头函数          | ES6    | `() => {}`            |
| 解构赋值          | ES6    | `const { a } = obj`   |
| 模板字符串        | ES6    | `` `${name}` ``       |
| `...` 展开/剩余   | ES6    | 展开数组/对象         |
| `Promise`         | ES6    | 异步编程              |
| `class`           | ES6    | 语法糖                |
| `async/await`     | ES2017 | 异步语法糖            |
| `?.` 可选链       | ES2020 | 安全访问属性          |
| `??` 空值合并     | ES2020 | null/undefined 默认值 |
| `                 |        | =` `&&=` `??=`        | ES2021 | 逻辑赋值 |
| `.at()`           | ES2022 | 负索引                |
| `structuredClone` | ES2022 | 深拷贝                |

---

## 解构赋值

```js
// 数组解构
const [first, , third, fourth = 'default'] = [1, 2, 3];

// 对象解构 + 重命名 + 默认值
const { name: userName = 'anonymous', age } = { age: 18 };

// 嵌套解构
const {
  address: { city },
} = { address: { city: 'Beijing' } };

// 函数参数解构
function greet({ name = 'World', greeting = 'Hello' } = {}) {
  return `${greeting}, ${name}!`;
}
```

---

## 展开 / 剩余运算符

```js
// 展开
const arr = [...[1, 2], ...[3, 4]]; // [1, 2, 3, 4]
const obj = { ...defaults, ...overrides }; // 对象合并，后者覆盖前者

// 剩余参数
function sum(first, ...rest) {
  return rest.reduce((acc, n) => acc + n, first);
}
```

```js
// ❌ 展开只做浅拷贝
const original = { a: { b: 1 } };
const copy = { ...original };
copy.a.b = 2;
console.log(original.a.b); // 2（原对象也被修改）

// ✅ 深层对象需要深拷贝
const copy = structuredClone(original);
```

---

## 可选链与空值合并

```js
const user = null;

// 可选链 ?.（避免 Cannot read property of null）
const city = user?.address?.city; // undefined（不报错）
const fn = user?.greet?.(); // 方法也适用
const val = arr?.[0]; // 数组也适用

// 空值合并 ??（只在 null / undefined 时取默认值）
const name = user?.name ?? 'anonymous';
```

### ?? vs ||

```js
// ❌ || 把所有 falsy 值都替换
0 || 'default'; // 'default'（0 是 falsy）
'' || 'default'; // 'default'

// ✅ ?? 只替换 null 和 undefined
0 ?? 'default'; // 0
'' ?? 'default'; // ''
null ?? 'default'; // 'default'
```

---

## 模块系统

```js
// ESM 导出
export const PI = 3.14;
export function add(a, b) {
  return a + b;
}
export default class Calculator {}

// ESM 导入
import Calculator, { PI, add } from './math.js';
import * as math from './math.js';

// 动态导入（懒加载 / 代码分割）
const module = await import('./heavy-module.js');
```

---

## 实用新 API

```js
// Object 工具方法
Object.entries({ a: 1, b: 2 }); // [['a', 1], ['b', 2]]
Object.fromEntries([['a', 1]]); // { a: 1 }
Object.keys({ a: 1, b: 2 }); // ['a', 'b']
Object.values({ a: 1, b: 2 }) // [1, 2]

  [
    // Array 新方法
    (1, [2, [3]])
  ].flat(Infinity) // [1, 2, 3]
  [(1, 2, 3)].at(-1) // 3（负索引）
  [(1, 2, 3)].findLast((n) => n < 3); // 2

// 逻辑赋值（ES2021）
x ||= 'default'; // x = x || 'default'
x &&= transform(x);
x ??= 'fallback'; // x = x ?? 'fallback'

// WeakRef / FinalizationRegistry（ES2021）
const weakRef = new WeakRef(largeObj); // 弱引用，不阻止 GC
weakRef.deref(); // 获取对象，可能为 undefined
```

---

## 函数技巧

### 防抖与节流

```js
// 防抖：停止操作 n ms 后才执行（搜索框输入）
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流：每 n ms 最多执行一次（滚动、resize）
function throttle(fn, interval) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}
```

### 柯里化

```js
const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
};

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6
```

<!-- KNOWLEDGE-IMPORT:START -->

## 循环依赖(CJS / ESM 各自表现)

## TL;DR

> A → B → A 的循环。**CJS** 给后请求方一个**部分初始化**的对象(可能是空 `{}`);**ESM** 通过 hoisting + live binding 部分解决,但 `const` / `class` 访问仍会 TDZ 报错。最佳方案是**避免**(提取共享、依赖注入、延迟引用),而不是依赖语言行为。

## 背景与动机

中大型项目难免出现循环:

- A 模块用 B 的工具函数,B 模块同时用 A 的常量
- monorepo 包 X / Y 互相引
- "barrel export"(`index.ts` 导出所有子模块)是循环温床

循环本身有时能跑(因为延迟到运行时才用),但常见症状:

- "Cannot access 'X' before initialization"(ESM TDZ)
- 拿到的对象是 `{}`(CJS 部分初始化)
- 生产构建报警但 dev 模式不报
- 间接循环(A→B→C→A)很难肉眼发现

**循环依赖几乎都是设计味儿不对的信号**,理解机制是为了**避免**它,而不是和它周旋。

## 核心机制

### CJS 循环依赖行为

```js
// a.cjs
console.log('a start');
exports.done = false;
const b = require('./b.cjs');
console.log('in a, b.done =', b.done);
exports.done = true;
console.log('a end');

// b.cjs
console.log('b start');
exports.done = false;
const a = require('./a.cjs');
console.log('in b, a.done =', a.done); // 注意!
exports.done = true;
console.log('b end');

// main.cjs
require('./a.cjs');
```

输出:

```
a start
b start
in b, a.done = false     ← b 拿到的是"半成品" a(只有 exports.done = false)
b end
in a, b.done = true
a end
```

**关键**:CJS 在 `require` 时:

1. 检查 require.cache,有则直接返回(即便不完整)
2. 没有则创建 module 对象 + 缓存 + 执行

A 还没跑完就被 B require,B 拿到的是 A 当时的 `module.exports`(仅前几行设置过的部分)。后续 A 继续设置 `exports.done = true`,但**B 那一帧已经过去了**。

**因此 CJS 循环依赖最大坑**:**对象方法 / 函数引用通常能跑**(等到调用时再去读 `a.fn`,那时 fn 已存在);**直接解构常量或值会拿到旧版**。

### ESM 循环依赖行为

```js
// a.mjs
import { B } from './b.mjs';
export const A = 'A';
console.log('a sees B:', B);

// b.mjs
import { A } from './a.mjs';
export const B = 'B';
console.log('b sees A:', A); // ❌ ReferenceError: Cannot access 'A' before initialization

// main.mjs
import './a.mjs';
```

**机制**:

1. **Construction 阶段**:Node 解析 import 图,发现 a/b 循环,确定 evaluation 顺序(从 a 开始,因为是入口)
2. **Instantiation 阶段**:为每个模块的 export 分配绑定槽(空)
3. **Evaluation 阶段**:开始执行 a → 遇到 import b → 切到 b → b 中 `import { A } ...` 通过 live binding 拿到 a 的 A 绑定**但还没赋值** → 访问 A → **TDZ ReferenceError**

如果 B 不是顶层访问 A,而是在函数体里:

```js
// b.mjs
import { A } from './a.mjs';
export const B = 'B';
export function readA() {
  return A;
} // 函数体延迟到调用,届时 A 已就位
```

这样 b 能跑完,后续调用 `readA()` 时 A 已经赋值,正常返回。

**总结**:ESM 循环依赖**顶层访问 const/class** → TDZ;**函数内使用** → 一般 OK,因为函数调用是在 evaluation 完成之后。

### 检测工具

| 工具                                             | 特点                                   |
| ------------------------------------------------ | -------------------------------------- |
| `madge`                                          | 经典,输出依赖图;`madge --circular src` |
| `dpdm`                                           | 现代,支持 TS,monorepo                  |
| `eslint-plugin-import` 的 `import/no-cycle`      | 编译时报警                             |
| Webpack / Rollup 构建警告                        | 内置                                   |
| TS `compilerOptions.module: 'nodenext'` 严格模式 | 部分场景告警                           |

### 修复方案

| 方案                           | 适用                                                  |
| ------------------------------ | ----------------------------------------------------- |
| **提取共享代码到第三方模块 C** | A 和 B 共用的部分挪到 C,A → C ← B,断环                |
| **依赖注入**                   | 运行时传入而非 import,改 A、B 接口签名                |
| **延迟引用**                   | 不在顶层 import,函数内 `require()` / `await import()` |
| **拆 barrel**                  | `index.ts` 太大常造成循环,改用直接路径 import         |
| **type-only import**           | TS 中 `import type` 编译后会被擦除,不参与运行时循环   |

## 代码示例

### 检测循环依赖

```bash
# 安装
npm i -D madge

# 检测
npx madge --circular --extensions ts,tsx,js src

# 输出依赖图(可视化)
npx madge --image dep.svg src
```

### 修复:提取共享模块

```ts
// ❌ 循环
// user.ts
import { Post } from './post';
export class User {
  posts: Post[] = [];
}

// post.ts
import { User } from './user';
export class Post {
  author!: User;
}

// ✅ 提取共享类型到 types.ts
// types.ts
export interface UserType {
  posts: PostType[];
}
export interface PostType {
  author: UserType;
}

// user.ts
import { UserType, PostType } from './types';
export class User implements UserType {
  posts: PostType[] = [];
}
// post.ts 同样改
```

### 修复:延迟引用

```js
// b.mjs
let cachedA;
async function getA() {
  if (!cachedA) cachedA = (await import('./a.mjs')).A;
  return cachedA;
}
export async function readA() {
  return getA();
}
```

## 易错点 / 反例

### 1. 间接循环(A→B→C→A)

肉眼很难发现,必须用工具(madge / dpdm)。常见模式:**barrel 文件**作为中转:

```
src/index.ts → src/user/index.ts → src/post/index.ts → src/index.ts(回到自身)
```

### 2. CJS 顶层解构拿到 undefined

```js
// a.cjs
const { B_VALUE } = require('./b.cjs'); // 此时 b 还没设 B_VALUE
console.log(B_VALUE); // undefined

module.exports = { A_VALUE: 1 };
```

### 3. TS `type-only import` 误判循环

```ts
// 这条 import 在编译后会被擦除,实际不构成运行时循环
import type { User } from './user';
```

但有些工具(老 eslint-plugin-import)仍会标记为循环。配 `import/no-cycle: ['error', { 'ignoreExternal': true, 'allowUnsafeDynamicCyclicDependency': false }]` 时要看是否支持 type 排除。

### 4. monorepo 跨包循环

`package-a` 依赖 `package-b`,`package-b` 又依赖 `package-a`:

- pnpm / yarn workspaces 通常允许(都本地链接),但运行时仍可能 TDZ
- 发布到 npm 时 `npm install` 会报循环依赖警告
- 修复:提一个 `package-core` / `package-shared`,A、B 都依赖 core

### 5. dev 模式不报 / 生产报

- dev 模式用 ESM(vite),报 TDZ
- 生产 bundler 把 ESM 转 CJS,可能 silent 跑通(但拿到空对象)
- 反过来也可能

务必两种模式都跑一遍测试。

### 6. barrel export 是循环温床

```ts
// src/index.ts
export * from './user';
export * from './post';

// src/user/index.ts
import { Post } from '../'; // 导入根 barrel → 循环
```

解决:在子模块里**只 import 具体路径**,不要 import 根 barrel。

## 高频面试题(5 题)

- **Q1**: CJS 和 ESM 在循环依赖时的行为差异?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **CJS**:require 命中缓存即返回当前 `module.exports`(可能不完整,后续设置的属性此时还没有);后续才补全,但调用方那一帧拿到的是半成品
  - **ESM**:静态分析时构建模块图,evaluation 时按拓扑顺序执行;循环点上**绑定**已经存在但**未初始化**,顶层访问 const/class 抛 TDZ ReferenceError;函数内引用不报,因为函数调用延迟到 evaluation 完成

  共同点:都依赖"什么时候用 + 什么时候被定义"的时序,**不能依赖**特定语言行为。

  &lt;details&gt;

- **Q2**: 怎么检测循环依赖?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **`madge --circular src`**:经典工具,支持 TS,输出循环路径
  - **`dpdm`**:现代,monorepo 友好
  - **eslint-plugin-import 的 `import/no-cycle` 规则**:编译时报警
  - **webpack 构建警告 / rollup `--circular-warning`**
  - **CI**:把检测加入 pipeline,有循环就 fail

  &lt;details&gt;

- **Q3**: 分析这段 CJS 代码输出:

  ```js
  // a.cjs
  exports.done = false;
  const b = require('./b');
  exports.done = true;

  // b.cjs
  exports.done = false;
  const a = require('./a');
  console.log('a.done =', a.done);
  exports.done = true;
  ```

  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  输出 `a.done = false`。流程:

  1. require('a') 开始,a.cjs 设 exports.done = false,然后 require('b')
  2. b.cjs 开始,设 exports.done = false,require('a') → **命中缓存,返回当前 a.exports**(此时 done 是 false)
  3. b 打印 `a.done = false`
  4. b 跑完返回
  5. a 继续,设 exports.done = true 跑完

  **教训**:CJS 循环里**直接读取属性**得到的是"那一刻的快照",不是最终值。

  &lt;details&gt;

- **Q4**: 怎么避免循环依赖?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. **提取共享**:把 A、B 共用的类型/常量/工具挪到 C,A 和 B 都依赖 C,断环
  2. **拆 barrel**:不要让 index.ts 同时导出和被子模块引用
  3. **依赖注入**:运行时把依赖传进函数,而不是 import
  4. **延迟引用**:在函数体内动态 require / `await import()`,而非顶层 import
  5. **TS type-only import**:`import type` 编译后擦除,不影响运行时
  6. **CI 兜底**:用 madge / eslint-plugin-import 在 CI 把循环挡掉

  &lt;details&gt;

- **Q5**: 为什么 TS `import type` 不会造成运行时循环?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `import type { X } from './m'` 是 TS 编译时的"类型导入",**编译输出 JS 时整条 import 语句被擦除**(没有运行时副作用),只用于类型检查。所以:

  - 不参与运行时模块加载顺序
  - 不会触发 TDZ
  - 仍能被 IDE / tsc 用作类型推导

  代价:不能用于真正的运行时(如 `class` 当值用 / instanceof);如果代码同时需要类型和值,要用普通 import + `import type` 配合。

  &lt;details&gt;

## 延伸资源

- [Node.js: Cycles in CJS](https://nodejs.org/api/modules.html#cycles)
- [Node.js: ECMAScript Modules](https://nodejs.org/api/esm.html)
- [madge](https://github.com/pahen/madge)

## (留白) 我的理解

> 这一段不强制填。

---

## CommonJS vs ESM(运行时 vs 静态)

## TL;DR

> **CJS**(Node 传统)用 `require/module.exports`,**运行时**同步加载,出口是值的**拷贝**;**ESM**(语言标准)用 `import/export`,**静态分析**、异步加载、出口是**实时绑定**(live binding)。互操作有复杂规则,新项目优先 ESM。

## 背景与动机

JS 模块化历史:

- **2009 CommonJS**:Node 自创,解决服务器端模块化(浏览器没有 require)
- **2015 ES2015 (ES6) ESM**:语言标准,静态可分析,跨平台
- **2019+ Node 13** 起原生支持 ESM
- **2026** ESM 已是主流,但 npm 上海量 CJS 包仍在用

两套模块系统并存导致的常见痛点:

- "ERR_REQUIRE_ESM" / "Cannot use import statement outside a module"
- TS 配置 module 选项一脸懵
- bundler 处理 dual-package 时的 hazards

理解 CJS/ESM 的本质差异 + 互操作规则,是写库、配 bundler、调依赖问题的基础。

## 核心机制

### CJS 的运行时模型

```js
// math.js
function add(a, b) {
  return a + b;
}
module.exports = { add };

// app.js
const math = require('./math');
math.add(1, 2);
```

- `require('./math')` 是**函数调用**,**运行时**执行:
  1. 解析路径(查 node_modules / 后缀 / index.js)
  2. 读文件 → 包装成 `function(exports, require, module, __filename, __dirname){...}`
  3. 同步执行 → 返回 `module.exports`
  4. 缓存在 `require.cache[abs_path]`,二次 require 直接拿
- `module.exports` 是普通对象,导出**是值的拷贝(对原始值)** 或**引用拷贝(对对象)**
- 没有静态分析:require 路径可以是动态字符串、可以在 if 里

### ESM 的静态模型

```js
// math.js
export function add(a, b) {
  return a + b;
}

// app.js
import { add } from './math.js';
add(1, 2);
```

- `import / export` 是**关键字**,**静态分析**(parse 阶段就知道有哪些模块、哪些导出)
- 加载分三阶段:
  1. **Construction**:解析模块图(根据 import 关系),所有文件加载、parse、build module record
  2. **Instantiation**:为每个模块分配绑定(exports / imports linkage)
  3. **Evaluation**:按拓扑顺序执行每个模块(只一次)
- 绑定是**live**:`import { x } from './m.js'`,m.js 里 `x` 后续变化,import 端立即看到
- 默认严格模式(`"use strict"` 不写也强制)
- 顶层可 `await`(top-level await)

### Live Binding 对比拷贝

```js
// counter.cjs
let n = 0;
function inc() {
  n++;
}
module.exports = { n, inc };

// app.cjs
const { n, inc } = require('./counter.cjs');
inc();
console.log(n); // 0  ← n 已被解构成拷贝,不变

// counter.mjs
export let n = 0;
export function inc() {
  n++;
}

// app.mjs
import { n, inc } from './counter.mjs';
inc();
console.log(n); // 1  ← live binding,源头变了 import 端跟着变
```

**含义**:

- CJS 解构后断了引用 → 频繁踩坑("为什么我导出的状态没变?")
- ESM 保持绑定 → 也意味着不能直接给 import 的变量赋值(`n = 5` 报 TypeError)

### Node 的"哪种模块"判定

| 触发条件                                             | 模块类型 |
| ---------------------------------------------------- | -------- |
| `.mjs` 后缀                                          | ESM      |
| `.cjs` 后缀                                          | CJS      |
| `.js` + package.json 里 `"type": "module"`           | ESM      |
| `.js` + package.json 没 type 或 `"type": "commonjs"` | CJS      |
| Node CLI 传 `--input-type=module`                    | ESM      |

### 互操作规则

#### ESM 引 CJS

```js
// math.cjs
module.exports = { add: (a, b) => a + b };

// app.mjs
import math from './math.cjs'; // 整个 module.exports 当 default
import { add } from './math.cjs'; // 命名导出:Node 试图静态分析其属性,**可能失败**
const { add } = math; // 安全做法
```

Node 的 ESM loader 会**静态分析 CJS 的 module.exports 属性**(detect via cjs-module-lexer),识别成功就支持命名导入;识别失败必须用 default。

#### CJS 引 ESM

```js
// app.cjs
const m = await import('./math.mjs'); // 必须用动态 import,且要 await
m.add(1, 2);
```

ESM 是异步的,**CJS 不能 require ESM**(`ERR_REQUIRE_ESM`)。从 CJS 里 `await import()` 是唯一通路。

#### "Dual Package"(同时发 ESM 和 CJS)

package.json:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

但要小心 **dual package hazard**:同一个库同时被 ESM 和 CJS 加载 → 库内的"全局状态"(单例 / 缓存)出现两份。库设计时尽量避免顶层全局状态。

### ESM 里的 `__dirname` / `__filename`

ESM 没有这两个变量,需要:

```js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Node 20.11+ / 21.2+ 起可直接:
const __dirname = import.meta.dirname;
const __filename = import.meta.filename;
```

## 代码示例

```js
// 1. ESM 中创建 require(过渡阶段需要)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const json = require('./data.json'); // ESM 早期不支持 import JSON,现在可用 import assertion

// 2. 动态 import(返回 Promise)
const { default: lodash } = await import('lodash');
const mod = await import(`./locales/${lang}.mjs`); // 路径动态,只能动态 import

// 3. import attributes(ES2025)
import data from './config.json' with { type: 'json' };
```

## 易错点 / 反例

### 1. `ERR_REQUIRE_ESM`

```
Error [ERR_REQUIRE_ESM]: require() of ES Module /path/to/x.mjs is not supported.
```

**根因**:在 CJS 文件里试图 require 一个 ESM 模块。
**修复**:

- 把消费方改成 ESM(`.mjs` 或 `"type": "module"`)
- 或用动态 import:`const x = await import('...')`
- Node 22+ 部分 ESM 模块可同步 require(实验,要无 top-level-await)

### 2. ESM 中 `__dirname` undefined

```js
import x from `${__dirname}/x.js`;      // ❌ ReferenceError
```

**修复**:用 `import.meta.dirname`(Node 20.11+)或 `fileURLToPath(import.meta.url)`。

### 3. CJS 解构后失去 live 更新

```js
const { count } = require('./counter'); // count 是拷贝,不再随源头变
const counter = require('./counter'); // 通过 counter.count 访问能拿到最新
```

ESM 用解构仍是 live(绑定语义不同),CJS 解构就断了。

### 4. ESM 里 `import` 必须在顶层

```js
if (cond) {
  import x from './x.mjs'; // ❌ SyntaxError
}
// 修复:
if (cond) {
  const x = (await import('./x.mjs')).default;
}
```

### 5. `default` 导出在 ESM 引 CJS 时的奇怪表现

```js
// lib.cjs
module.exports = function () { ... };

// app.mjs
import lib from './lib.cjs';        // lib 是那个函数(default = module.exports)
import { something } from './lib.cjs';   // ❌ 可能识别失败
```

**修复**:对纯函数 / 单值导出,只用 default。

### 6. tsconfig `module` 选项与运行时不符

TS 输出 `commonjs`,但 Node 跑 `"type": "module"` → 满屏报错。要么 tsc 输出 ESM,要么 package.json 不写 type。

| tsconfig module       | 输出                       |
| --------------------- | -------------------------- |
| `commonjs`            | CJS,用 require             |
| `esnext` / `nodenext` | ESM,用 import              |
| `nodenext`            | Node 双制式,按文件后缀决定 |

## 高频面试题(5 题)

- **Q1**: CommonJS 和 ESM 的核心差异?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **加载时机**:CJS 运行时(同步);ESM 编译期/静态分析(异步)
  - **导出语义**:CJS 是值拷贝(对原始)/引用拷贝(对对象);ESM 是 live binding
  - **路径**:CJS 支持动态字符串;ESM 必须字面量(动态用 `import()`)
  - **顶层 await**:CJS 不支持;ESM 支持
  - **默认严格模式**:CJS 否;ESM 是
  - **互操作**:CJS 不能 require ESM;ESM 可 import CJS(default + 命名)

  &lt;details&gt;

- **Q2**: 什么是 live binding?为什么 ESM 这么设计?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ESM 中 `import { x } from 'm'` 拿到的是对 m 的 `x` 绑定的**引用**,而不是值拷贝。m 里 x 重新赋值,导入端立即看到。

  设计意图:

  - 支持循环依赖时部分可见(避免拿到死值)
  - 让模块系统可静态分析(编译期就能确定哪些 export 被引用 → tree shaking)
  - 防止开发者意外修改 import 的变量(`x = 1` 抛 TypeError,语义更清晰)

  &lt;details&gt;

- **Q3**: ESM 中怎么获取 `__dirname`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ESM 没有这两个变量(它们是 CJS 包装函数的参数),要用 `import.meta`:

  ```js
  // Node 20.11+ / 21.2+
  const __dirname = import.meta.dirname;
  const __filename = import.meta.filename;

  // 老版本通用
  import { fileURLToPath } from 'url';
  import { dirname } from 'path';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

  &lt;details&gt;

- **Q4**: CJS 和 ESM 怎么互操作?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  **ESM 引 CJS**:`import x from './m.cjs'` → x 是 `module.exports`;命名导入由 Node 用 cjs-module-lexer 静态分析 `module.exports` 的属性而支持(可能失败,失败用 default 再解构)。

  **CJS 引 ESM**:必须 `await import('./m.mjs')`(ESM 是异步)。同步 `require` ESM 会抛 `ERR_REQUIRE_ESM`(Node 22+ 部分场景可同步,要求被 require 的 ESM 无 top-level await)。

  **库作者发双制式**:package.json `"exports"` 配 `import` / `require` 两条路径,小心 dual package hazard。

  &lt;details&gt;

- **Q5**: tsconfig 的 `module` 选项怎么选?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **`commonjs`**:输出 CJS,适合发布到 Node CJS 老生态
  - **`esnext`**:输出原汁原味 ESM,适合现代库/应用
  - **`nodenext`**(推荐):按文件后缀和 package.json type 自动判定,贴近 Node 真实行为
  - **`bundler`**(TS 5.0+):适合给打包器吃,不做 .js 后缀强制等

  踩坑常见原因:tsconfig 输出 CJS,但 package.json 写 `"type": "module"` → 运行时拒绝。两者必须一致。

  &lt;details&gt;

## 延伸资源

- [Node.js: ECMAScript Modules](https://nodejs.org/api/esm.html)
- [ECMA-262: Modules](https://tc39.es/ecma262/#sec-modules)
- [MDN: JavaScript Modules](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)

## (留白) 我的理解

> 这一段不强制填。

---

## Tree Shaking 原理与 sideEffects

## TL;DR

> Tree Shaking = 打包器在**静态分析**阶段删除"导出但没被引用"的代码。**前提三件套**:① ESM(静态 import/export) ② 模块/语句无副作用(`sideEffects: false` 或 `/*#__PURE__*/`)③ 生产模式(开启 minifier 真正删除)。

## 背景与动机

为什么要 tree shaking:

- 引入 `lodash`(72KB)只用 `debounce`,正常情况打包仍把 72KB 全塞进 bundle
- import \* as utils 让所有命名空间都进 bundle
- 死代码(配置开关下的某分支)永远不会跑但仍占体积

Tree shaking 起源于 Rollup(2015),Webpack 2 / 4 跟进,esbuild / SWC / Vite 都支持。理解机制能让你:

- 写库时给消费者最佳 tree shake 友好的导出方式
- 读 bundle 分析(`webpack-bundle-analyzer`)时知道为啥"shake 不掉"
- 配 `sideEffects` 字段时不踩坑

## 核心机制

### 三件套前提

| 前提                       | 含义                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| **ESM 静态**               | import/export 是关键字,路径字面量;CJS 的 `require()` 是运行时动态调用,**不可静态分析** |
| **无副作用**               | "导入了不调用任何函数"等于"什么都没做";一旦顶层有副作用(IIFE、polyfill、CSS),不能删    |
| **生产模式 / minifier 删** | 打包器**标记**未使用 export,删除工作交给 terser / esbuild minifier                     |

任一前提不满足 → tree shaking 失效。

### Tree Shaking 流程

```
1. Parse 所有模块 → 构建 ESM 模块图
2. 从 entry 出发标记 used exports(usedExports)
3. 用 sideEffects 字段决定:无副作用模块的未使用 export 可整段删
4. 把所有 reachable 代码喂给 minifier
5. minifier 做 dead code elimination(DCE),实际剔除
```

### `sideEffects` 字段(package.json)

| 写法                                            | 含义                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `"sideEffects": false`                          | 整个包**完全无副作用**,所有未用 export 都可删              |
| `"sideEffects": ["*.css", "./src/polyfill.js"]` | 列出有副作用的文件,**其他**视为无副作用                    |
| 不写                                            | 打包器保守判断:**所有顶层语句都视为可能有副作用**,删不彻底 |

### "副作用"的判断

打包器视以下为副作用:

- 顶层函数调用(`init()`)
- 顶层 IIFE(`(()=>{})()`)
- 顶层 `console.log` / 修改全局
- import CSS / 全局 polyfill(`import 'core-js'`)
- 修改 `Object.prototype` 等内置原型

### `/*#__PURE__*/` 注释 —— 局部副作用豁免

告诉 minifier"这一个调用没副作用,如果返回值没用就删":

```js
export const debounce = /*#__PURE__*/ createDebounce(...);
```

不加注释时,`createDebounce(...)` 看起来像副作用,即便没人用 `debounce` 也保留。库作者大量用这个标记。

### 工具表现对比

| 工具          | Tree Shake 强度                 | 备注                         |
| ------------- | ------------------------------- | ---------------------------- |
| **Rollup**    | 最强,最早做                     | 适合库打包,默认 tree shake   |
| **Webpack**   | 强(`usedExports + sideEffects`) | 生产模式默认开               |
| **esbuild**   | 中,快但保守                     | 速度优先,部分边缘 case 不删  |
| **SWC**       | 中,类似 esbuild                 | -                            |
| **Vite 生产** | 强(用 Rollup)                   | 开发用 esbuild,生产切 Rollup |

## 代码示例

### 写库时让 tree shake 友好

```js
// ✅ 单独命名导出 + sideEffects: false
// utils.mjs
export function add(a, b) {
  return a + b;
}
export function sub(a, b) {
  return a - b;
}

// 消费方
import { add } from 'my-utils'; // sub 不会进 bundle
```

### "barrel export" 的常见破坏

```js
// ❌ index.js(barrel)
export * from './a';
export * from './b';
export * from './c';

// 消费方
import { f } from 'my-lib';
// 打包器要确认 a/b/c 是否有副作用,任一不能确定就全保留
```

**修复**:

- 加 `package.json` 的 `sideEffects: false`
- 或让消费者直接 `import { f } from 'my-lib/a'`(绕过 barrel)

### `/*#__PURE__*/` 给函数调用打标

```js
// utils.js
const heavy = /*#__PURE__*/ createHeavy();
export { heavy };

// 消费方没用 heavy → 整段可删
```

## 易错点 / 反例

### 1. 引 CJS 包就完全无 tree shake

```js
// my-app.mjs
import { debounce } from 'old-lib'; // old-lib 是 CJS
// → debounce 一定连同 old-lib 全部代码进 bundle
```

**修复**:

- 优先选 ESM 版本(看 `exports` field)
- 用 `babel-plugin-lodash` / `lodash-es` 替代 lodash CJS
- 单独引子模块:`import debounce from 'lodash/debounce'`

### 2. `import * as ns from 'x'` 阻塞 tree shake

```js
import * as utils from './utils';
utils.add(1, 2);
// 打包器无法静态判断 utils 上的哪些 key 被用 → 保守保留全部
```

**修复**:改命名导入 `import { add } from './utils'`。

### 3. 顶层副作用代码删不掉

```js
// utils.js
console.log('loaded'); // 顶层副作用
export function unused() {}
```

即便 `unused` 没人用,因为顶层有 console.log,**整个文件**不能被 shake 掉。

**修复**:把 console.log 包到函数里,或加 `sideEffects: false`(但要确保真无副作用)。

### 4. CSS / polyfill 被 shake 掉(漏配 sideEffects)

```json
// 危险
{ "sideEffects": false }

// 但代码有
import './global.css';
import 'core-js';
```

这两条 import 没显式调函数,被认为"无用" → 删掉 → 生产样式 / polyfill 缺失。

**修复**:

```json
{ "sideEffects": ["*.css", "./src/polyfill.js"] }
```

### 5. 验证 tree shake 是否起效的方法

- `webpack-bundle-analyzer` / `rollup-plugin-visualizer` 看 bundle 内容
- 手写一个引一个函数的最小 demo,build 后看输出大小
- 在源码加 `/*! WHY_AM_I_HERE */` 注释 + 看 build 产物 grep

### 6. Webpack `optimization.usedExports` 没开生产模式

开发模式 `mode: 'development'` 默认不 tree shake(便于调试)。**只有 `mode: 'production'` 才真正开启**;或显式 `optimization: { usedExports: true, sideEffects: true }` + `minimize: true`。

## 高频面试题(5 题)

- **Q1**: Tree Shaking 的工作原理?有哪些前提?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  原理:打包器在静态分析阶段从 entry 出发,标记每个 import 引用了哪些 export(`usedExports`);未引用且模块/语句无副作用的部分被打成 dead code;最后 minifier(terser / esbuild)做 DCE 实际删除。

  前提三件套:

  - **ESM 静态**:import/export 是关键字可静态分析,CJS 的 require 是动态的
  - **无副作用**:模块顶层无副作用(或 `sideEffects: false` 显式声明)
  - **生产模式**:开 minifier,标记的死代码才真正删

  &lt;details&gt;

- **Q2**: 为什么 CJS 不能 tree shake?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  CJS 的 `require()` / `module.exports` 是运行时函数和对象操作,**不可静态分析**:

  ```js
  module.exports = condition ? { a: 1 } : { b: 2 };
  ```

  打包器无法在编译期确定 `module.exports` 上有什么 → 保守保留全部。

  现代 bundler 对 CJS 有部分静态分析(`cjs-module-lexer`)能识别"简单"的 module.exports 模式,但远不如 ESM 彻底。**优先用 ESM 版本的包**。

  &lt;details&gt;

- **Q3**: `import * as` 为什么破坏 tree shaking?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```js
  import * as ns from './utils';
  use(ns); // 整个 ns 被传出去,无法确定哪些 key 被用
  ```

  打包器无法静态推断 `ns.x` 哪些 x 被引用(可能动态访问 `ns[k]`,可能传给函数后读)→ 保守保留 utils 的所有 export。

  **修复**:改用命名导入 `import { x, y } from './utils'`,让打包器明确知道哪些被用。

  &lt;details&gt;

- **Q4**: `sideEffects: false` 风险在哪?怎么处理 CSS / polyfill?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  风险:声明整个包"无副作用"后,顶层没用 export 的 CSS / polyfill / `import 'init'` 一类的代码会被 tree shake 掉,生产环境样式或 polyfill 缺失。

  处理:

  ```json
  "sideEffects": ["*.css", "*.scss", "./src/polyfill.js"]
  ```

  显式列出有副作用的文件;其他视为无副作用。或者写代码时把"必须执行"的初始化包成函数,消费方调用一次,让其变成"有用"。

  &lt;details&gt;

- **Q5**: 怎么验证一个 import 真的 tree shake 起效了?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. 写一个最小 demo:`import { onlyOne } from 'lib'`,生产 build
  2. 用 `webpack-bundle-analyzer` / `rollup-plugin-visualizer` 看 bundle
  3. 在 lib 的"不应该被引入"的 export 里加唯一注释或字符串(`/*! __SHAKE_TEST__ */`),build 后 grep 产物,没出现说明 shake 成功
  4. 测 bundle 大小对比(引一个 vs 引整个 lib)
  5. 检查 lib 的 package.json:`"sideEffects": false`、`"module": "..."`、`"exports"` 字段是否正确

  &lt;details&gt;

## 延伸资源

- [Webpack: Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [Rollup 文档](https://rollupjs.org/introduction/)
- [web.dev: CommonJS makes bundles larger](https://web.dev/articles/commonjs-larger-bundles)

## (留白) 我的理解

> 这一段不强制填。

---

## Rollup / esbuild / SWC 三件套对比

## TL;DR

> **Rollup**:库打包之王(tree shake 最彻底,Vite 生产用它);**esbuild**:Go 写的极速 bundler+minifier(dev 工具链 / TS 转换);**SWC**:Rust 写的 Babel 替代(Next.js 默认编译器)。三者各占一角,常组合使用。

## 背景与动机

Webpack / Babel 时代,前端构建慢得让人发指 —— 大项目 build 几分钟、dev start 半分钟。这是因为它们用 JS 写,而 JS 跑 JS 编译器存在固有性能上限。

2020+ 一波 native(Rust / Go)工具崛起:

- **esbuild**(2020,Evan Wallace,Go):快 10-100x
- **SWC**(2020+,Donny Wang,Rust):babel 兼容替代,快 20-70x
- **Turbopack**(2022,Vercel,Rust):Webpack 接班人(实验)

但它们不是简单的"快替代",每个工具有定位差异。理解工具特性 + 实战组合 = 写库 / 配 CI / 选型时不踩坑。

## 核心机制

### Rollup

**定位**:库打包之王。

- 主打 ESM 模块化,**tree shake 最早最强**
- 输出干净,可控:能精确指定 IIFE / UMD / ESM / CJS 多格式
- 插件生态丰富(@rollup/plugin-\* + 大量社区)
- **不适合应用**:HMR / CSS / 多入口 / dev server 需要大量插件配置
- Vite 生产模式用 Rollup

**适用**:

- 发布 NPM 库(React / Vue / 大部分 lib)
- 简单 SPA
- 通过 Vite 间接使用

### esbuild

**定位**:极速 bundler + minifier + 转换器。

- Go 写,大量并行化,通常**比 webpack / rollup 快 10-100x**
- 单一二进制,无需 Node 依赖
- 支持:JS / TS / JSX / CSS minify / sourcemap / 树摇 / 多入口
- 缺点:
  - tree shake 较保守(某些 case 删不掉)
  - 装饰器(TS legacy)支持有限
  - chunk 切分(代码分割)不如 Rollup 精细
  - 插件 API 比 Webpack/Rollup 简单(部分场景表达力不足)

**适用**:

- dev server 转换(Vite dev、tsx、wmr)
- 工具链 minifier(Vite production 默认 esbuild minify)
- CLI 工具 / 简单 bundle(esbuild 单独跑也能用)

### SWC(Speedy Web Compiler)

**定位**:Babel 的快替代(也能打包)。

- Rust 写,**比 babel 快 20-70x**
- 100% 兼容 Babel 大部分 plugin(API 不完全等价,但常用都覆盖)
- 包含:`@swc/core`(转换器)、`@swc/cli`、`swcpack`(打包器实验)、`swc-loader`(webpack 集成)
- Next.js 13+ 默认编译器(替代 babel)
- Deno / Parcel 内部用 SWC
- 缺点:个别 Babel plugin 不支持(自定义 plugin、experimental 语法)

**适用**:

- 替换 Babel 做 TS / React 转换
- Next.js / Nuxt / 自建工具链
- 大型 monorepo 想砍 babel 编译时间

### 三者横向对比

| 维度       | Rollup                  | esbuild             | SWC                 |
| ---------- | ----------------------- | ------------------- | ------------------- |
| 语言       | JS                      | Go                  | Rust                |
| 速度       | 中(JS 实现)             | 极快                | 极快                |
| Tree shake | ⭐⭐⭐⭐⭐              | ⭐⭐⭐              | ⭐⭐ (打包功能尚弱) |
| 装饰器     | 插件支持                | 部分                | ✅                  |
| 输出格式   | esm/cjs/iife/umd        | esm/cjs/iife        | 主要 esm/cjs        |
| 插件生态   | 大                      | 中                  | 小                  |
| 主战场     | 库打包                  | dev 工具链 / minify | Babel 替代          |
| 典型用户   | React / Vue / Vite prod | Vite dev / tsx      | Next.js             |

### 现代实战组合

#### 发布 NPM 库

```
Rollup + esbuild minify + @rollup/plugin-typescript / unplugin-swc(TS 转换)
```

- 输出 ESM + CJS 双格式
- 配合 `tsup` / `unbuild`(对 Rollup 的封装)更省力

#### Web 应用

```
Vite(esbuild prebundle + Rollup 生产)+ swc-loader / @vitejs/plugin-react-swc
```

#### Next.js

```
SWC(默认)+ Turbopack(实验)
```

#### 替换大型 webpack 项目的 babel

```
webpack + swc-loader(替 babel-loader)
```

通常砍 50-70% build 时间。

## 代码示例

### 用 tsup 打包一个 NPM 库(Rollup 封装)

```ts
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, // 输出 .d.ts
  sourcemap: true,
  clean: true,
  minify: true,
});
```

一行命令双格式输出,内部用 esbuild + Rollup。

### 单独用 esbuild

```js
// build.mjs
import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm',
  target: 'es2020',
  minify: true,
  jsx: 'automatic',
  loader: { '.png': 'file' },
});
```

### 用 SWC 替 Babel(webpack 项目)

```js
// webpack.config.js
module: {
  rules: [
    {
      test: /\.(ts|tsx)$/,
      use: {
        loader: 'swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic' } },
          },
        },
      },
    },
  ],
},
```

## 易错点 / 反例

### 1. 误用 esbuild 做生产 bundler(应用)

小项目可以,但中大型应用建议 Rollup / Webpack:

- esbuild tree shake 漏删
- chunk 策略简单
- 插件少,边缘场景不好处理

esbuild 作 dev server / minifier / 库打包速度极佳,作大型应用生产 bundler 仍需补很多东西。

### 2. SWC 配置和 Babel plugin 不完全等价

```js
// babel
"presets": ["@babel/preset-env", "@babel/preset-react"]
"plugins": ["babel-plugin-styled-components"]

// swc
{
  jsc: { transform: { react: { ... } } },
  // styled-components 需要 @swc/plugin-styled-components(Rust 写)
}
```

个别 babel plugin 没移植到 SWC(看 swc-project 仓库的 plugins)。**迁移前先列出依赖的 plugin 检查兼容性**。

### 3. esbuild 装饰器(TS legacy)支持有限

```ts
@Controller('/api')          // experimental decorator
class UserController { ... }
```

esbuild 支持 ES2022 stage-3 decorators,**TS legacy decorator**(`experimentalDecorators: true`)不支持。NestJS / typeorm 类项目用 esbuild 会爆。

**修复**:换 SWC(支持 legacy decorator)或 tsc。

### 4. Rollup 输出 CJS 时的 default 处理

```js
// Rollup 默认输出
exports.default = whatever;

// 消费方
const x = require('./out.cjs');
x();                          // ❌ x 是 { default: whatever }
x.default();                  // ✅

// 配置:把 default 导出"原始化"
output: {
  format: 'cjs',
  exports: 'default',         // 让 module.exports = whatever
}
```

### 5. terser 比 esbuild 小但慢

- esbuild minify:**快**(秒级),输出可能比 terser 大 5-10%
- terser:**慢**(可能慢 50x),但极致压缩

生产推荐:小项目 esbuild minify(够用),极致体积项目用 terser。Vite ���置:`build.minify: 'terser'`。

### 6. SWC 静态分析能力 < 老 babel 巨石插件链

某些 babel 插件依赖元程序级反射(`babel-plugin-macros` 等),SWC 没全套生态对应物。改造时要列依赖,逐个找对应。

## 高频面试题(5 题)

- **Q1**: Rollup / webpack / esbuild / SWC 各自定位是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Rollup**:库打包之王,tree shake 最彻底,输出干净,Vite 生产模式用它
  - **Webpack**:应用打包瑞士军刀,生态最大,适合大型 SPA / 多入口 / Module Federation
  - **esbuild**:Go 写的极速 bundler+minifier,主战场:dev server / minify / TS 转换 / 简单打包
  - **SWC**:Rust 写的 Babel 替代,主战场:替 babel 做 TS/JSX 转换,Next.js 默认编译器

  实战常组合:**Vite(esbuild prebundle + Rollup 生产)**、**Next.js(SWC + Turbopack)**、**库(tsup = esbuild + Rollup)**。

  &lt;details&gt;

- **Q2**: 为什么发布 NPM 库优先选 Rollup 而不是 webpack?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Tree shake 更彻底**:Rollup 是为 ESM 而生
  - **输出干净**:Rollup 产物代码量少、可读、可控;webpack 会附带 runtime / chunk loader 等运行时代码,库不需要
  - **多格式输出方便**:Rollup 一次 build 可输出 ESM/CJS/IIFE/UMD,webpack 输出多格式麻烦
  - **没有 dev-server 等冗余**:库不需要 HMR / dev server

  封装层:`tsup` / `unbuild` 是对 Rollup 的友好封装,推荐用它们而不是裸 Rollup。

  &lt;details&gt;

- **Q3**: esbuild 为什么这么快?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Go 实现 + 原生编译**:无 GC pause,无 JIT warmup
  - **大量并行化**:parse / transform / minify 各阶段都用 goroutine 并发
  - **精简的中间表示**:不追求 babel 那种"AST 通用插件"灵活性,直接做"够用的"AST
  - **避免冗余 IO**:文件读取、依赖解析高度优化
  - **零中间产物**:不写中间文件,内存里完成

  代价:可扩展性比 babel / webpack 弱(插件 API 简单)、tree shake 保守。

  &lt;details&gt;

- **Q4**: SWC 和 Babel 有什么区别?能完全替代吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **语言**:SWC Rust,Babel JS
  - **速度**:SWC 快 20-70x
  - **兼容性**:SWC 兼容大部分 Babel preset/plugin(`@babel/preset-env` / React / TS)
  - **生态**:Babel 巨大,SWC 还在追

  不能完全替代:

  - 自定义 babel plugin(尤其依赖 AST 操作的) → 通常无对应 SWC plugin
  - 个别 experimental 语法 SWC 还没支持
  - `babel-plugin-macros` / `unplugin` 等元程序级插件 SWC 多没对应

  实战:新项目直接 SWC;老 babel 项目迁移要列出依赖逐个对照。

  &lt;details&gt;

- **Q5**: 现代前端工具链怎么组合这些工具?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **库**:`tsup` / `unbuild`(Rollup + esbuild)
  - **Web 应用**:Vite(dev esbuild prebundle + 生产 Rollup;React 项目可选 `plugin-react-swc`)
  - **Next.js**:SWC 转换 + Webpack / Turbopack
  - **遗留 webpack 项目**:换 `swc-loader` 替 `babel-loader`,常砍 50%+ 编译时间
  - **CLI 工具 / Lambda 函数**:esbuild 直接打包

  原则:**Rollup 管干净输出,esbuild 管速度,SWC 管 TS/JSX 转换。各司其职**。

  &lt;details&gt;

## 延伸资源

- [Rollup](https://rollupjs.org/)
- [esbuild](https://esbuild.github.io/)
- [SWC](https://swc.rs/docs/getting-started)

## (留白) 我的理解

> 这一段不强制填。

---

## Vite(原生 ESM 开发 + Rollup 生产)

## TL;DR

> Vite 利用**浏览器原生 ESM**,开发时**不打包**(直接给浏览器吃 ESM 模块),只用 **esbuild** 预 bundle `node_modules`;生产时切到 **Rollup** 打包。冷启动从 webpack 的"N 秒"压到"百毫秒",HMR 也几乎瞬发。

## 背景与动机

Webpack 大项目痛点:

- dev start 慢:必须先完整 build 整个图才能起 server
- HMR 慢:改动可能让整条 chain 重新解析
- TS / JSX 转换走 Babel,大项目编译时间线性增长

Vite(2020,Evan You)的核心见解:**现代浏览器原生支持 ESM,为什么还要先把 ESM 打包成 CJS 再"模拟" ESM**?

策略:

- **Dev**:不打包,直接让浏览器走 ESM 网络瀑布
- **Prod**:仍要打包(因为 HTTP 多请求 / tree shake / 兼容性 / minify),用 Rollup
- **依赖预 bundle**:把 `node_modules` 里的 CJS / 多文件 ESM 用 esbuild 转成单文件 ESM,避免 1000 个网络请求

2026 年 Vite 已是新项目首选,Vue / Svelte / SolidJS / Nuxt 3 / Astro 等都基于它。

## 核心机制

### 开发模式工作流

```
浏览器请求 http://localhost:5173/src/main.ts
       ↓
   Vite dev server
       ↓
  1. 拦截请求,根据后缀走对应 plugin 流程:
     .ts → esbuild 转 JS
     .vue → vue-plugin 拆分 + 编译 template
     .scss → sass loader
  2. 返回**ESM**模块给浏览器
       ↓
  浏览器原生解析 import → 发请求拉下一个模块
       ↓
  按需加载 + 浏览器缓存
```

不预先把整个图打包 = 启动只花"启 server + index.html"那点时间。**项目越大优势越明显**(webpack 大项目 dev start 几十秒,Vite 仍是几百毫秒)。

### 依赖预 bundle(`optimizeDeps`)

为什么需要预 bundle:

- `node_modules` 里很多包是 CJS(浏览器不能直接吃)
- 即便 ESM,内部多文件 import 链可能几百次请求 → 慢

Vite 用 esbuild(Go 写,极快)在首次启动时把所有 `node_modules` 依赖打包成单个 ESM 文件,缓存到 `node_modules/.vite`:

```
node_modules/.vite/
├── deps/
│   ├── lodash-es.js          ← 单文件 ESM
│   ├── react.js
│   └── _metadata.json
```

之后浏览器请求 `import x from 'lodash-es'` → Vite 转向 `/node_modules/.vite/deps/lodash-es.js`。

### HMR(基于 ESM 的精确更新)

```
1. 文件改动 → Vite watcher 触发
2. 计算受影响模块的"边界"(谁 import 它,谁 accept HMR)
3. WebSocket 通知浏览器:"重新 import 这几个模块"
4. 浏览器用动态 import + 时间戳 query 强制重拉
5. import.meta.hot.accept 回调执行,替换 module
```

和 webpack HMR 的关键差异:**ESM 模块边界天然清晰**,不需要 jsonp / runtime 管理 module 注册表。

### 生产模式 = Rollup

```
vite build
   ↓
1. Rollup 完整构建依赖图(含 esbuild 转 TS / JSX)
2. Tree shake / 共享 chunk / minify(默认 esbuild,可换 terser)
3. 输出到 dist/
```

**为什么不用 esbuild 做生产 bundler**?

- esbuild tree shake 比 Rollup 弱
- esbuild 的 ESM chunk 切分能力还在成熟
- Rollup 插件生态完整(CSS / 资源 / polyfill / legacy)

### `import.meta.glob`(批量动态 import)

```js
// 一次性导入符合 glob 的所有模块
const modules = import.meta.glob('./pages/*.vue');
// modules: { './pages/Home.vue': () => import('./pages/Home.vue'), ... }

// eager: 预加载(同步)
const eager = import.meta.glob('./locales/*.json', { eager: true });
```

Vite 编译时把 glob 展开为静态 import map,运行时按需加载。常用于路由动态注册、i18n、图标库。

### 配置最小例

```js
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080' },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: { manualChunks: { vendor: ['vue', 'pinia'] } },
    },
  },
});
```

## 代码示例

### 利用 `import.meta.hot` 自定义 HMR

```ts
// counter.ts
let count = 0;
export const inc = () => ++count;
export const get = () => count;

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // 模块更新时把旧 count 迁移到新 module
    newModule._restore?.(count);
  });
  import.meta.hot.dispose(() => {
    // 卸载逻辑(清定时器、解事件等)
  });
}
```

### `import.meta.env` 注入环境变量

```ts
console.log(import.meta.env.MODE); // 'development' / 'production'
console.log(import.meta.env.VITE_API_URL); // .env 文件中以 VITE_ 开头的会暴露给客户端
```

## 易错点 / 反例

### 1. 误以为生产也是 esbuild

```bash
vite build      # 实际跑 Rollup,esbuild 只做 minify / TS 转换
```

看 build 产物分析时,要用 `rollup-plugin-visualizer`,不是 esbuild 工具。

### 2. 老代码用 `require()` 跑不起来

Vite **dev** 严格 ESM:

```js
const x = require('./x'); // ❌ Uncaught ReferenceError: require is not defined
```

**修复**:改 ESM(`import x from './x'`)。库依赖里的 CJS 由 optimizeDeps 转 ESM,不用担心。

### 3. 第三方包不是 ESM → 缺 prebundle 报错

某些包结构特殊(条件导出、双 entry、运行时 require),optimizeDeps 失败:

```ts
optimizeDeps: {
  include: ['my-problem-pkg'],   // 强制预 bundle
  exclude: ['some-package'],     // 反过来,某包必须不预 bundle
}
```

### 4. React 项目 HMR 不工作

要装 `@vitejs/plugin-react` 或 `@vitejs/plugin-react-swc`,自动注入 react-refresh runtime:

```ts
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
```

### 5. `base` 配错路径

```ts
// 部署到 https://x.com/app/
base: '/app/'; // 必填,否则 chunk 路径错乱
```

默认 `/`,如果部署到子路径必须改。

### 6. dev 模式有些边界 case 跑通,生产却挂

Dev(原生 ESM) vs Prod(Rollup 打包)两套体系,边界场景行为可能不同:

- 顶层 `await` dev 支持,prod target 不够新就报错
- 动态 import 路径 dev 宽松,prod 必须静态可分析
- `__dirname` / Node 内建在 SSR / 工具脚本里要小心

**修复**:CI 跑 `vite build && vite preview` 验证生产产物。

## 高频面试题(5 题)

- **Q1**: Vite 为什么比 Webpack 快?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  三个层面:

  - **Dev 不打包**:利用浏览器原生 ESM,按需加载,启动 = 启 server,几乎不依赖项目大小
  - **esbuild prebundle**:`node_modules` 用 Go 写的 esbuild 转成单文件 ESM,比 babel 快 10-100x
  - **HMR 精确**:基于 ESM 边界,只重传变更模块,不重建整图

  代价:dev / prod 是两套链路,可能边界 case 行为不一致;生产仍需 Rollup 打包。

  &lt;details&gt;

- **Q2**: Vite dev 模式是怎么工作的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. 启动 dev server,**不预先打包**整个项目
  2. 浏览器请求 `/src/main.ts`,Vite 实时把 .ts/.vue/.scss 等转成 ESM 模块,返回给浏览器
  3. 浏览器原生解析 import,递归发请求拉子模块
  4. `node_modules` 依赖被 esbuild 预 bundle 成单文件 ESM,缓存到 `.vite/deps/`
  5. HMR 通过 WebSocket 推变更,浏览器动态 import 重拉模块

  &lt;details&gt;

- **Q3**: Vite 生产打包用什么?为什么不沿用 esbuild?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  生产用 **Rollup**。原因:

  - Rollup tree shake 最彻底,适合输出小 bundle
  - Rollup 插件生态完整(CSS / 资源 / legacy / polyfill)
  - esbuild 在 chunk 切分、动态 import、装饰器等边缘场景还在成熟
  - 输出多种 chunk 格式(esm / iife / system)Rollup 更稳

  esbuild 只用来做 TS / JSX 转换和 minify(`build.minify: 'esbuild'`),可换 terser。

  &lt;details&gt;

- **Q4**: `optimizeDeps` 是什么?为什么需要它?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  `optimizeDeps` 控制 Vite 启动时**对 `node_modules` 依赖的预 bundle**:

  - **为什么需要**:

    - node_modules 里很多包是 CJS(浏览器不能直接吃)
    - 即便 ESM 包,内部多文件 import 链可能产生几百次网络请求

  - **怎么做**:用 esbuild 把每个依赖打成单文件 ESM,缓存到 `node_modules/.vite/deps/`

  - **配置**:`optimizeDeps: { include, exclude, esbuildOptions }`;强制预 bundle 个别问题包,或排除特殊包

  &lt;details&gt;

- **Q5**: Vite HMR 怎么工作?和 webpack HMR 有什么不同?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Vite HMR 工作流:

  1. watcher 监听文件改动
  2. 计算变更模块的"HMR 边界"(谁 accept 这个模块)
  3. WebSocket 推消息给浏览器
  4. 浏览器动态 import 重拉模块(带时间戳 query 防缓存)
  5. `import.meta.hot.accept` 回调执行,替换 module

  和 webpack HMR 差异:

  - **基于 ESM 边界**,不需要 webpack 的 jsonp / runtime / module 注册表
  - **精确粒度**:只重传变更模块本身
  - **几乎瞬发**:大项目 webpack HMR 可能花 1-3s,Vite 通常 <100ms

  &lt;details&gt;

## 延伸资源

- [Vite: Why Vite](https://vite.dev/guide/why)
- [Vite: Dependency Pre-Bundling](https://vite.dev/guide/dep-pre-bundling)
- [Vite: Features](https://vite.dev/guide/features)

## (留白) 我的理解

> 这一段不强制填。

---

## Webpack 编译流程(loader / plugin / chunk / HMR)

## TL;DR

> Webpack 从 entry 递归解析依赖图,用 **loader** 把非 JS 资源转换成模块,用 **plugin** 在生命周期 hook 上做任意事,把结果切成 **chunks** 输出。核心:entry → resolve → load → parse → transform → seal → emit。

## 背景与动机

webpack 2014 出生,2017 起统治前端打包。它解决的是:

- 把 ESM / CJS / AMD / 不同语法的 JS 统一到能跑的环境
- 把非 JS 资源(CSS / 图片 / 字体 / WASM)纳入依赖图
- 把大应用拆分成按需加载的 chunks(code splitting)
- 开发时用 HMR 实现"修改秒生效"

虽然 Vite / esbuild 等正在挑战,**大型企业应用 + Module Federation 微前端**仍以 webpack 5 为主。理解它的编译模型是看懂任何现代 bundler 的基础。

## 核心机制

### 五大核心概念

| 概念       | 含义                                                              |
| ---------- | ----------------------------------------------------------------- |
| **Entry**  | 编译起点,从这里递归依赖                                           |
| **Module** | 一个文件 = 一个 module(js / css / 图片)                           |
| **Loader** | 把非 JS 资源转换成 JS 模块(css-loader / babel-loader / ts-loader) |
| **Plugin** | 通过 hook 在编译生命周期任意阶段执行逻辑                          |
| **Chunk**  | 多个 module 的打包单元,最终输出文件                               |

### 编译流程

```
1. 初始化:
   读 webpack.config + CLI 参数 → 创建 Compiler 实例
   注册所有 plugin(plugin.apply(compiler))

2. Make 阶段:
   从 entry 开始 → resolve(找到文件)→ load(读文件 + loader 链转换)→ parse(AST)→ 找依赖 → 递归
   过程中触发 hooks: beforeCompile / compile / make / afterCompile

3. Seal 阶段:
   遍历模块图 → 应用 optimization(tree shake / scope hoist / split chunks)
   生成 chunk 树:每个 chunk 包含若干 module
   触发 hooks: seal / optimize / afterOptimize

4. Emit 阶段:
   按 output 配置写文件到磁盘
   触发 emit hook(最后一次能改产物的机会)→ afterEmit → done
```

### Loader —— 串行转换链

```js
// webpack.config.js
module: {
  rules: [
    { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
    //                       ↑                                          ↑
    //                    最后跑                                       最先跑(从右到左)
  ],
},
```

loader 是**函数**:接收源代码字符串(或上一 loader 的输出),返回转换后的字符串/AST。链式调用从**右到左 / 从后到前**。

### Plugin —— 通过 hook 介入生命周期

```js
class MyPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, cb) => {
      // compilation.assets 可读写所有产物
      compilation.assets['hello.txt'] = {
        source: () => 'hello',
        size: () => 5,
      };
      cb();
    });
  }
}
```

hook 体系基于 [tapable](https://github.com/webpack/tapable),有 sync / async / waterfall / bail 等多种类型。

### Chunk 与 Code Splitting

- **入口 chunk**:每个 entry 一个
- **动态 import chunk**:`import('./big.js')` 自动切分
- **共享 chunk**:`optimization.splitChunks` 把多入口共享的 module 提取到独立 chunk
- **runtime chunk**:`optimization.runtimeChunk: 'single'` 把运行时代码独立(便于长期缓存)

```js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
    },
  },
  runtimeChunk: 'single',
},
```

### HMR(Hot Module Replacement)

原理:

1. webpack-dev-server 启动 + watch
2. 文件改动 → webpack 重 build → 通过 WebSocket 推送 hash 给浏览器
3. 浏览器 client 用 jsonp 加载新 module + 调 `module.hot.accept` 回调
4. 局部替换,保持页面状态

React Fast Refresh / Vue HMR plugin 把"组件级保留状态 + 替换实现"的细节封装好。

### Webpack 5 新特性

- **持久化缓存**(`cache: { type: 'filesystem' }`):重启不重 build
- **Module Federation**:运行时跨应用共享模块(微前端基石)
- **资源模块**(`asset/resource` / `asset/inline`):替代 file-loader / url-loader
- **Tree shaking 嵌套 export 优化**
- **更小 runtime**

## 代码示例

### 最小 webpack 配置

```js
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production', // 自动开 minification / tree shake
  entry: './src/main.js',
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.(png|jpg|svg)$/, type: 'asset/resource' },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './index.html' })],
  optimization: {
    splitChunks: { chunks: 'all' },
    runtimeChunk: 'single',
  },
};
```

### 自定义 plugin(最小)

```js
class LogModulesPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('LogModulesPlugin', (stats) => {
      const modules = stats.compilation.modules;
      console.log(`[done] built ${modules.size} modules`);
    });
  }
}
```

## 易错点 / 反例

### 1. loader 顺序错(从右到左)

```js
// ❌ 反了
use: ['sass-loader', 'css-loader', 'style-loader'];
// → sass-loader 先跑(对的),css-loader 然后(对的),style-loader 最后(对的) — 实际上这写法等同正确

// 正确写法
use: ['style-loader', 'css-loader', 'sass-loader'];
// 数组从右往左执行
```

**记忆**:像数学函数嵌套 `style-loader(css-loader(sass-loader(source)))`。

### 2. `publicPath` 配错导致 chunk 404

- 默认 `publicPath: ''`(同目录)
- 部署在 `/app/` 下要写 `publicPath: '/app/'`
- CDN 部署要写完整 URL `https://cdn.x.com/static/`
- 错了 → 动态 import 的 chunk 加载 404

### 3. source-map 在生产泄漏代码

```js
devtool: 'source-map',     // 上线产物里有完整源码
```

生产推荐:

- `'hidden-source-map'`:文件存在但不嵌入产物的 `//# sourceMappingURL`
- 上传 source-map 到 Sentry / Datadog,产物里不要

### 4. HMR 不工作的常见原因

- `module.hot.accept` 没写(纯 vanilla 项目)
- React 没装 `react-refresh/babel`
- dev-server 配置丢 `hot: true`
- 用了不支持 HMR 的 plugin / 第三方库

### 5. 多 entry 没共享 vendor chunk

```js
entry: { a: './a.js', b: './b.js' }
// 不配 splitChunks 时,a 和 b 各自打包一份 lodash → 重复 100KB
```

**修复**:开 `splitChunks: { chunks: 'all' }`,共享代码自动提取。

### 6. webpack 5 持久化缓存导致"老代码不更新"

启用 `cache.type: 'filesystem'` 后,改了配置但 `version` / `buildDependencies` 没变 → 走缓存 → 表现像没改。
**修复**:配 `cache.buildDependencies: { config: [__filename] }`,改配置自动失效缓存。

## 高频面试题(5 题)

- **Q1**: 描述 webpack 完整编译流程。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  4 阶段:

  1. **初始化**:读 config + 注册 plugins,创建 Compiler
  2. **Make**:从 entry 递归解析依赖图(resolve → load → loader 链转换 → parse AST → 找依赖)
  3. **Seal**:遍历模块图,应用 optimization(tree shake / scope hoist / splitChunks)生成 chunk 树
  4. **Emit**:按 output 配置写文件

  全程通过 tapable 的 hooks 让 plugin 介入。

  &lt;details&gt;

- **Q2**: Loader 和 Plugin 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Loader**:把非 JS 资源**转换**成 JS 模块(纯函数:源码 → 转换后源码),应用于 `module.rules` 匹配的文件;链式调用,从右到左
  - **Plugin**:通过 hooks 在编译**任意生命周期**做事(读写 assets、影响 compilation),应用于整个流程

  形象:loader 像 npm 上一个个独立的转换器(类似 Unix pipe),plugin 像可订阅 webpack 内部事件的 middleware。

  &lt;details&gt;

- **Q3**: webpack 怎么做 code splitting?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **多 entry**:`entry: { a, b }` 每个一个 chunk
  - **动态 import**:`import('./x').then(...)` 自动切分(配 `output.chunkFilename`)
  - **splitChunks**:`optimization.splitChunks: { chunks: 'all' }` 把共享依赖提取
  - **runtimeChunk**:把 webpack runtime 单独切,长期缓存优化

  cacheGroups 可按规则归类(vendor / common / async-only),控制粒度和命中策略。

  &lt;details&gt;

- **Q4**: HMR 工作原理?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. webpack-dev-server 启动 + watch 模式
  2. 文件改动 → webpack 重新编译,只构建变更模块,生成 hash + JSON manifest
  3. dev-server 通过 WebSocket 推送 hash 给浏览器 client
  4. client 用 JSONP 加载新模块代码
  5. 调 `module.hot.accept` 注册的回调,把旧模块替换为新模块,**不刷新页面**保留状态
  6. React Fast Refresh / Vue HMR 进一步在组件层保留 state

  &lt;details&gt;

- **Q5**: webpack 5 相比 4 有哪些关键改动?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **持久化缓存** `cache.type: 'filesystem'`:重启 dev/build 秒级启动
  - **Module Federation**:运行时跨应用共享模块,微前端基石
  - **资源模块**`asset/resource` / `asset/inline` 替代 file-loader / url-loader
  - **Tree shaking 增强**:嵌套 export / pure modules / cjs 部分支持
  - **更小的运行时**
  - **Top-level await** 在 webpack 中可用
  - **Node.js polyfill 默认关闭**(浏览器目标更纯净)

  &lt;details&gt;

## 延伸资源

- [Webpack: Concepts](https://webpack.js.org/concepts/)
- [Webpack: Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Webpack: Module Federation](https://webpack.js.org/concepts/module-federation/)

## (留白) 我的理解

> 这一段不强制填。

---

## AST 基础(parse / traverse / generate)

## TL;DR

> AST(抽象语法树)= 源代码的结构化表示。Babel / ESLint / SWC 都先把代码 **parse** 成 AST,然后 **traverse**(访问者模式)修改节点,最后 **generate** 回代码。任何编译器 / lint / codemod / IDE 重构都基于这条管线。

## 背景与动机

代码长得像一串字符,但**机器要理解它的结构**:

- 这里是函数声明吗?函数体里有哪些 statement?
- 这个标识符是变量声明还是引用?
- 是 `import` 语句吗?导入了什么?

字符串 / 正则做不到这些(`function foo(){}` 字符串改名也许能,但 `(()=>{})()` 这种字符级匹配立刻翻车)。**AST 是把代码看成树**,每个节点表示语法结构,这才让自动化操作成为可能。

学好 AST 你能:

- 看懂 Babel / ESLint / SWC 的 plugin 怎么工作
- 写 codemod 一次性重构万行代码
- 自定义 lint 规则约束团队风格
- 理解 minifier 删代码的依据

## 核心机制

### 三阶段管线

```
源代码字符串 ─► parser ─► AST(树) ─► traverse ─► AST'(改后)─► generator ─► 新代码字符串
                                       ↑
                                  visitor: { ... }
                                       │
                                  enter / exit 回调修改节点
```

### Parser 选型

| Parser                      | 出处      | 常用场景                            |
| --------------------------- | --------- | ----------------------------------- |
| `@babel/parser`(原 Babylon) | Babel     | Babel 生态;支持 JSX / TS / 草案语法 |
| `Acorn`                     | 社区      | webpack / Rollup 内部用;轻量        |
| `espree`(基于 Acorn)        | ESLint    | ESLint 默认                         |
| `@typescript-eslint/parser` | TS-ESLint | 在 ESLint 里解析 TS                 |
| `swc_ecma_parser`(Rust)     | SWC       | SWC / Next.js                       |
| `oxc-parser`(Rust)          | Oxc       | 新兴超快 parser                     |

不同 parser 产出的 AST 大同小异(都基于 [ESTree](https://github.com/estree/estree) 规范),但 Babel 扩展了若干节点(`OptionalCallExpression` 等),不能直接互换。

### AST 节点常见类型(示例)

```js
// 源代码:
const x = 1 + 2;

// AST(简化):
{
  type: 'Program',
  body: [
    {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [{
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'x' },
        init: {
          type: 'BinaryExpression',
          operator: '+',
          left:  { type: 'NumericLiteral', value: 1 },
          right: { type: 'NumericLiteral', value: 2 },
        },
      }],
    },
  ],
}
```

节点字段三件套:`type` / 子节点 / 元信息(loc / comments / leadingComments)。

### Traverse 与访问者模式

```js
import traverse from '@babel/traverse';

traverse(ast, {
  Identifier(path) {
    // 进入 Identifier 时
    if (path.node.name === 'foo') {
      path.node.name = 'bar'; // 直接改节点
    }
  },
  VariableDeclaration: {
    enter(path) {
      /* 进入 */
    },
    exit(path) {
      /* 离开 */
    },
  },
});
```

- 访问者按 `type` 派发
- `enter`(默认)/`exit` 在节点访问前后调用
- `path` 不是裸节点,而是封装好的"游标":
  - `path.node` 当前节点
  - `path.parent` / `path.parentPath` 父节点
  - `path.replaceWith(newNode)` / `path.remove()` / `path.insertBefore(...)` 操作
  - `path.scope` 作用域信息(查找变量定义)

### Generator

```js
import generate from '@babel/generator';
const { code, map } = generate(ast, { sourceMaps: true }, originalCode);
```

注意:**注释 / loc 信息**容易在 generate 阶段丢,需要 parser 时打开 `comments: true` + 传 originalCode 给 generator(可选)。

### 在线探索:astexplorer.net

- 左侧粘代码,右侧实时看 AST
- 可切 parser(Babel / Acorn / TS / SWC)
- 支持 "Transform" 模式直接调试 visitor

## 代码示例

### 最小 codemod:把所有 `var` 改成 `let`

```js
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

const code = `var a = 1; var b = 2;`;

const ast = parser.parse(code, { sourceType: 'module' });

traverse(ast, {
  VariableDeclaration(path) {
    if (path.node.kind === 'var') path.node.kind = 'let';
  },
});

const result = generate(ast).code;
console.log(result);
// let a = 1;
// let b = 2;
```

### jscodeshift —— 工程化 codemod

```js
// transforms/var-to-let.js
export default function transformer(file, api) {
  const j = api.jscodeshift;
  return j(file.source)
    .find(j.VariableDeclaration, { kind: 'var' })
    .forEach((p) => {
      p.node.kind = 'let';
    })
    .toSource();
}
```

跑:`jscodeshift -t transforms/var-to-let.js src/`,可一次性改全仓库。

### ts-morph —— 写 TS 特别舒服

```ts
import { Project } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths('src/**/*.ts');

for (const file of project.getSourceFiles()) {
  file.getClasses().forEach((cls) => {
    if (cls.getName()?.startsWith('Legacy')) cls.remove();
  });
}

project.saveSync();
```

比裸 babel 抽象层更高,适合大型 TS 项目重构。

## 易错点 / 反例

### 1. parser 配置错(sourceType)

```js
parser.parse(`import x from 'y'`, { sourceType: 'script' });
// ❌ SyntaxError: import 不能在 script 中
parser.parse(`import x from 'y'`, { sourceType: 'module' }); // ✅
```

默认 `'script'`,有 `import/export` 必须 `'module'`。

### 2. visitor 内**直接 mutate** path 不会生效

```js
traverse(ast, {
  Identifier(path) {
    path.node = newIdentifier; // ❌ 不会替换;只改了局部变量
  },
});
// 正确:用 path API
traverse(ast, {
  Identifier(path) {
    path.replaceWith(newIdentifier); // ✅
  },
});
```

### 3. Babel AST 和 ESTree 不完全兼容

- Babel 有 `OptionalCallExpression` / `JSXElement`,ESTree 没
- ESLint(espree)与 Babel parser 对一些新语法定义不同
- 直接把 Babel 解析的 AST 喂给 ESLint 工具可能失败

**修复**:统一选一个 parser 链(全 Babel 或全 espree/`@typescript-eslint/parser`)。

### 4. 注释 / loc 信息丢失

```js
const ast = parser.parse(code); // 默认不留注释
// 修复:
const ast = parser.parse(code, { sourceType: 'module', attachComment: true });
```

然后 `generate(ast, { retainLines: true })`(尽量保留行号)。

### 5. JSX / TS 需要专门 plugin

```js
parser.parse(`<div/>`, { sourceType: 'module', plugins: ['jsx'] });
parser.parse(`type X = 1;`, { sourceType: 'module', plugins: ['typescript'] });
parser.parse(`<X/>`, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
```

### 6. 大型 codemod 用 ts-morph 比裸 babel 省事

裸 babel 适合 plugin 级精确控制;改 100 个文件类型 / class 结构这种工作,ts-morph 的 OOP API 更顺手(类似 IDE 重构 API)。

## 高频面试题(5 题)

- **Q1**: 描述代码 → AST → 代码的完整管线。
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  三阶段:

  1. **Parse**:源代码字符串 → tokenize → 构建 AST(树)
  2. **Transform**:用访问者模式 traverse,enter / exit 各节点,通过 path API 修改
  3. **Generate**:AST → 源代码字符串(可选生成 source map)

  几乎所有 JS 工具(Babel / ESLint / SWC / TS / minifier / Prettier)都基于这条管线,差别在每阶段实现细节。

  &lt;details&gt;

- **Q2**: 访问者模式(visitor pattern)在 AST 操作里做什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  访问者模式让 traverse 把"如何走树"和"对每个节点做什么"解耦:

  ```js
  traverse(ast, {
    Identifier(path) {
      /* 进入所有 Identifier 时调用 */
    },
    VariableDeclaration: { enter, exit },
  });
  ```

  好处:plugin 只需声明感兴趣的节点类型 + 操作,不关心如何遍历;多个 plugin 可以叠加(Babel 把所有 plugin 的 visitor 合并)。

  &lt;details&gt;

- **Q3**: 如何写一个把 `var` 改成 `let` 的 codemod?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```js
  import parser from '@babel/parser';
  import traverse from '@babel/traverse';
  import generate from '@babel/generator';

  function transform(code) {
    const ast = parser.parse(code, { sourceType: 'module' });
    traverse(ast, {
      VariableDeclaration(path) {
        if (path.node.kind === 'var') path.node.kind = 'let';
      },
    });
    return generate(ast).code;
  }
  ```

  工程化:用 `jscodeshift` 把这个 transformer 跑遍仓库;或用 `ts-morph` 在 TS 项目里做更复杂重构。

  &lt;details&gt;

- **Q4**: AST explorer 是什么?怎么用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  [astexplorer.net](https://astexplorer.net) 是在线 AST 可视化工具:

  - 左侧贴代码,右侧实时显示对应 AST
  - 可切换 parser(Babel / Acorn / espree / TS / SWC / oxc 等)
  - 支持 Transform 模式:直接在浏览器里写 visitor,看输出

  调试 babel/eslint 规则、写 codemod 的必备工具。

  &lt;details&gt;

- **Q5**: jscodeshift 和 ts-morph 各适合什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **jscodeshift**:函数式 / chain API,适合**批量、单文件、简单结构改写**(改语法、替换 API、迁移 import)。Meta 用它做大型重构
  - **ts-morph**:OOP / "项目"级 API,适合**TS 项目大型结构重构**(改 class 继承、移动 export、批量重命名);带类型信息

  jscodeshift 偏快但不感知类型;ts-morph 慢但能看到类型,适合 IDE 级精度重构。

  &lt;details&gt;

## 延伸资源

- [astexplorer.net](https://astexplorer.net/)
- [Babel 插件手册(中文)](https://github.com/jamiebuilds/babel-handbook)
- [ESTree 规范](https://github.com/estree/estree)

## (留白) 我的理解

> 这一段不强制填。

---

## Babel 流程与配置(preset / plugin / polyfill)

## TL;DR

> Babel 把高版本 JS / TS / JSX 转成兼容老环境的代码。流程:**parse → AST → preset/plugin transform → generate**。preset 是 plugin 集合;polyfill 有三套策略,现代推荐 `core-js + useBuiltIns: 'usage'` 或 `transform-runtime`。

## 背景与动机

Babel 2014 出现,在 ES6 / TS / JSX 落地浏览器的过程中扮演关键角色。**当下(2026)**:

- 转换速度被 SWC / esbuild 抢工(快 20-100x)
- 但 Babel 仍是**自定义能力最强**的转换器,庞大 plugin 生态
- React / Next.js 默认换了 SWC,但很多老 webpack 项目仍用 Babel
- 自定义 codemod 写 Babel plugin 仍很常用

学 Babel 配置 = 理解整个"高级语法 → 低级语法"的工业化流水线。

## 核心机制

### 流程

```
源代码
   │
   ▼
@babel/parser ── AST
                 │
                 ▼
@babel/traverse ── 应用 preset/plugin 列表 ── transformed AST
                                                  │
                                                  ▼
                                          @babel/generator ── 转换后代码
```

### preset vs plugin

| 概念       | 含义                                                    |
| ---------- | ------------------------------------------------------- |
| **plugin** | 单一转换任务(`@babel/plugin-transform-arrow-functions`) |
| **preset** | 一组 plugin 的集合(`@babel/preset-env` 含数十个 plugin) |

常用 preset:

- `@babel/preset-env`:按 `targets` 自动选 plugin 转换需要的语法
- `@babel/preset-react`:JSX
- `@babel/preset-typescript`:TS(**只剥类型,不做类型检查**)

### 执行顺序(常被问)

```js
{
  presets: ['preset-a', 'preset-b'],
  plugins: ['plugin-x', 'plugin-y'],
}
```

执行顺序:

1. **plugins 先于 presets**
2. **plugins**:**从左到右**(`x` → `y`)
3. **presets**:**从右到左**(`preset-b` → `preset-a`)

记忆:plugin 数组按代码顺序(自然左→右),preset 数组按"叠加洋葱"逆序(右→左)。

### 配置 `@babel/preset-env` 的 `targets`

```js
// babel.config.json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "> 0.5%, last 2 versions, not dead",
      "useBuiltIns": "usage",
      "corejs": 3
    }]
  ]
}
```

- `targets`:浏览器/Node 目标,通常对接 `browserslist` 配置
- `useBuiltIns`:见下文 polyfill 策略
- 没设 `targets` 时:转换所有 ES2015+ 语法(产物巨大),**必须设**

### 三套 polyfill 策略

| 策略                | 写法                                                       | 行为                                          |
| ------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| **entry**(老式)     | `import 'core-js'` + `useBuiltIns: 'entry'`                | 入口处一次性加载所有 polyfill                 |
| **usage**(推荐)     | `useBuiltIns: 'usage' + corejs: 3`                         | 按需:扫描每文件用到的 API,自动注入 import     |
| **runtime**(库推荐) | `@babel/plugin-transform-runtime + @babel/runtime-corejs3` | 把 helper / polyfill 替换为 import,不污染全局 |

#### `useBuiltIns: 'usage'` 实例

```js
// 你写的:
const m = new Map();
[1, 2, 3].includes(2);

// Babel 自动注入(只为这个文件用到的 API):
import 'core-js/modules/es.map';
import 'core-js/modules/es.array.includes';

const m = new Map();
[1, 2, 3].includes(2);
```

#### 应用 vs 库的差异

| 场景                 | 推荐                                                               |
| -------------------- | ------------------------------------------------------------------ |
| **应用**(你控制全局) | `core-js + useBuiltIns: 'usage'`,污染全局没问题                    |
| **库**(被别人用)     | `@babel/plugin-transform-runtime`,**不污染全局**,helper 抽取减体积 |

### `@babel/plugin-transform-runtime` 的双重作用

1. **Helper 提取**:把 Babel 转换生成的辅助代码(`_classCallCheck` 等)从内联改为 `import` from `@babel/runtime`,**多文件共享同一份 helper** → 减体积
2. **Polyfill 隔离**:对 `Promise` / `Map` / `Symbol` 等用 `_interopRequireDefault` 包装,**避免污染全局**(库友好)

## 代码示例

### 应用配置(完整)

```json
// babel.config.json(应用)
{
  "presets": [
    ["@babel/preset-env", {
      "useBuiltIns": "usage",
      "corejs": { "version": 3, "proposals": true }
    }],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ]
}

// .browserslistrc
> 0.5%
last 2 versions
not dead
```

### 库配置(完整)

```json
// babel.config.json(库)
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": { "esmodules": true }
      }
    ],
    "@babel/preset-typescript"
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3,
        "useESModules": true
      }
    ]
  ]
}
```

### 写一个最小 Babel plugin

```js
// babel-plugin-no-debugger.js
module.exports = function () {
  return {
    name: 'no-debugger',
    visitor: {
      DebuggerStatement(path) {
        path.remove();
      },
    },
  };
};

// babel.config.json
{ "plugins": ["./babel-plugin-no-debugger.js"] }
```

## 易错点 / 反例

### 1. preset 执行顺序记反

plugin 是正向(左→右),preset 是**反向**(右→左)。

```js
presets: ['preset-typescript', 'preset-env'];
// 实际跑顺序:preset-env → preset-typescript
// 但 TS 类型剥应该先!所以应改成:
presets: ['preset-env', 'preset-typescript'];
```

新版 babel 对常见组合有内部调整,但仍**显式按"应跑顺序的反序"写**。

### 2. preset-env 没配 targets

默认行为:转换所有 ES2015+ 语法 → 产物含大量不必要的辅助代码 + polyfill。
**修复**:对接 `browserslist` 配置具体目标。

### 3. `useBuiltIns: 'usage'` + `transform-runtime` 同时开会冲突

两者都注入 polyfill / helper,叠加会导致重复 + 体积膨胀。
**修复**:**应用选 usage,库选 transform-runtime,二选一**。

### 4. TS 类型错误 Babel 不报

```ts
const x: number = 'hello'; // ❌ 类型错误
```

`@babel/preset-typescript` **只剥类型,不做类型检查**。要靠 `tsc --noEmit` 在 CI 单独做检查。

### 5. 装饰器(decorator)阶段问题

TC39 装饰器经历 stage-0 → stage-1 → stage-2 → stage-3 多次大改:

- 老 babel 用 `@babel/plugin-proposal-decorators` 的 legacy mode(stage-1)
- 新版默认 stage-3 spec(2024+)
- TS 的 `experimentalDecorators` 又是另一套
- 三套语法不能混用

**修复**:整个项目统一一套装饰器规范,文档明确写。

### 6. core-js 版本和 useBuiltIns 不匹配

```json
"useBuiltIns": "usage",
"corejs": 2         // ❌ 老版本,某些新 API 没 polyfill
```

**修复**:`corejs: 3`,且需要 `npm i -S core-js@3`。

## 高频面试题(5 题)

- **Q1**: Babel 的工作流程?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. **Parse**:`@babel/parser` 把源码 → AST
  2. **Transform**:`@babel/traverse` 遍历 AST,按配置的 preset / plugin 链应用变换
  3. **Generate**:`@babel/generator` 把变换后的 AST 输出回代码字符串

  AST 是中间表示,Babel 的强大正来自这个中间层 + plugin 体系。

  &lt;details&gt;

- **Q2**: preset 和 plugin 有什么区别?执行顺序是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **plugin**:单一转换任务(`plugin-transform-arrow-functions`)
  - **preset**:plugin 的集合(`preset-env` 包含数十个 plugin)

  执行顺序:

  - plugins **先**于 presets
  - plugins 从左到右
  - presets **从右到左**(像洋葱叠加,后写的先剥)

  &lt;details&gt;

- **Q3**: Babel 处理 polyfill 有哪几种方式?各自适合什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **entry**(`useBuiltIns: 'entry'` + 入口 `import 'core-js'`):一次性引入所有 polyfill;老式,体积大
  - **usage**(`useBuiltIns: 'usage'` + `corejs: 3`):按文件实际用到的 API 自动注入 polyfill;**应用推荐**
  - **runtime**(`@babel/plugin-transform-runtime`):polyfill 和 helper 都通过 import 引入,**不污染全局**;**库推荐**

  应用与库选不同策略的核心原因:应用控制全局,可以污染;库被别人用,污染全局是 anti-pattern。

  &lt;details&gt;

- **Q4**: `@babel/plugin-transform-runtime` 解决了什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  两件事:

  1. **Helper 提取**:Babel 转换会生成辅助函数(`_classCallCheck` / `_extends` 等),默认**内联到每个文件**;transform-runtime 把它们改为 `import` from `@babel/runtime`,多文件共享同一份 → 减体积
  2. **Polyfill 隔离**:对 Promise / Map / Symbol 等内置 API 用 wrapper 引入,**不修改全局**(库被消费时不污染消费方环境)

  库作者**必备**插件;应用一般不需要(应用可以污染全局,且 `useBuiltIns: 'usage'` 已经够了)。

  &lt;details&gt;

- **Q5**: Babel 转 TS 和 tsc 转 TS 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Babel(`@babel/preset-typescript`)**:**只剥类型**,不做类型检查;速度快;不需要 tsconfig
  - **tsc**:类型检查 + 输出 JS;速度慢;严格遵循 tsconfig

  现代工具链常用做法:

  - 转换用 Babel / esbuild / SWC(快)
  - 类型检查在 CI 单独 `tsc --noEmit`(慢但严格)

  这样能同时获得速度和类型安全。

  &lt;details&gt;

## 延伸资源

- [Babel: Usage](https://babeljs.io/docs/usage)
- [Babel: preset-env](https://babeljs.io/docs/babel-preset-env)
- [Babel: plugin-transform-runtime](https://babeljs.io/docs/babel-plugin-transform-runtime)

## (留白) 我的理解

> 这一段不强制填。

---

## TypeScript 编译器(tsc)与类型擦除

## TL;DR

> `tsc` 做两件事:**类型检查**(可输出 `.d.ts`)+ **降级转换**到目标 JS。现代工具链常拆分:**tsc 只做类型检查(`--noEmit`)**,转换交给 esbuild / SWC 加速;`isolatedModules`、`Project References` 等是关键配置。

## 背景与动机

TypeScript 2012 起步,2018+ 普及。"tsc 慢"是大项目共识 —— 因为 tsc 用 TS 自己写(JS 跑 JS 编译器),没有像 esbuild/SWC 这种 native 实现快。

现代实战:

- **类型检查**:`tsc --noEmit`(慢但严格)
- **转换**:esbuild / SWC / Babel(快但不检查类型)
- **CI**:并行跑两者
- **monorepo**:`Project References` 增量编译

理解 tsc 的工作原理 + tsconfig 关键字段 + 类型擦除规则,是写 TS 项目时不踩坑的基础。

## 核心机制

### 编译流程

```
1. Tokenize / Parse → AST
2. Binder:建立符号表(每个标识符的定义点和作用域)
3. Checker:类型推断 + 类型检查(可单独运行,见 noEmit)
4. Emitter:输出 .js + .d.ts + .js.map
```

Babel / esbuild / SWC 转 TS 只做 1 + 4(简化版),**跳过 binder / checker**,所以快但不报类型错误。

### 关键 tsconfig 选项

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler", // bundler / nodenext / node10
    "lib": ["ES2022", "DOM"],

    "strict": true, // 推荐开,聚合多个严格选项
    "noUncheckedIndexedAccess": true, // arr[i] 返回 T | undefined

    "esModuleInterop": true, // import x from 'cjs' 兼容
    "skipLibCheck": true, // 跳过 node_modules 类型检查,大幅加速
    "isolatedModules": true, // 每文件独立可编译(配合 esbuild/SWC)
    "verbatimModuleSyntax": true, // import type 必须严格区分

    "noEmit": true, // 只检查不输出(转换交给其他工具)
    "incremental": true, // 增量编译缓存到 .tsbuildinfo
    "composite": true, // 配合 Project References
    "declaration": true, // 输出 .d.ts(库必备)
    "declarationMap": true // 配合 IDE 跳转到源码
  }
}
```

### 类型擦除规则

| TS 语法                               | 编译后                       |
| ------------------------------------- | ---------------------------- |
| `interface` / `type`                  | **消失**(纯类型)             |
| `as` / `satisfies` / 泛型 `&lt;T&gt;` | **消失**                     |
| `class` / `class Foo`                 | **保留**(有运行时代码)       |
| `enum`(普通)                          | **保留**(生成对象)           |
| `const enum`                          | **内联**(编译时展开到使用点) |
| `namespace`                           | **保留**(IIFE 形式)          |
| 装饰器 `@Foo`                         | 保留(运行时函数调用)         |
| `import type`                         | **消失**                     |

**含义**:依赖运行时类型信息的代码会失败:

```ts
function check&lt;T&gt;(x: any): x is T {        // ❌ T 在运行时不存在,只能 typeof / instanceof / 字段判
  return typeof x === 'object';
}
```

### `isolatedModules` 与限制

开启后强制每个文件**独立可编译**(esbuild / SWC 转 TS 的必要条件):

| 不允许                              | 替代                               |
| ----------------------------------- | ---------------------------------- |
| `const enum`                        | 普通 `enum` 或 union literal types |
| `export = ` / `import = `           | ES Module 写法                     |
| 单文件无 import/export 的"全局脚本" | 至少加个 `export {}` 让它成模块    |
| `namespace` 含值合并                | 用 module 拆分                     |

代价:更严格;收益:可被 esbuild / SWC 转换,速度大涨。

### Project References(monorepo / 大项目)

```jsonc
// packages/lib/tsconfig.json
{ "compilerOptions": { "composite": true, "declaration": true } }

// packages/app/tsconfig.json
{
  "references": [{ "path": "../lib" }]
}

// 根 tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/lib" },
    { "path": "./packages/app" }
  ]
}
```

跑 `tsc --build`(`tsc -b`):

- 按依赖图增量编译每个 reference
- 跳过未变动的子项目(`.tsbuildinfo` 缓存)
- 大型 monorepo 全量 tsc → 增量 tsc 可省 90% 时间

### 类型即文档:`.d.ts`

```ts
// dist/index.d.ts(库发布产物)
export function add(a: number, b: number): number;
export interface Config {
  debug?: boolean;
}
```

消费方 IDE 自动看到 + 校验。发布到 npm 时:

- 自己写的 .d.ts 放 dist
- 用 `tsc --emitDeclarationOnly` 或 `tsup --dts` 生成
- 在 package.json 配 `types` / `typings` 字段
- 公共包到 [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) 发 `@types/*`

## 代码示例

### 推荐的 tsconfig.json(2026 现代项目)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,

    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,

    "noEmit": true,
    "resolveJsonModule": true,
    "incremental": true,
  },
  "include": ["src/**/*"],
}
```

### "纯检查 + 快速转换" CI 模板

```yaml
# .github/workflows/ci.yml
jobs:
  check:
    steps:
      - run: pnpm install
      - run: pnpm tsc --noEmit # 类型检查(慢,但只在 CI)
      - run: pnpm vite build # esbuild/Rollup 实际转换(快)
      - run: pnpm vitest # 测试
```

## 易错点 / 反例

### 1. `const enum` 在 isolatedModules 下报错

```ts
const enum Color {
  Red,
  Green,
} // ❌ isolatedModules 不允许
```

**根因**:`const enum` 编译时内联到使用点,单文件转换器看不到 enum 定义。
**修复**:普通 `enum` 或 union literal `type Color = 'red' | 'green'`。

### 2. Babel/esbuild/SWC 转 TS 不检查类型

```ts
const x: number = 'hello';
// vite/esbuild 完全不报错
// 必须 tsc --noEmit 才能查出
```

**修复**:CI 一定要单独 `tsc --noEmit`,不能依赖 bundler 的 TS 转换。

### 3. `moduleResolution` 选错

- `node`(老,2024+ 不推荐):向后兼容,不识别 package.json `exports` 字段
- `node10` = `node`(新名)
- `node16` / `nodenext`:Node ESM 严格模式
- `bundler`(2024+ 推荐 for app):贴近 vite/webpack 行为

设错 → 库的 `exports` map 不生效,导入路径错误。

### 4. `paths` alias 在产物里不替换

```jsonc
"paths": { "@/*": ["src/*"] }
```

tsc 编译后**仍保留** `@/foo` 字面路径,运行时找不到模块。
**修复**:

- 用 bundler(vite/webpack)处理别名替换
- 或用 `tsc-alias` / `tsconfig-paths` 后处理
- 库发布时**避免**用 paths,改相对路径

### 5. `verbatimModuleSyntax` 严格化 type-only import

```ts
import { User } from './user'; // ❌ 若 User 只是类型,要写:
import type { User } from './user'; // ✅
import { type User, fn } from './u'; // ✅ 混合
```

开启后强制显式区分类型与值,**避免** Babel/SWC 转换错误把 type-only import 当真实 import 留下。

### 6. monorepo 没用 Project References,全量 tsc 跑死

小项目 tsc 几秒,monorepo(20+ 包)直接几分钟。
**修复**:

- 每个 package tsconfig 加 `composite: true`
- 用 `references` 串依赖图
- `tsc --build` 增量

## 高频面试题(5 题)

- **Q1**: tsc 的工作流程是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  4 阶段:

  1. **Parse**:源码 → AST
  2. **Binder**:建立符号表(标识符 → 定义点)
  3. **Checker**:类型推断 + 类型检查
  4. **Emitter**:输出 .js + .d.ts + sourcemap

  Babel / esbuild / SWC 转 TS 只做 1 + 4,跳过 binder / checker(所以快但不查类型)。

  &lt;details&gt;

- **Q2**: tsc 和 Babel/esbuild/SWC 转 TS 有什么区别?现代怎么组合?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **tsc**:类型检查 + 转换,慢但严格
  - **Babel/esbuild/SWC**:只剥类型,**不做类型检查**,快但漏类型错

  现代工具链:

  - **转换**:用 esbuild/SWC(在 Vite / Next.js 等里)
  - **类型检查**:CI 单独跑 `tsc --noEmit`
  - **IDE**:VS Code 用 ts-server 实时检查

  好处:开发速度 + 类型安全两者兼得。

  &lt;details&gt;

- **Q3**: 什么是"类型擦除"?哪些 TS 语法是例外?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  类型擦除 = 编译后 JS 里**类型信息不存在**:`interface` / `type` / 泛型 / `as` 全部消失。

  例外(有运行时代码):

  - `class`(运行时是构造函数 + 原型)
  - `enum`(运行时是对象)
  - `const enum`(内联展开到使用点,不出现 enum 对象)
  - `namespace`(IIFE)
  - 装饰器 `@Foo`(运行时函数调用)

  含义:不能在运行时用 `T`,要 typeof / instanceof / 字段判断;运行时校验要用 zod / valibot / io-ts。

  &lt;details&gt;

- **Q4**: `isolatedModules` 干什么?有哪些限制?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  强制每个文件**独立可编译**,是 esbuild / SWC 转 TS 的必要条件(它们一次只看一个文件,不能跨文件分析类型)。

  限制:

  - 不能用 `const enum`(内联依赖全局信息)
  - 不能用 `export = ` / `import = `
  - `namespace` 含值合并不行
  - 单文件无 import/export 必须显式 `export {}`

  现代项目应开启(配合 Vite / Next.js / 任何用 esbuild/SWC 转换的工具)。

  &lt;details&gt;

- **Q5**: Project References 解决什么?怎么用?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  monorepo / 大型项目里,**全量 tsc 跑很慢**(几分钟)。Project References 让 tsc 按依赖图**增量编译**,跳过未变动的子项目。

  做法:

  1. 每个 package 的 tsconfig 加 `"composite": true`,`"declaration": true`
  2. 主项目 tsconfig 用 `"references": [{ "path": "../lib" }]`
  3. 跑 `tsc --build`(`tsc -b`),内部用 `.tsbuildinfo` 缓存

  收益:大型 monorepo 编译时间 90%+ 减少;每个 reference 单独发布友好。

  &lt;details&gt;

## 延伸资源

- [TypeScript: Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [TypeScript: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig)

## (留白) 我的理解

> 这一段不强制填。

---

## ESLint 架构与自定义规则

## TL;DR

> ESLint = **Parser**(代码 → AST)+ **规则集**(visitor 检查 AST)+ **Fixer**(可选自动修复)。配置用 **Flat Config**(`eslint.config.js`)替代老式 `.eslintrc`。TS 项目用 `typescript-eslint` 提供 TS parser + 规则。

## 背景与动机

ESLint 2013 出现,2016+ 成为社区标准(取代 JSHint / JSLint)。它的设计目标:

- **可插拔**:parser / rules / plugin / config 都可以替换组合
- **可扩展**:每个规则是独立 visitor,容易自定义
- **可自动修复**:能告警的代码大多能 fix

2024 起 ESLint 9 全面切到 **Flat Config**(`eslint.config.js`),老 `.eslintrc.*` 进入维护期。理解架构能让你看懂"为什么这条规则报错 / 怎么写自定义规则 / 怎么调性能"。

## 核心机制

### 整体架构

```
源代码字符串
     │
     ▼
  Parser(默认 espree;TS 用 @typescript-eslint/parser)
     │
     ▼
   AST + SourceCode 对象
     │
     ▼
 Linter:依次跑每条启用的规则
     │  ┌──────────────────────┐
     │  │ rule visitor:        │
     ├─►│  Identifier(node) {} │
     │  │  CallExpression() {} │
     ���  └──────────────────────┘
     │
     ▼
   Messages(errors / warnings)+ Fixes(可选)
     │
     ▼
   --fix 应用 Fixes 写回文件
```

### Flat Config(`eslint.config.js`)

```js
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { react },
    rules: {
      'no-console': 'warn',
      'react/jsx-uses-react': 'error',
    },
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
      globals: { window: 'readonly' },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
```

老 `.eslintrc.json` 和 Flat Config 主要差异:

- 配置即代码(JS 而非 JSON / YAML),可表达条件 / 复用
- `plugin:` 前缀被去掉,直接 import
- `extends` → 数组拼接
- `ignorePatterns` → `ignores` 字段
- `overrides` → 用 files 字段的多个对象表示

### 规则的三要素

```js
// my-eslint-plugin/rules/no-foo.js
export default {
  meta: {
    type: 'problem', // problem / suggestion / layout
    docs: { description: '禁止使用 foo' },
    fixable: 'code', // 'code' / 'whitespace' / null
    schema: [], // 规则参数 schema
    messages: { noFoo: 'foo is not allowed' },
  },
  create(context) {
    return {
      Identifier(node) {
        if (node.name === 'foo') {
          context.report({
            node,
            messageId: 'noFoo',
            fix(fixer) {
              return fixer.replaceText(node, 'bar');
            },
          });
        }
      },
    };
  },
};
```

### 内置 vs 第三方规则

| 来源                         | 例子                                                             |
| ---------------------------- | ---------------------------------------------------------------- |
| `@eslint/js`(原 eslint 内置) | no-unused-vars / no-undef / eqeqeq                               |
| `typescript-eslint`          | no-explicit-any / consistent-type-imports / no-floating-promises |
| `eslint-plugin-react`        | react/jsx-key / react/no-array-index-key                         |
| `eslint-plugin-react-hooks`  | rules-of-hooks / exhaustive-deps                                 |
| `eslint-plugin-import`       | import/order / no-cycle / no-unresolved                          |
| `eslint-plugin-unicorn`      | 通用最佳实践集                                                   |

### Auto-fix(`--fix`)

- 规则可选实现 `fix(fixer)` 返回字符修改
- ESLint 按 fix 范围排序,确保不冲突
- 不确定的修复用 "suggestions"(IDE 显示但不自动应用)

### Performance:`--cache` + `flat config`

- 大项目跑全量 lint 慢:`eslint . --cache --cache-location node_modules/.cache/eslint`
- Flat Config 比老配置加载更快(无 `extends` 链式解析)
- 用 lint-staged 只 lint 改动文件

## 代码示例

### 最小自定义规则:禁用 `console.log`(已有,这里仅作示例)

```js
// rules/no-console-log.js
export default {
  meta: {
    type: 'suggestion',
    docs: { description: '禁用 console.log' },
    fixable: 'code',
    messages: { noLog: '不要在生产代码用 console.log' },
  },
  create(ctx) {
    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type === 'MemberExpression' && callee.object.name === 'console' && callee.property.name === 'log') {
          ctx.report({
            node,
            messageId: 'noLog',
            fix: (fixer) => fixer.remove(node.parent),
          });
        }
      },
    };
  },
};
```

### inline disable 几种方式

```js
// 整行禁用
const x = 1; // eslint-disable-line no-unused-vars

// 下一行禁用
// eslint-disable-next-line no-unused-vars
const y = 1;

// 文件级禁用
/* eslint-disable */

// 块禁用
/* eslint-disable no-console */
console.log('hi');
/* eslint-enable no-console */
```

**审查建议**:`disable` 必须**带具体规则名 + 注释解释为什么**;无脑 `eslint-disable` 是审计点。

## 易错点 / 反例

### 1. Flat Config 和 `.eslintrc` 混用

ESLint 9 起,**不能同时存在**两种配置。删干净一种再切换。

### 2. `typescript-eslint` 没配 parser

```js
// ❌
{ rules: { '@typescript-eslint/no-unused-vars': 'error' } }
// 必须配 parser:
{
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { project: './tsconfig.json' },
  },
}
```

**`project` 字段**让 TS 规则做"类型感知"检查(如 `no-floating-promises` 需类型信息),但显著变慢;不需要类型感知的规则可省略。

### 3. ESLint 不是格式化工具

ESLint 处理"语法 / 逻辑",**不是 Prettier 的替代**。两者职责:

- **ESLint**:发现潜在错误(`no-unused-vars`、`exhaustive-deps`)
- **Prettier**:统一格式(缩进 / 引号 / 行宽)

详见 `engineering-prettier-formatter`。

### 4. `react/jsx-uses-react` 在 React 17+ 无意义

React 17 起新 JSX transform(`react/jsx-runtime`)不需要 `import React`,这条规则可以禁用。新项目用 `eslint-plugin-react/recommended` 而不要照搬 16 的配置。

### 5. 无脑 disable

```js
// ❌
// eslint-disable-next-line
foo();
```

没规则名 + 没原因。审查时一律打回:

```js
// eslint-disable-next-line no-eval -- 这里需要执行用户脚本沙箱
eval(code);
```

### 6. lint 慢的常见原因

- 没开 `--cache`
- `typescript-eslint` 开了 type-aware 但 tsconfig include 太大
- 没用 lint-staged,每次 commit 全量 lint
- 在 CI 跑 type-aware lint(改用 `tsc --noEmit` 做类型,lint 只跑非 type-aware 规则)

## 高频面试题(5 题)

- **Q1**: ESLint 的工作架构是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Parser**:把代码解析成 AST(默认 espree;TS 用 `@typescript-eslint/parser`)
  - **Rules**:每条规则是一个 visitor,声明对哪些 AST 节点感兴趣,在 `create(context)` 里写检查逻辑
  - **Linter**:跑所有启用的规则,收集 messages 和 fixes
  - **Fixer**:`--fix` 把可自动修复的 fixes 应用到代码

  配置:Flat Config(`eslint.config.js`)是 ESLint 9 起的标准,老 `.eslintrc.*` 进入维护期。

  &lt;details&gt;

- **Q2**: 怎么写一个自定义 ESLint 规则?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  3 部分:

  - `meta`:类型、文档、是否 fixable、参数 schema、错误消息
  - `create(context)`:返回 visitor 对象,key 是 AST 节点类型,value 是访问回调
  - 在回调里 `context.report({ node, messageId, fix })`

  规则可以发布成 `eslint-plugin-&lt;name&gt;` npm 包,或本地 plugin 直接 import。

  &lt;details&gt;

- **Q3**: ESLint 和 Prettier 有什么区别?为什么两者要分工?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **ESLint**:**语法/逻辑** lint(no-unused-vars、exhaustive-deps、eqeqeq);可 autofix 部分问题
  - **Prettier**:**格式**化(缩进 / 引号 / 行宽 / 换行),无规则可选,统一风格

  分工原则:Prettier 管样式,ESLint 管对错。两者职责不重叠,常用 `eslint-config-prettier` 关闭 ESLint 的格式相关规则,避免冲突。

  &lt;details&gt;

- **Q4**: `typescript-eslint` 中"类型感知"规则有什么特别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  类型感知(type-aware)规则(如 `no-floating-promises` / `no-unsafe-assignment`)需要 TS 类型信息,要配 `parserOptions.project` 指向 tsconfig:

  ```js
  parserOptions: {
    project: './tsconfig.json';
  }
  ```

  代价:lint 速度变慢(每个文件要走类型推断)。优化:CI 里跑全量,IDE 里减少 type-aware 规则数量,或拆 tsconfig project 缩小范围。

  &lt;details&gt;

- **Q5**: 如何让大型项目 ESLint 跑得更快?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **`--cache`**:`eslint . --cache`,只 lint 变更过的文件
  - **lint-staged**:commit 时只 lint 改动文件(详见 git-hooks)
  - **缩小 type-aware 范围**:不需要类型感知的规则不要开 `project`
  - **拆 tsconfig project**:monorepo 用 references 让 lint 只看本包
  - **CI 并行**:多 worker 跑 lint
  - **关掉不必要规则**:别 extends 一堆 plugin/recommended,精准选

  &lt;details&gt;

## 延伸资源

- [ESLint: Getting Started](https://eslint.org/docs/latest/use/getting-started)
- [ESLint: Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
- [typescript-eslint](https://typescript-eslint.io/)

## (留白) 我的理解

> 这一段不强制填。

---

## Git Hooks(Husky / lint-staged / commitlint / pre-commit)

## TL;DR

> 通过 Git 钩子(`pre-commit` / `commit-msg` / `pre-push`)在本地强制执行 lint / format / 提交信息规范。现代组合:**Husky**(钩子安装)+ **lint-staged**(只对改动文件跑)+ **commitlint**(提交信息检查)。

## 背景与动机

CI 兜底固然好,但本地拦截更省时间:

- 推上去再 CI 挂 → 浪费 N 分钟 + 推动你 force push
- 提交信息混乱 → CHANGELOG 没法自动生成 + 排查历史困难

Git hooks 是 Git 自带的"钩子目录"(`.git/hooks/`),Husky 帮我们把这些钩子代码化、可 npm 安装、跨平台。配合 lint-staged + commitlint 形成**完整提交前防线**。

理解三件套 + 配置组合,是规范化工程必备技能。

## 核心机制

### Git Hooks 钩子点

| 钩子                 | 时机                       | 常用                     |
| -------------------- | -------------------------- | ------------------------ |
| `pre-commit`         | commit 前                  | lint / format / test     |
| `commit-msg`         | 提交信息生成后 / commit 前 | commitlint 检查信息      |
| `prepare-commit-msg` | commit-msg 之前            | 自动填充信息(如 jira 号) |
| `pre-push`           | push 前                    | 跑完整测试 / 类型检查    |

钩子是**shell 脚本**(或可执行文件),放在 `.git/hooks/` 下;但这个目录**不会被 git 追踪**,所以需要工具帮忙安装/分发。

### Husky 的角色

- 把钩子配置放到 `.husky/` 目录(可被 git 追踪)
- `npm install` 时自动 link 到 `.git/hooks/`(via `prepare` script)
- 跨平台、零配置

```jsonc
// package.json
{
  "scripts": {
    "prepare": "husky install",
  },
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

替代:`simple-git-hooks`(更轻量,无运行时依赖)/ `lefthook`(Go 写,快)/ `pre-commit`(Python 生态主流)。

### lint-staged —— 只 lint 改动文件

全量 lint 大项目要几分钟,commit 前等不起。lint-staged 让钩子**只对 git 暂存区**的文件跑:

```jsonc
// package.json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.{json,md,css}": [
    "prettier --write"
  ]
}
```

**关键**:

- 命令对每个匹配的暂存文件路径**追加**执行
- 自动把修改后的文件重新 `git add`(配 `.lintstagedrc` 可关)
- 命令失败 → 阻止 commit

### commitlint —— 检查提交信息格式

强制 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
&lt;type&gt;(&lt;scope&gt;): &lt;subject&gt;

[optional body]

[optional footer]
```

`type` 枚举:`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore` / `revert`

```bash
npm i -D @commitlint/cli @commitlint/config-conventional
```

```js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] };
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

收益:

- 提交历史可读
- `standard-version` / `release-please` / `semantic-release` 可自动生成 CHANGELOG + 推 tag
- 多人协作语义统一

### 完整组合(2026 实战)

```jsonc
// package.json
{
  "scripts": {
    "prepare": "husky install",
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md,css,yaml}": ["prettier --write"],
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
  },
}
```

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx --no -- commitlint --edit "$1"

# (可选)
# .husky/pre-push
npm run typecheck && npm test
```

## 代码示例

### 一个真实的 commit 例子

```
feat(auth): support magic-link login

- 新增 /api/auth/magic-link 端点
- 邮件模板支持多语言
- 加入 throttle 防暴力枚举

Closes #1234
```

### 跳过钩子(应急)

```bash
git commit --no-verify -m "..."     # 跳过 pre-commit / commit-msg
git push --no-verify                # 跳过 pre-push
```

**审查规则**:`--no-verify` 必须在 PR 描述里解释,否则不予合并。

## 易错点 / 反例

### 1. 钩子里跑全量 lint(慢)

```bash
# ❌
npm run lint        # 整个项目 lint 一遍
```

小项目还行,大项目几十秒 → commit 体验差。**用 lint-staged 只 lint 暂存文件**。

### 2. Husky 8 → 9 迁移漏改

Husky 9 简化了脚本格式(去掉 `husky.sh` 引导):

```bash
# Husky 9
echo "npx lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

混旧版语法可能不生效。

### 3. lint-staged 没 chain `git add`

默认情况:lint 修改的文件会自动重新 `git add`。但如果你用 `--no-stash` 或自定义 git add,可能漏。**确保 lint-staged 默认行为没被改**。

### 4. commitlint 拒绝合并 commit

某些场景(rebase / merge / squash)commit 信息特殊(`Merge branch ...` / `Revert ...`),commitlint 可能拒绝。
**修复**:`config-conventional` 默认忽略 merge / revert;或在 `commitlint.config.js` 加 `ignores: [(msg) => msg.startsWith('Merge')]`。

### 5. monorepo 里 husky 安装位置

Husky 9+ 推荐安装到 **monorepo 根**(只有根的 `.git`),而不是每个子包。`prepare` 脚本写在根 package.json。

### 6. CI 也不能完全信本地钩子

本地钩子可被 `--no-verify` 绕过。CI 必须再跑一次同样的检查(lint / format / commit msg),作为兜底:

```yaml
- run: npm run lint
- run: npx prettier --check .
- run: npx commitlint --from=origin/main
```

## 高频面试题(5 题)

- **Q1**: 为什么本地要装 git hooks?CI 不够吗?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  CI 是"最后一道关",但反馈周期长(几分钟):推上去 → 等 CI → 失败 → 改 → 重推。

  本地钩子(pre-commit / commit-msg)在 commit 那一刻就拦截:

  - lint / format 错误本地直接修复
  - 提交信息格式规范化(便于 CHANGELOG / 历史浏览)
  - 节省 N 个 CI 失败循环

  本地钩子可被 `--no-verify` 绕过,所以 CI 仍是兜底。两者互补,不互相替代。

  &lt;details&gt;

- **Q2**: lint-staged 解决了什么问题?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  全量 lint 大项目耗时(几十秒到几分钟),commit 前等不起。lint-staged 让钩子**只对 git 暂存的文件**跑 lint / format,通常几百毫秒到几秒。

  机制:读 `git diff --cached --name-only`,对匹配的文件路径调用配置的命令,然后自动 `git add` 修改后的文件。

  &lt;details&gt;

- **Q3**: Conventional Commits 是什么?为什么用它?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  规范化 commit 信息:`&lt;type&gt;(&lt;scope&gt;): &lt;subject&gt;`。type 枚举包括 feat / fix / docs / refactor / perf / test / chore 等。

  好处:

  - **可读**:一眼知道这次 commit 干啥
  - **可工具化**:`standard-version` / `semantic-release` 根据 type 自动算 semver(feat → minor,fix → patch,BREAKING CHANGE → major)
  - **CHANGELOG 自动生成**:工具按 type 分组生成发布日志
  - **审计 / 团队协作**统一语义

  commitlint 在 commit-msg 钩子里强制检查。

  &lt;details&gt;

- **Q4**: Husky 和 simple-git-hooks / lefthook 怎么选?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Husky**:最流行,生态最大,支持复杂场景。但安装路径占空间(`.husky/`)
  - **simple-git-hooks**:轻量,只一个文件,配置在 package.json
  - **lefthook**:Go 写,并行运行 hooks,大项目更快
  - **pre-commit**(python):Python 生态主流,语言无关

  小项目:`simple-git-hooks` 够用;团队规模 / 复杂钩子:Husky;追求速度 / 跨语言 monorepo:lefthook。

  &lt;details&gt;

- **Q5**: 钩子被 `--no-verify` 绕过怎么办?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  本地钩子按 Git 设计就**可以被绕过**,这是工程实践问题不是技术问题。对策:

  1. **CI 兜底**:CI 跑同样的 lint / format / commitlint
  2. **PR 审查**:`--no-verify` 必须在 PR 描述里说明原因
  3. **服务端钩子**:Git server(GitLab / Gitea / 自建)可设 `pre-receive` 钩子,远程拦截不符合规范的 push
  4. **分支保护**:GitHub / GitLab 配 branch protection,要求 CI 必须通过才能合并

  本地钩子是"善意提醒",CI + 服务端钩子是强制。

  &lt;details&gt;

## 延伸资源

- [Husky 文档](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [commitlint](https://commitlint.js.org/)

## (留白) 我的理解

> 这一段不强制填。

---

## Prettier 格式化哲学与配置

## TL;DR

> Prettier = **"有意见"的代码格式化工具**,极少配置项,把格式风格争论"终结"。流程:Parser → AST → **Printer 按规则重新生成代码**(不是简单的文本替换)。和 ESLint **职责分离**(Prettier 管样式,ESLint 管对错),用 `eslint-config-prettier` 关掉 ESLint 的格式规则。

## 背景与动机

老式格式化(beautify / clang-format)有几十个选项,每个团队配出不一样的"风格",争论永远没结果。

Prettier(2017)的设计反思:

- **少配置 / 强意见**(opinionated):核心只有 10 多个选项
- **AST-based 重新打印**:不是简单的"加空格 / 换行",是把 AST 按印刷规则重排,保证语义一致
- **跨语言一致**:支持 JS / TS / CSS / JSON / Markdown / YAML / GraphQL,统一团队

掌握:

- 知道为什么团队配 Prettier 就不应该再争"分号要不要"
- 会和 ESLint 正确分工(避免无谓冲突)
- IDE / pre-commit / CI 三层把关

## 核心机制

### 工作流程

```
源代码字符串
     │
     ▼
   Parser(@babel/parser / typescript / postcss ...)
     │
     ▼
    AST(每种语言一个)
     │
     ▼
   Printer:按规则(printWidth 等)从 AST 重新生成代码
     │
     ▼
   新代码字符串
```

**关键认知**:Prettier 是**重新生成**代码,不是"基于文本修改"。所以它能完美对齐 / 换行 / 引号统一,因为它从结构层面理解代码。

### 核心配置(选项极少)

```json
// .prettierrc.json
{
  "semi": true, // 句末分号
  "singleQuote": true, // 单引号
  "trailingComma": "all", // 尾随逗号:none / es5 / all
  "printWidth": 100, // 行宽阈值(超出尝试折行)
  "tabWidth": 2, // 缩进宽度
  "useTabs": false, // tab vs space
  "arrowParens": "always", // 箭头函数参数加括号
  "bracketSpacing": true, // { foo: 1 } 内空格
  "endOfLine": "lf", // 换行符:lf / crlf / auto
  "jsxSingleQuote": false,
  "embeddedLanguageFormatting": "auto"
}
```

**只有这么多**(完整列表也就 20 来个)。设计哲学:开放空间越多 → 团队争论越多。

### Prettier vs ESLint 的边界

| 关心                       | Prettier | ESLint                                      |
| -------------------------- | -------- | ------------------------------------------- |
| 缩进 / 换行 / 空格         | ✅       | ❌                                          |
| 引号 / 分号                | ✅       | ❌(老规则有,被 eslint-config-prettier 关掉) |
| 行宽 / 折行策略            | ✅       | ❌                                          |
| 拼写错的变量名             | ❌       | ✅                                          |
| 未使用的 import            | ❌       | ✅(no-unused-vars / unused-imports)         |
| Hooks 依赖完整性           | ❌       | ✅(exhaustive-deps)                         |
| 潜在 bug(eqeqeq / no-eval) | ❌       | ✅                                          |

**总结**:Prettier 管"看起来",ESLint 管"对不对"。

### 集成 ESLint(避免冲突)

```bash
npm i -D prettier eslint-config-prettier
```

```js
// eslint.config.js
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig, // 必须放在最后,关掉所有和 Prettier 冲突的规则
];
```

> 不推荐 `eslint-plugin-prettier`(把 Prettier 当 ESLint 规则跑,性能差且 lint 错误信息混乱)。现代做法:Prettier 单独跑(IDE format on save + pre-commit + CI 检查)。

### `.prettierignore`

```
dist
build
coverage
package-lock.json
*.min.js
```

没 ignore 时会格式化所有文件,但产物 / 第三方代码格式化没意义。

### CLI 用法

```bash
# 格式化
prettier --write "src/**/*.{ts,tsx,css,md}"

# 检查(CI 用,有未格式化文件就 exit 1)
prettier --check "src/**/*.{ts,tsx,css,md}"
```

## 代码示例

### IDE format-on-save(VS Code)

```jsonc
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
  },
}
```

### lint-staged + Prettier

```jsonc
// package.json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md,css}": ["prettier --write"]
}
```

commit 时只对**改动文件**跑格式化。

### CI 卡格式化

```yaml
# .github/workflows/ci.yml
- run: npx prettier --check "src/**/*.{ts,tsx,css,md}"
```

有人没 format → CI fail。

## 易错点 / 反例

### 1. ESLint 没装 `eslint-config-prettier`

ESLint 自带几条格式规则(`indent` / `quotes` / `semi`),会和 Prettier 打架(保存后两边交替修改)。
**修复**:install + extends `eslint-config-prettier`,关掉这些 ESLint 规则。

### 2. 用 `eslint-plugin-prettier`(性能差)

把 Prettier 当 ESLint 规则跑,每个格式问题报一个 lint 错误,信息混乱、慢。
**修复**:让 Prettier 独立跑,IDE format on save + pre-commit 双保险。

### 3. `.prettierrc` 嵌套 / 多份

项目根、子目录都有 `.prettierrc` 会引发"为什么我和同事保存出来的代码不一致"。
**修复**:全 repo 一份配置,monorepo 也最好统一(除非有真实差异)。

### 4. `endOfLine` 在 Windows 团队踩坑

默认 `lf`,Windows 用户 git clone 后可能被 git 转 `crlf` → 保存又被 Prettier 改回 `lf` → 永远 diff。
**修复**:加 `.gitattributes`:

```
* text=auto eol=lf
```

- 团队统一 `endOfLine: 'lf'`。

### 5. 自动 import / sort 不归 Prettier

- Import 排序:用 `eslint-plugin-import` 或 `@trivago/prettier-plugin-sort-imports`
- 自动 import 缺失:IDE 功能(VS Code / WebStorm 内置)

Prettier 核心**只格式化已有代码**,不增删 import。

### 6. 不格式化文档 / 配置

团队往往只 format `src/`,忘了 `README.md` / `.github/` / 配置文件。结果文档风格不一致。
**修复**:`prettier --write "**/*.{ts,tsx,js,jsx,json,md,yaml,yml,css}"` 一锅端。

## 高频面试题(5 题)

- **Q1**: Prettier 为什么"配置项极少"是优点?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  设计哲学:格式风格的争论本身没意义,开放选项越多 → 团队越纠结、风格越分裂。Prettier 强制收敛("opinionated"),只暴露真正有意义的几个开关(分号 / 引号 / 行宽 / 缩进)。

  实战收益:接手新项目 / 跨团队 / 开源贡献时,代码风格几乎一致,减少 review 噪音。

  &lt;details&gt;

- **Q2**: Prettier 和 ESLint 怎么分工?为什么要 `eslint-config-prettier`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  分工:

  - **Prettier**:格式(缩进 / 引号 / 行宽 / 换行 / 尾逗号)
  - **ESLint**:语法 / 逻辑(no-unused-vars / eqeqeq / hooks 规则)

  ESLint 内置有部分格式规则(`indent` / `quotes` / `semi`),会和 Prettier 冲突。`eslint-config-prettier` 显式关掉所有这些规则,让两者各管各的。

  &lt;details&gt;

- **Q3**: 为什么不推荐 `eslint-plugin-prettier`?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  这个 plugin 把 Prettier 当 ESLint 规则跑,每个格式问题报一个 lint error:

  - **性能差**:每个 lint 周期都跑一遍 Prettier
  - **信息混乱**:格式问题混进 lint 错误,审 review 时分不清是 lint 还是 format
  - **修复体验**:`--fix` 同时跑两套修复链,可能互相覆盖

  更好做法:Prettier 单独跑(IDE format on save + lint-staged + CI prettier --check)。

  &lt;details&gt;

- **Q4**: 怎么在团队里贯彻 Prettier?三层把关怎么做?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **IDE 层**:VS Code / WebStorm 配置 `formatOnSave: true`,装 Prettier 插件,所有人保存自动格式化
  - **Pre-commit 层**:Husky + lint-staged,commit 时对改动文件跑 `prettier --write`,漏改的也兜底
  - **CI 层**:CI 跑 `prettier --check`,任何未格式化的代码直接挂 build

  三层缺一不可:IDE 防"不知道"、pre-commit 防"忘了"、CI 防"绕过"。

  &lt;details&gt;

- **Q5**: Prettier 是简单"加空格 / 换行",还是别的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  Prettier 是**AST-based**重新生成:

  1. 解析代码到 AST
  2. **抛弃**原代码的所有空白 / 缩进 / 换行(只保留语义)
  3. 用 Printer 按 printWidth 等规则**从 AST 重新生成**代码

  这就是为什么它能保证完美对齐 / 智能折行 / 跨行注释保持 —— 它从结构层面理解代码,不是文本替换。

  &lt;details&gt;

## 延伸资源

- [Prettier 文档](https://prettier.io/docs/en/index)
- [Prettier 选项](https://prettier.io/docs/en/options)
- [Prettier + ESLint 集成](https://prettier.io/docs/en/integrating-with-linters)

## (留白) 我的理解

> 这一段不强制填。

---

## Core Web Vitals(LCP / INP / CLS)

## TL;DR

> Google 定义的 3 个用户体验核心指标:**LCP**(最大内容绘制)/ **INP**(交互响应延迟,**2024 起取代 FID**)/ **CLS**(累计布局偏移)。Lighthouse 测实验室数据,`web-vitals` 库测真实用户(RUM),CrUX 是 Chrome 真实用户数据库。

## 背景与动机

Google 2020 提出 Core Web Vitals,把"快、稳、能用"量化成可测的指标,并**纳入搜索排名**。

三大指标关心三个不同维度:

- **LCP**:"页面加载多快能看到主要内容"
- **INP**:"用户操作多快有反应"
- **CLS**:"页面跳不跳"

2024-03 起 INP 正式取代 FID(First Input Delay):FID 只看"第一次"输入,忽略长期交互;INP 看**整个会话所有交互的最差**那次,更贴近真实体验。

## 核心机制

### 三大指标定义

| 指标    | 含义                                              | 目标(Good) | 警告      | 差      |
| ------- | ------------------------------------------------- | ---------- | --------- | ------- |
| **LCP** | 视口内最大可见元素的渲染时间                      | ≤ 2.5s     | 2.5–4.0s  | > 4.0s  |
| **INP** | 用户交互到下一帧的延迟,取**整个会话最差**(约 p98) | ≤ 200ms    | 200–500ms | > 500ms |
| **CLS** | 累计布局偏移分(0~∞)                               | ≤ 0.1      | 0.1–0.25  | > 0.25  |

#### LCP 候选元素

- `&lt;img&gt;` / `&lt;image&gt;` / `&lt;video&gt;` 的封面
- 带背景图的元素
- 含文字的块级元素(段落、标题、卡片)
- 不算:`&lt;svg&gt;` / 视口外的元素

LCP 通常是首屏的一张大图或一段大标题。

#### INP 计算

- 用户任意交互(click / tap / keydown,**不含 scroll/hover**)
- 测量:input → 处理器执行完 → 下一帧绘制
- 整个会话所有交互记录,**取较差的几次的代表值**(粗略 p98)
- 强调"持续可用"而不只是"刚打开快"

#### CLS 计算

- 检测视口内元素的"意外位移"
- 一个 layout shift 分数 = 影响面积比 × 距离比
- 累计**整个会话**(2024 改为 5 秒滑动窗口最大值,称为 CLS-S)的偏移
- 用户触发的位移(点击展开)有 500ms 豁免期,不算

### 测量层级

| 层                | 工具                                                          | 数据来源                        |
| ----------------- | ------------------------------------------------------------- | ------------------------------- |
| **实验室**        | Lighthouse / PageSpeed Insights / DevTools Performance        | 受控网络/CPU,**预估值**         |
| **真实用户(RUM)** | `web-vitals` 库 + Sentry / GA / 自建                          | 实际用户浏览器上报              |
| **Google CrUX**   | PageSpeed Insights 顶部 / [BigQuery](https://goo.gle/crux-bq) | Chrome 真实用户数据库,28 天 p75 |

**Lighthouse 和真实数据可能差很多**:实验室模拟"快网速 + 中等设备",真实用户分布广;真实数据是搜索排名的依据。

### `web-vitals` 库

```js
import { onLCP, onINP, onCLS } from 'web-vitals/attribution';

onLCP((metric) => report('LCP', metric));
onINP((metric) => report('INP', metric));
onCLS((metric) => report('CLS', metric));

function report(name, metric) {
  navigator.sendBeacon(
    '/rum',
    JSON.stringify({
      name,
      value: metric.value,
      rating: metric.rating, // 'good' / 'needs-improvement' / 'poor'
      attribution: metric.attribution, // 定位最差元素 / 最慢事件
      id: metric.id, // 同一指标多次更新可关联
    }),
  );
}
```

**关键**:用 `attribution` 模式能拿到"是哪个 LCP 元素 / 哪个 INP 事件",**否则只有数字没有定位线索**。

### 优化方向速查

| 指标    | 主要优化                                                                                                                                      |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **LCP** | 服务器响应快(TTFB)/ 关键资源 preload / 图片优化(WebP/AVIF/srcset)/ `fetchpriority="high"` / 减少 render-blocking                              |
| **INP** | 减少 long task / 拆 JS / 时间分片 / Web Worker / 避免在交互处理器里同步重渲染大组件                                                           |
| **CLS** | 图片 / iframe / video 写明 width/height / 字体 `font-display: optional` 或预加载 / 避免动态注入推下原内容 / 用 transform 代替 left/top 做动画 |

## 代码示例

### 完整 RUM 上报最小骨架

```js
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals/attribution';

const reportQueue = [];
function send() {
  if (reportQueue.length === 0) return;
  navigator.sendBeacon('/rum', JSON.stringify(reportQueue));
  reportQueue.length = 0;
}

function queue(metric) {
  reportQueue.push({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    attribution: metric.attribution,
  });
}

onLCP(queue);
onINP(queue);
onCLS(queue);
onFCP(queue);
onTTFB(queue);

addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') send();
});
```

`visibilitychange` 是上报最佳时机:用户切走/关闭页面前 flush。

## 易错点 / 反例

### 1. 还在用 FID

2024-03 起 INP 是排名指标,**FID 已退役**。代码里 `onFID` 仍能跑(`web-vitals` v4+ 已移除),但**别再看 FID 数据做决策**。

### 2. 实验室和真实数据混淆

Lighthouse 跑出来 90 分,真实用户 LCP 5s → 因为 Lighthouse 模拟的网络 / 设备和真实用户不同。**搜索排名看 CrUX(真实用户 28 天 p75),不看 Lighthouse**。

### 3. LCP 元素不一定是图片

有些首屏是大段文字 / 卡片 → LCP 元素可能是 `&lt;h1&gt;` 或 `&lt;p&gt;`。优化时不要默认"加图片懒加载就好"。用 DevTools Performance → LCP 标记看实际 element。

### 4. CLS 评估窗口变化

旧版 CLS 累计整个 session(单页应用刷不动就一直涨)。新版改为**5 秒滑动窗口最大值**(CLS-S),长 SPA 更友好。但仍要尽量避免布局偏移。

### 5. INP 是最差,不是平均

团队优化时常拿到"平均 INP 50ms"开心,但 Google 看的是 p98 类的"最差几次"。**只要少数交互 >500ms 就算 poor**。要定位"哪些少数交互最慢"(用 attribution)。

### 6. 动态注入广告 / Banner 推下内容(CLS 大坑)

首屏渲染完后,异步加载的广告/通知占位推下其它内容 → CLS 爆涨。
**修复**:为动态内容**预留固定高度**(占位骨架),或用 `position: sticky / fixed`,或动画 transform。

## 高频面试题(5 题)

- **Q1**: Core Web Vitals 是哪三个指标?目标值?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **LCP**(Largest Contentful Paint)≤ 2.5s
  - **INP**(Interaction to Next Paint)≤ 200ms
  - **CLS**(Cumulative Layout Shift)≤ 0.1

  这三个是 Google 用于评估"加载快 / 响应快 / 视觉稳定"的核心指标,2024 起 INP 正式取代 FID,并影响搜索排名(基于 CrUX 真实用户数据,28 天 p75)。

  &lt;details&gt;

- **Q2**: FID 和 INP 有什么区别?为什么要换?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **FID**(First Input Delay):只看**第一次**交互的输入延迟,**不包含处理时间**,只看"事件到 handler 开始执行"那一段
  - **INP**(Interaction to Next Paint):看整个会话**所有**交互,从输入到下一次绘制完成,**包含处理 + 渲染**;取较差的几次的代表值(约 p98)

  FID 反映"第一印象"但不代表持续体验;INP 全面得多。2024-03 INP 正式成为 Core Web Vitals,FID 退役。

  &lt;details&gt;

- **Q3**: LCP 优化有哪些主要手段?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  按管线优化:

  - **TTFB 缩短**:服务端响应快 / CDN / 缓存 / 流式 HTML
  - **关键资源加载快**:`preconnect` / `preload` / `103 Early Hints`
  - **去除 render-blocking**:CSS 分关键/非关键、JS 用 defer/async
  - **LCP 图片专项**:`fetchpriority="high"` + WebP/AVIF + srcset + 不要 lazy loading
  - **缩短 JS 阻塞**:SSR / 流式 HTML 提前显示内容

  &lt;details&gt;

- **Q4**: CLS 0.5 怎么定位是哪个元素跳了?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **DevTools Performance**:录制,过滤 "Layout shift",看时间轴上的偏移条,点击看 shifted element
  - **`web-vitals/attribution`**:RUM 上报里能拿到 `largestShiftSource`(具体元素)、`largestShiftTime`(时间点)
  - **DevTools → Rendering → Layout Shift Regions**:页面上高亮闪烁的区域
  - **常见嫌疑**:首屏图片没 width/height、字体 swap、动态注入广告 / banner、`@font-face` 字体晚到

  &lt;details&gt;

- **Q5**: 实验室数据(Lighthouse)和真实用户数据(CrUX / RUM)为什么会差很多?以哪个为准?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **Lighthouse**:模拟环境(慢 4G / 中等 CPU)+ 单次测量,可重现但**不代表真实用户**
  - **CrUX**:Chrome 真实用户 28 天 p75 聚合,**搜索排名依据**
  - **RUM**(自建):你的真实用户分布,可看不同地区 / 设备

  以**真实数据**(CrUX / RUM)为准。Lighthouse 适合在开发/CI 中做回归检测,真实数据决定线上是否达标。

  &lt;details&gt;

## 延伸资源

- [web.dev: Vitals](https://web.dev/articles/vitals)
- [web.dev: INP](https://web.dev/articles/inp)
- [web-vitals 库](https://github.com/GoogleChrome/web-vitals)

## (留白) 我的理解

> 这一段不强制填。

---

## 懒加载 / 代码分割 / 虚拟列表 / 图片优化

## TL;DR

> 砍 bundle / 加快首屏 / 让长列表流畅的三招:**代码分割**(动态 import / 路由级懒加载)+ **图片优化**(WebP/AVIF + srcset + 原生 lazy + fetchpriority)+ **虚拟列表**(只渲染窗口内 + 缓冲区)。配合 `content-visibility: auto` 让浏览器自动跳过不可见区域。

## 背景与动机

bundle / 渲染 / 网络是前端性能的三大杀手:

- bundle 大 → 首屏 LCP 慢
- 不需要的资源加载 → 浪费带宽 + 内存
- 长列表渲染上千项 → 页面卡死

这些问题不能靠"代码写得快"解决,必须**结构性优化**:

- 把 JS 拆开,只载入需要的
- 图片只在视口内加载,且选小格式
- 长列表只渲染可见部分

掌握这套工具能让 LCP 从 5s 降到 1s,长列表 30fps 变 60fps。

## 核心机制

### 代码分割三层粒度

| 粒度       | 实现                                                    | 适合                                 |
| ---------- | ------------------------------------------------------- | ------------------------------------ |
| **路由级** | `React.lazy` / `defineAsyncComponent` / vue-router lazy | 大多数 SPA 的主要分割点              |
| **组件级** | 同上,在组件树里用                                       | 大对话框 / 编辑器 / 图表等"按需打开" |
| **依赖级** | bundler `splitChunks`                                   | 把 react / lodash 等 vendor 独立出来 |

#### React.lazy + Suspense

```jsx
import { lazy, Suspense } from 'react';

const Editor = lazy(() => import('./Editor'));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Editor />
    &lt;Suspense&gt;
  );
}
```

原理:`import('./Editor')` 是动态 import,bundler 自动切出独立 chunk,运行时 fetch + execute。第一次访问 `<Editor />` 时挂起 Suspense → fallback → chunk 加载完 → 渲染。

#### 预加载策略

```jsx
const Editor = lazy(() => import('./Editor'));

// 用户 hover 按钮时提前 preload
<button
  onMouseEnter={() => import('./Editor')}
  onClick={() => setShow(true)}
>Open&lt;button&gt;
```

chunk 已在缓存里,点击时无需等待。

### 图片优化的现代组合拳

| 技术                                    | 做什么                             |
| --------------------------------------- | ---------------------------------- |
| **WebP / AVIF**                         | 比 JPEG 小 25-50%,主流浏览器都支持 |
| **srcset / sizes**                      | 按视口宽度 / 像素密度选不同尺寸    |
| **`loading="lazy"`**                    | 视口外原生懒加载(无需 JS)          |
| **`decoding="async"`**                  | 异步解码,不阻塞渲染                |
| **`fetchpriority="high"`**              | 给 LCP 图片标记高优先级            |
| **`&lt;picture&gt;` + `<source type>`** | 按格式 fallback                    |
| **`content-visibility: auto`**          | 视口外整块跳过 layout/paint        |

```html
&lt;picture&gt;
<source type="image/avif" srcset="hero.avif" />
<source type="image/webp" srcset="hero.webp" />
<img src="hero.jpg" alt="..." width="800" height="400" fetchpriority="high" decoding="async" />
&lt;picture&gt;
```

**注意**:LCP 图片**不要** `loading="lazy"`,会推迟首屏渲染。

### `content-visibility: auto`

告诉浏览器:这个 section 内部可能不可见,**不可见时跳过 layout / paint**:

```css
.long-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px; /* 占位高度,避免滚动条跳 */
}
```

适合**长博客**、**评论列表**、**FAQ** 等长页。LCP / INP / 整体 paint 都能受益。

### 虚拟列表(Virtual List)

**问题**:渲染 10000 行 DOM → 内存爆 + 主线程卡。
**思路**:只渲染**可视区域 + 缓冲区**的项,滚动时动态替换。

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function List({ items }) {
  const parentRef = useRef(null);
  const v = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,           // 项的预估高度
    overscan: 5,                      // 上下额外渲染几项
  });

  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: v.getTotalSize(), position: 'relative' }}>
        {v.getVirtualItems().map((vi) => (
          <div
            key={vi.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${vi.start}px)`,
              height: vi.size,
            }}
          >
            {items[vi.index].name}
          &lt;div&gt;
        ))}
      &lt;div&gt;
    &lt;div&gt;
  );
}
```

主流库:`@tanstack/react-virtual` / `vue-virtual-scroller` / `virtua`(框架无关)。

### IntersectionObserver(底层工具)

监听元素是否进入视口,适合:

- 自实现图片懒加载
- 触底加载(分页)
- 上报曝光

```js
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) loadImg(e.target);
    });
  },
  { rootMargin: '200px' },
); // 提前 200px 触发

document.querySelectorAll('img[data-src]').forEach((img) => io.observe(img));
```

## 代码示例

### 路由级代码分割(React Router)

```jsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const router = createBrowserRouter([
  { path: '/', element: <Suspense fallback={<Loading/>}><Home/>&lt;Suspense&gt; },
  { path: '/dashboard', element: <Suspense fallback={<Loading/>}><Dashboard/>&lt;Suspense&gt; },
]);
```

### 响应式 LCP 图片完整模板

```html
&lt;picture&gt;
<source
  type="image/avif"
  srcset="hero-480.avif 480w, hero-960.avif 960w, hero-1920.avif 1920w"
  sizes="(max-width: 600px) 480px, (max-width: 1200px) 960px, 1920px"
/>
<source
  type="image/webp"
  srcset="hero-480.webp 480w, hero-960.webp 960w, hero-1920.webp 1920w"
  sizes="(max-width: 600px) 480px, (max-width: 1200px) 960px, 1920px"
/>
<img
  src="hero-960.jpg"
  srcset="hero-480.jpg 480w, hero-960.jpg 960w, hero-1920.jpg 1920w"
  sizes="(max-width: 600px) 480px, (max-width: 1200px) 960px, 1920px"
  width="1920"
  height="1080"
  fetchpriority="high"
  decoding="async"
  alt="..."
/>
&lt;picture&gt;
```

- AVIF / WebP / JPEG 三套,浏览器选第一个支持的
- `srcset` 多分辨率,`sizes` 告诉浏览器目标宽度
- LCP 图明确写 `fetchpriority="high"`,**不要写 loading=lazy**

## 易错点 / 反例

### 1. LCP 图片误加 `loading="lazy"`

```html
<img src="hero.jpg" loading="lazy" />
<!-- ❌ 首屏 LCP 被延迟 -->
```

**修复**:LCP 元素去掉 lazy,加 `fetchpriority="high"`。视口下方的非 LCP 图才用 lazy。

### 2. 代码分割粒度过细 → 瀑布

```
点击按钮 → lazy 组件 A → 内部 lazy 组件 B → 内部 lazy 组件 C
```

chunk 串行下载 → 用户等三次。**修复**:

- 关键组件 preload(`<link rel="modulepreload">`)
- 路由 enter 时并行预加载(`Promise.all(import(...), import(...))`)

### 3. React.lazy 第一次加载白屏

`<Suspense fallback>` 必须 meaningful,否则用户看到空白。提供骨架屏 / spinner。

### 4. 虚拟列表项高度不一致

固定高度的虚拟列表最简单,可变高度需要"测高 + 重新定位"。`@tanstack/react-virtual` 支持动态测量,但项越多性能越敏感。

### 5. 虚拟列表破坏键盘可访问性

绝对定位 / 只渲染可见 → 屏幕阅读器 / Cmd+F 找不到内容。
**修复**:

- 虚拟列表项内放 ARIA `aria-rowindex` / `aria-setsize`
- Cmd+F 用 Page 内全文搜索方案(或服务端搜索)

### 6. AVIF 编码慢、解码可能慢

AVIF 比 WebP 更小,但**编码很慢**(build 时慢)、移动端解码也比 WebP 慢一些。极致体积场景适合,普通项目 WebP 已足够。

### 7. `content-visibility: auto` 没设 `contain-intrinsic-size`

不设占位尺寸 → 滚动条疯狂跳动(因为浏览器一开始假设元素 0 高,滚到才算实际高度)。**必配 `contain-intrinsic-size`**。

## 高频面试题(5 题)

- **Q1**: 代码分割有哪些粒度?路由级和组件级各适合什么场景?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **路由级**:每个路由一个 chunk,SPA 主要切分点。访问新路由时按需加载,首屏只加载当前路由
  - **组件级**:大对话框、编辑器、图表、地图等"用户某操作触发才需要"的组件
  - **依赖级**:bundler `splitChunks` 配置,把 vendor(react / lodash)和业务代码分开,利用长期缓存

  注意:粒度过细 → chunk 多 → HTTP 请求多,容易瀑布;粒度过粗 → 首屏大。一般路由级 + 关键组件级为主。

  &lt;details&gt;

- **Q2**: React.lazy 是怎么工作的?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `React.lazy(() => import('./X'))` 返回一个特殊组件
  - 第一次渲染时:bundler 把 `import('./X')` 产生的 chunk 单独打成文件,运行时通过网络拉取
  - 加载期间 React 触发最近的 Suspense → 显示 `fallback`
  - chunk 加载完成 → 解析 → 实际渲染 X

  错误处理:用 ErrorBoundary 捕获 chunk 加载失败(常见网络抖动)。生产建议加重试逻辑。

  &lt;details&gt;

- **Q3**: 图片懒加载用原生 `loading="lazy"` 还是 IntersectionObserver?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **`loading="lazy"`**:浏览器原生,零 JS,简单优先;Chrome 77+ / Firefox 75+ / Safari 15.4+ 支持
  - **IntersectionObserver**:JS 控制,可定制(rootMargin / 提前距离 / 进度回调),更灵活

  实战:大多数场景用 `loading="lazy"`,需要细节控制(无限滚动、曝光上报、提前 N 像素加载)再用 IntersectionObserver。

  **关键**:LCP 元素**不要懒加载**(原生 lazy 也不要),会拉低 LCP。

  &lt;details&gt;

- **Q4**: 虚拟列表的两个核心难题是什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  1. **可变项高度**:固定高度容易(乘法即可定位),可变高度需要"先测后定位",大列表测量本身耗时;`@tanstack/react-virtual` 等用懒测量 + 缓存解决
  2. **可访问性**:屏幕阅读器 / Cmd+F 找不到未渲染的项;键盘焦点跳进虚拟节点时奇怪。ARIA `aria-setsize` / `aria-rowindex` + 焦点管理可缓解,但**永远做不到 native 体验**

  其他难点:横向虚拟、可拖拽、表格列虚拟 + 行虚拟双向都是工程量大头。

  &lt;details&gt;

- **Q5**: `content-visibility: auto` 是什么?用在哪?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  CSS 属性,告诉浏览器:该元素的内部内容**可能不可见**,不可见时**跳过 layout / paint**,只在进入视口附近时才做。

  ```css
  .section {
    content-visibility: auto;
    contain-intrinsic-size: auto 500px;
  }
  ```

  适合:长博客、FAQ、评论列表等结构清晰的长页。可以让浏览器自动"虚拟化"长内容,无需 JS 写虚拟列表。

  注意:**必须配 `contain-intrinsic-size`**,否则滚动条会跳。

  &lt;details&gt;

## 延伸资源

- [React: lazy](https://react.dev/reference/react/lazy)
- [web.dev: Preload Critical Assets](https://web.dev/articles/preload-critical-assets)
- [TanStack Virtual](https://tanstack.com/virtual/latest)

## (留白) 我的理解

> 这一段不强制填。

---

## Performance API 与 PerformanceObserver

## TL;DR

> 浏览器内建 `performance.*` API 提供页面加载、资源、用户交互、自定义打点的时间数据。**`PerformanceObserver` 异步监听各类 entry**;**User Timing API**(`mark` / `measure`)是业务层打点入口;`web-vitals` 等库底层就基于这一套。

## 背景与动机

性能监控的两个基本问题:

- 怎么**精确**测量时间?(精度高于 `Date.now()`,且不受系统时钟跳变影响)
- 怎么**覆盖**各类时机?(页面加载、资源、交互、自定义业务节点)

W3C Performance 工作组定义了一系列规范(Navigation Timing / Resource Timing / User Timing / Long Tasks / Event Timing / Layout Instability / Largest Contentful Paint),浏览器在 `performance` 对象上暴露,统一通过 `PerformanceObserver` 订阅。

`web-vitals` / `boomerang` / 自建 RUM 系统都建立在这一套之上。看懂它能让你自己写性能上报、做精细化诊断。

## 核心机制

### `performance` 对象的几个核心 API

| API                                            | 用途                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `performance.now()`                            | 高精度时间戳(自 navigation start,精度毫秒至微秒,**不受系统时钟改变影响**) |
| `performance.timeOrigin`                       | 当前 navigation 的 epoch 起点(ms),`now()` 是相对它的偏移                  |
| `performance.mark(name)`                       | 在当前时刻打一个**命名**标记                                              |
| `performance.measure(name, start, end)`        | 计算两个 mark 之间的耗时,作为 measure entry                               |
| `performance.getEntries()`                     | 拿所有当前累积的 entry                                                    |
| `performance.getEntriesByType(type)`           | 按 type 过滤                                                              |
| `performance.clearMarks()` / `clearMeasures()` | 清理(防内存膨胀)                                                          |

### `PerformanceEntry` 类型清单

| Type                       | 含义                                         | 主要字段                                      |
| -------------------------- | -------------------------------------------- | --------------------------------------------- |
| `navigation`               | 页面加载各阶段时序                           | dnsLookup / connect / response / loadEvent 等 |
| `resource`                 | 每个资源(JS/CSS/Image/fetch)加载             | duration / transferSize / responseEnd         |
| `paint`                    | FP / FCP                                     | startTime                                     |
| `mark` / `measure`         | 自定义打点                                   | name / startTime / duration                   |
| `longtask`                 | > 50ms 主线程任务                            | duration / attribution                        |
| `event`                    | 用户交互事件耗时                             | processingStart / processingEnd / duration    |
| `first-input`              | 第一次交互(FID 底层)                         | -                                             |
| `largest-contentful-paint` | LCP 候选(可能多次更新)                       | element / size / url                          |
| `layout-shift`             | 布局偏移(CLS 底层)                           | value / sources / hadRecentInput              |
| `element`                  | 标记关键 LCP 元素(`elementtiming` attribute) | element                                       |

### `PerformanceObserver` 异步监听

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.entryType, entry);
  }
}).observe({
  type: 'largest-contentful-paint',
  buffered: true, // ⭐ 把订阅前已发生的 entry 也带出来
});
```

- `buffered: true` 非常重要:Observer 注册晚于事件时,仍能拿到老数据
- 一个 Observer 可订阅多种 type(用 `entryTypes: [...]` 数组),但**不能与 buffered 同用**(规范限制)

### User Timing —— 业务层打点

```js
performance.mark('start-fetch');
await fetch('/api');
performance.mark('end-fetch');

performance.measure('fetch-time', 'start-fetch', 'end-fetch');
const entries = performance.getEntriesByName('fetch-time');
console.log(entries[0].duration);
```

DevTools Performance 面板可看到这些 measure 显示为时间块,方便和浏览器原生事件对照。

### Long Task —— 卡顿源头定位

```js
new PerformanceObserver((list) => {
  for (const t of list.getEntries()) {
    console.log('long task', t.duration, t.attribution);
  }
}).observe({ type: 'longtask', buffered: true });
```

- 一个 long task = 主线程连续运行超 50ms 的任务
- attribution 给出粗粒度归因(container / src URL)
- **长任务是 INP / TBT 的直接来源**

### Event Timing —— INP 的底层

```js
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.interactionId) {
      // 这是一次真正的用户交互(click / keydown / pointerup)
      console.log(e.name, e.duration);
    }
  }
}).observe({ type: 'event', durationThreshold: 16, buffered: true });
```

`durationThreshold` 过滤短小事件,减小开销。`web-vitals` 的 INP 计算正是基于这个 API。

## 代码示例

### 自建轻量 RUM(只用 Performance API,不依赖第三方)

```js
const data = { resource: [], longtask: [], lcp: null, cls: 0, inp: 0 };

new PerformanceObserver((l) => {
  l.getEntries().forEach((r) => {
    data.resource.push({ name: r.name, dur: r.duration, size: r.transferSize });
  });
}).observe({ type: 'resource', buffered: true });

new PerformanceObserver((l) => {
  l.getEntries().forEach((t) => data.longtask.push(t.duration));
}).observe({ type: 'longtask', buffered: true });

new PerformanceObserver((l) => {
  const last = l.getEntries().pop();
  if (last) data.lcp = { v: last.startTime, el: last.element?.tagName };
}).observe({ type: 'largest-contentful-paint', buffered: true });

new PerformanceObserver((l) => {
  l.getEntries().forEach((s) => {
    if (!s.hadRecentInput) data.cls += s.value;
  });
}).observe({ type: 'layout-shift', buffered: true });

addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/rum', JSON.stringify(data));
  }
});
```

### 给 LCP 元素打 `elementtiming` 标记

```html
<img elementtiming="hero-image" src="hero.webp" />
```

然后:

```js
new PerformanceObserver((l) => {
  l.getEntries().forEach((e) => {
    if (e.identifier === 'hero-image') {
      report('hero-image-paint', e.renderTime || e.loadTime);
    }
  });
}).observe({ type: 'element', buffered: true });
```

## 易错点 / 反例

### 1. `PerformanceObserver` 没用 `buffered: true`

注册晚于事件发生 → 直接漏数据(尤其 LCP / FCP 这种早期事件)。`buffered: true` 让浏览器把缓存中的 entry 也发给你。

### 2. Long Task **不包括**子任务的分解

Long Task 报告"主线程被占用 >50ms",但**不告诉你具体函数**。要定位:

- DevTools Performance 录制看调用栈
- Chrome 117+ 的 `taskattribution` 增强
- `PerformanceObserver` 的 `attribution` 字段(粗粒度)

### 3. 性能监控代码本身的开销

观察者本身、过多 mark/measure、频繁上报都会成为性能瓶颈。原则:

- 用 `requestIdleCallback` 调度上报
- mark/measure 用完 `clearMarks()` / `clearMeasures()` 清理
- 上报用 `sendBeacon` 或 `fetch keepalive`,不阻塞主线程

### 4. `performance.now()` 与 `Date.now()` 差异

- `performance.now()`:相对 navigation,**单调递增**,精度高,**不受系统时钟改变影响**
- `Date.now()`:墙钟时间,可能被系统时间设置(NTP / 手动)突变

**测量耗时只用 performance.now()**,不要用 Date.now() 做时间差。

### 5. Safari / 老浏览器部分 API 支持差

- Long Task / Event Timing / Layout Shift API → Chromium 全支持,Safari 在 17+ 才陆续支持
- 写代码:`if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) ...`

### 6. 上报时机

- `unload` / `beforeunload` 不可靠(SPA / mobile 经常不触发)
- 用 `visibilitychange + hidden`(用户切走 tab / 关闭)
- 长会话用 batched 上报(每 N 秒或 N 条 flush 一次)

## 高频面试题(5 题)

- **Q1**: `performance.now()` 和 `Date.now()` 有什么区别?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - `performance.now()`:相对 navigation 起点的高精度时间戳(亚毫秒),**单调递增**,不受系统时钟改变(NTP 校正 / 用户改时间)影响
  - `Date.now()`:墙钟时间(自 1970),可能突变

  测量耗时 / 性能必须用 `performance.now()`,**不要**用 `Date.now()` 做时间差。

  &lt;details&gt;

- **Q2**: PerformanceObserver 的 `buffered: true` 干什么?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  让 Observer 在注册时"补领"**之前已经发生**的 entry。常用于 LCP / FCP / FP / longtask 这类页面早期事件 —— 否则 Observer 注册晚于事件发生时直接漏数据。

  限制:`buffered` 不能和 `entryTypes: [...]`(数组形式)同用,必须用单个 `type`。

  &lt;details&gt;

- **Q3**: 怎么定位"页面 INP 超标"的根因?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  组合手段:

  - `web-vitals/attribution` 上报 INP 最差事件的元素和耗时分解(input → processing → render)
  - `PerformanceObserver` 监听 `event` type,过滤 `interactionId`,记录所有交互时间
  - DevTools Performance 录制可疑场景,看主线程 long task + 用户交互重合区域
  - 检查交互 handler 是否同步重渲染大组件 / 同步 layout 强制

  &lt;details&gt;

- **Q4**: `mark` / `measure` 怎么用?它们出现在哪里?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  ```js
  performance.mark('a');
  // ...做事
  performance.mark('b');
  performance.measure('a-to-b', 'a', 'b');
  ```

  - 业务关键节点(初始化、首屏数据到达、用户登录完成)打 mark
  - measure 计算耗时,自动成为 PerformanceEntry(可被 Observer 监听)
  - **DevTools Performance** 面板里 measure 显示为时间块,和浏览器事件并排查看
  - 用完别忘 `clearMarks()` / `clearMeasures()` 清理,防内存膨胀

  &lt;details&gt;

- **Q5**: 怎么上报性能数据最稳?
  &lt;details&gt;&lt;summary&gt;答案要点&lt;summary&gt;

  - **触发时机**:`visibilitychange` 监听 `hidden`(用户切走 tab / 关闭);**不要**靠 unload / beforeunload
  - **方式**:`navigator.sendBeacon` 或 `fetch(url, { keepalive: true })`,即便页面被关闭也发出去
  - **批量**:用队列 + 节流,避免一条一发
  - **失败兜底**:必要时 localStorage 暂存,下次启动重发
  - **采样**:大流量站点不必 100%,1-10% 采样足够

  &lt;details&gt;

## 延伸资源

- [MDN: Performance API](https://developer.mozilla.org/zh-CN/docs/Web/API/Performance_API)
- [W3C: Performance Timeline](https://w3c.github.io/performance-timeline/)
- [MDN: PerformanceObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver)

## (留白) 我的理解

> 这一段不强制填。

<!-- KNOWLEDGE-IMPORT:END -->
